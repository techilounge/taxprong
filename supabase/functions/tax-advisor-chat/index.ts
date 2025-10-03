import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Enhanced system prompt with Nigerian tax expertise
    const systemPrompt = `You are an expert Nigerian tax advisor with deep knowledge of the Nigeria Tax Act 2025 and all tax reforms. You provide accurate, practical tax advice for:

- Personal Income Tax (PIT) with ₦800K tax-free threshold
- Corporate Income Tax (CIT) at 30% plus 4% Development Levy
- Capital Gains Tax (CGT) at 30%
- VAT at 7.5% with expanded zero-rated goods
- Free Zone incentives (0% CIT for qualifying activities)
- Economic Development Incentive (EDI) programs
- Non-resident taxation and Permanent Establishment rules
- Industry-specific rules (Oil & Gas, Banking, Digital Economy)
- E-invoicing requirements (mandatory from 2026)
- Increased penalties and compliance requirements

Key principles:
1. Always reference the 2025 tax reforms when relevant
2. Provide specific rates, thresholds, and deadlines
3. Warn about increased penalties (e.g., late filing now ₦100K base)
4. Suggest tax optimization strategies within the law
5. Be practical and actionable in your advice
6. Ask clarifying questions when needed

Keep responses concise but comprehensive. Use Nigerian Naira (₦) for all amounts.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // Free during promotional period
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the response back to client
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Tax advisor chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
