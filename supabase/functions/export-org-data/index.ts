import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { org_id, request_id } = await req.json();

    if (!org_id || !request_id) {
      return new Response(
        JSON.stringify({ error: 'org_id and request_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Starting export for org: ${org_id}, request: ${request_id}`);

    // Update status to processing
    await supabase
      .from('data_export_requests')
      .update({ status: 'processing' })
      .eq('id', request_id);

    // Gather data from all tables
    const tables = [
      'invoices',
      'expenses',
      'vat_returns',
      'pit_profiles',
      'cit_calcs',
      'docs',
      'audit_logs'
    ];

    const exportData: Record<string, any[]> = {};

    // Fetch invoices (join with businesses)
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*, businesses!inner(org_id)')
      .eq('businesses.org_id', org_id);
    exportData.invoices = invoices || [];

    // Fetch expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('org_id', org_id);
    exportData.expenses = expenses || [];

    // Fetch VAT returns (join with businesses)
    const { data: vatReturns } = await supabase
      .from('vat_returns')
      .select('*, businesses!inner(org_id)')
      .eq('businesses.org_id', org_id);
    exportData.vat_returns = vatReturns || [];

    // Fetch PIT profiles (join with profiles and org_users)
    const { data: pitProfiles } = await supabase
      .from('pit_profiles')
      .select(`
        *,
        profiles!inner(id),
        org_users!inner(org_id)
      `)
      .eq('org_users.org_id', org_id);
    exportData.pit_profiles = pitProfiles || [];

    // Fetch CIT calcs (join with businesses)
    const { data: citCalcs } = await supabase
      .from('cit_calcs')
      .select('*, businesses!inner(org_id)')
      .eq('businesses.org_id', org_id);
    exportData.cit_calcs = citCalcs || [];

    // Fetch docs (metadata only)
    const { data: docs } = await supabase
      .from('docs')
      .select('id, doc_type, tags, linked_entity, created_at')
      .eq('org_id', org_id);
    exportData.docs = docs || [];

    // Fetch audit logs
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .in('user_id', (await supabase
        .from('org_users')
        .select('user_id')
        .eq('org_id', org_id)
      ).data?.map(ou => ou.user_id) || [])
      .limit(1000);
    exportData.audit_logs = auditLogs || [];

    console.log('Data fetched:', Object.keys(exportData).map(k => `${k}: ${exportData[k].length} rows`));

    // Convert to CSV format for each table
    const csvFiles: Record<string, string> = {};
    
    for (const [tableName, rows] of Object.entries(exportData)) {
      if (rows.length === 0) {
        csvFiles[tableName] = '';
        continue;
      }

      // Get all column names
      const columns = Object.keys(rows[0]);
      
      // Create CSV header
      let csv = columns.join(',') + '\n';
      
      // Add rows
      for (const row of rows) {
        const values = columns.map(col => {
          const value = row[col];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
          return String(value).replace(/"/g, '""');
        });
        csv += values.map(v => `"${v}"`).join(',') + '\n';
      }
      
      csvFiles[tableName] = csv;
    }

    // Create a summary JSON file
    const summaryJson = JSON.stringify({
      org_id,
      export_date: new Date().toISOString(),
      tables: Object.keys(exportData).map(table => ({
        name: table,
        row_count: exportData[table].length
      }))
    }, null, 2);

    // For simplicity, we'll upload each file separately instead of zipping
    // In production, you'd want to use a proper zip library
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const exportFolder = `org-${org_id}/export-${timestamp}`;

    // Upload summary
    const summaryPath = `${exportFolder}/summary.json`;
    await supabase.storage
      .from('data-exports')
      .upload(summaryPath, new Blob([summaryJson], { type: 'application/json' }));

    // Upload CSV files
    for (const [tableName, csvContent] of Object.entries(csvFiles)) {
      if (csvContent) {
        const csvPath = `${exportFolder}/${tableName}.csv`;
        await supabase.storage
          .from('data-exports')
          .upload(csvPath, new Blob([csvContent], { type: 'text/csv' }));
      }
    }

    console.log(`Files uploaded to: ${exportFolder}`);

    // Update request with success
    await supabase
      .from('data_export_requests')
      .update({
        status: 'ready',
        file_url: exportFolder,
        finished_at: new Date().toISOString()
      })
      .eq('id', request_id);

    // Generate download links for all files
    const files = ['summary.json', ...Object.keys(csvFiles).filter(t => csvFiles[t]).map(t => `${t}.csv`)];
    const downloadLinks = await Promise.all(
      files.map(async (file) => {
        const { data } = await supabase.storage
          .from('data-exports')
          .createSignedUrl(`${exportFolder}/${file}`, 3600); // 1 hour expiry
        return { file, url: data?.signedUrl };
      })
    );

    console.log('Export completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        folder: exportFolder,
        files: downloadLinks
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in export-org-data:', error);

    // Try to update request status to failed
    try {
      const { request_id } = await req.json();
      if (request_id) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('data_export_requests')
          .update({
            status: 'failed',
            error_message: error.message,
            finished_at: new Date().toISOString()
          })
          .eq('id', request_id);
      }
    } catch (updateError) {
      console.error('Failed to update request status:', updateError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});