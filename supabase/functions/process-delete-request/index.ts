import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { logAudit } from '../_shared/auditLog.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteRequest {
  id: string;
  scope: 'user' | 'org' | 'engagement';
  scope_ref: string;
  requested_by: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      throw new Error('Unauthorized: Admin role required');
    }

    const { request_id, action, admin_notes } = await req.json();

    // Get delete request
    const { data: deleteRequest, error: fetchError } = await supabase
      .from('delete_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (fetchError || !deleteRequest) {
      throw new Error('Delete request not found');
    }

    if (action === 'deny') {
      // Update status to denied
      await supabase
        .from('delete_requests')
        .update({
          status: 'denied',
          admin_notes,
          processed_at: new Date().toISOString(),
          processed_by: user.id,
        })
        .eq('id', request_id);

      return new Response(
        JSON.stringify({ message: 'Request denied' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to processing
    await supabase
      .from('delete_requests')
      .update({ status: 'processing' })
      .eq('id', request_id);

    const counts: Record<string, number> = {};

    // Process deletion based on scope
    if (deleteRequest.scope === 'user') {
      // Anonymize user data
      const hash = btoa(deleteRequest.scope_ref).substring(0, 16);
      
      await supabase
        .from('profiles')
        .update({
          name: 'Deleted User',
          email: `deleted_${hash}@anonymized.local`,
          phone: null,
        })
        .eq('id', deleteRequest.scope_ref);

      counts.profiles = 1;
    } else if (deleteRequest.scope === 'org') {
      // Get org data
      const { data: org } = await supabase
        .from('orgs')
        .select('id')
        .eq('id', deleteRequest.scope_ref)
        .single();

      if (org) {
        // Tombstone org and scrub PII
        await supabase
          .from('orgs')
          .update({
            name: 'Deleted Organization',
            deleted_at: new Date().toISOString(),
          })
          .eq('id', deleteRequest.scope_ref);

        // Tombstone businesses
        const { data: businesses } = await supabase
          .from('businesses')
          .update({ deleted_at: new Date().toISOString() })
          .eq('org_id', deleteRequest.scope_ref)
          .select('id');

        counts.orgs = 1;
        counts.businesses = businesses?.length || 0;
      }
    } else if (deleteRequest.scope === 'engagement') {
      // Delete messages and files for engagement
      const { data: messages } = await supabase
        .from('messages')
        .delete()
        .eq('engagement_id', deleteRequest.scope_ref)
        .select('id');

      // Tombstone engagement
      await supabase
        .from('engagements')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deleteRequest.scope_ref);

      counts.messages = messages?.length || 0;
      counts.engagements = 1;
    }

    // Update delete request to processed
    await supabase
      .from('delete_requests')
      .update({
        status: 'processed',
        admin_notes,
        processed_at: new Date().toISOString(),
        processed_by: user.id,
      })
      .eq('id', request_id);

    // Log audit
    await logAudit(
      supabase,
      'delete_request',
      request_id,
      'delete',
      user.id,
      { scope: deleteRequest.scope, counts }
    );

    return new Response(
      JSON.stringify({ message: 'Request processed', counts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing delete request:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
