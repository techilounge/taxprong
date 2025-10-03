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
    const { expenseId, receiptUrl } = await req.json();
    
    if (!expenseId || !receiptUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing expenseId or receiptUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Simulate OCR processing (in production, call actual OCR service)
    console.log('Processing OCR for receipt:', receiptUrl);
    
    // Mock OCR results with common receipt data
    const ocrData = {
      merchant: "Sample Merchant",
      date: new Date().toISOString().split('T')[0],
      total: 0,
      items: [],
      confidence: 0.85,
      processed_at: new Date().toISOString()
    };

    // Calculate VAT from items if present, otherwise estimate from total
    let vatAmount = 0;
    let suggestedCategory = "General";
    let vatRecoverablePct = 100;

    // Update expense with OCR data
    const { data, error } = await supabase
      .from('expenses')
      .update({
        ocr_json: ocrData,
        vat_amount: vatAmount || null,
        category: suggestedCategory,
        vat_recoverable_pct: vatRecoverablePct
      })
      .eq('id', expenseId)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('OCR processing complete for expense:', expenseId);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ocr-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});