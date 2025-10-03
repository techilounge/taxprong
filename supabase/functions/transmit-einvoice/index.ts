import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invoiceId } = await req.json();

    if (!invoiceId) {
      throw new Error('Invoice ID is required');
    }

    console.log(`Transmitting e-invoice: ${invoiceId}`);

    // Fetch the invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (fetchError) throw fetchError;

    // Simulate e-filing system validation
    const validationIssues: string[] = [];
    
    if (!invoice.counterparty_tin || invoice.counterparty_tin.length < 8) {
      validationIssues.push('Invalid or missing counterparty TIN');
    }
    
    if (!invoice.net || invoice.net <= 0) {
      validationIssues.push('Net amount must be positive');
    }
    
    if (!invoice.issue_date) {
      validationIssues.push('Issue date is required');
    }

    // Simulate 20% failure rate for testing
    const shouldFail = Math.random() < 0.2 || validationIssues.length > 0;
    
    let newStatus: 'queued' | 'accepted' | 'rejected';
    let rejectionReason: string | null = null;
    let locked = false;
    
    if (shouldFail) {
      newStatus = 'rejected';
      rejectionReason = validationIssues.length > 0 
        ? validationIssues.join('; ')
        : 'EFS system validation failed: Document format error';
    } else {
      newStatus = Math.random() < 0.3 ? 'queued' : 'accepted';
      if (newStatus === 'accepted') {
        locked = true;
      }
    }

    // Generate a mock e-invoice ID for accepted invoices
    const einvoiceId = newStatus === 'accepted' 
      ? `EFS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      : invoice.einvoice_id;

    // Update invoice status
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        efs_status: newStatus,
        efs_rejection_reason: rejectionReason,
        locked: locked,
        einvoice_id: einvoiceId,
      })
      .eq('id', invoiceId);

    if (updateError) throw updateError;

    console.log(`E-invoice ${invoiceId} transmission result: ${newStatus}`);

    return new Response(
      JSON.stringify({
        success: true,
        status: newStatus,
        rejectionReason: rejectionReason,
        einvoiceId: einvoiceId,
        message: newStatus === 'accepted' 
          ? 'Invoice successfully accepted by EFS' 
          : newStatus === 'queued'
          ? 'Invoice queued for processing'
          : 'Invoice rejected by EFS'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error transmitting e-invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
