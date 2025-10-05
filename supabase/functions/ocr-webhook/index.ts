import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Rate limiting using Deno KV (in-memory for this implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 100;

serve(async (req) => {
  try {
    // JWT authentication is enforced by Supabase (verify_jwt = true in config.toml)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Extract user ID from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Parse request body
    const { expenseId, receiptUrl } = await req.json();
    
    // Validate input
    if (!expenseId || typeof expenseId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request: expenseId is required and must be a string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!receiptUrl || typeof receiptUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request: receiptUrl is required and must be a string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting check
    const rateLimitKey = `${userId}:${expenseId}`;
    const now = Date.now();
    const rateLimitEntry = rateLimitMap.get(rateLimitKey);

    if (rateLimitEntry) {
      if (now < rateLimitEntry.resetTime) {
        if (rateLimitEntry.count >= RATE_LIMIT_MAX_REQUESTS) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          );
        }
        rateLimitEntry.count++;
      } else {
        // Reset window
        rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
      }
    } else {
      rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    }

    // Verify expense ownership: check if user belongs to the same org as the expense
    const { data: expense, error: expenseCheckError } = await supabase
      .from('expenses')
      .select('org_id, user_id')
      .eq('id', expenseId)
      .single();

    if (expenseCheckError || !expense) {
      console.error('Expense not found:', expenseCheckError);
      return new Response(
        JSON.stringify({ error: 'Expense not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is member of the org
    const { data: orgMembership, error: orgError } = await supabase
      .from('org_users')
      .select('org_id')
      .eq('org_id', expense.org_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (orgError || !orgMembership) {
      console.error('Unauthorized: User not member of org:', orgError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You do not have access to this expense' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing OCR for expense ${expenseId} by user ${userId}`);
    
    // Simulate OCR processing (in production, call actual OCR service)
    // Sanitize and validate receipt URL before processing
    const sanitizedUrl = receiptUrl.trim().substring(0, 2048); // Limit URL length
    
    const ocrData = {
      merchant: "Sample Merchant",
      date: new Date().toISOString().split('T')[0],
      total: 0,
      items: [],
      confidence: 0.85,
      processed_at: new Date().toISOString(),
      processed_by: userId
    };

    const vatAmount = 0;
    const suggestedCategory = "General";
    const vatRecoverablePct = 100;

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
        JSON.stringify({ error: 'Failed to update expense with OCR data' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      entity: 'expense',
      entity_id: expenseId,
      action: 'update',
      user_id: userId,
      payload_hash: 'ocr_processing'
    });

    console.log(`OCR processing complete for expense ${expenseId}`);

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in ocr-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
