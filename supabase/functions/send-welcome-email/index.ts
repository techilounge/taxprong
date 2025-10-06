import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface WelcomeEmail {
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmail = await req.json();

    console.log("Sending welcome email to:", email);

    await resend.emails.send({
      from: "TaxProNG <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to TaxProNG - Your Smart Tax Management Platform",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to TaxProNG</h1>
          </div>
          <div style="padding: 30px 20px;">
            <p style="font-size: 16px;">Hi ${name},</p>
            <p style="line-height: 1.6;">Welcome to TaxProNG! We're excited to help you simplify your tax management and stay compliant with Nigeria's tax regulations.</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1a1a1a;">🚀 Get Started with These Features:</h3>
              <ul style="line-height: 1.8;">
                <li><strong>Expense Tracking:</strong> Automatically categorize and track your business expenses</li>
                <li><strong>VAT Console:</strong> Manage invoices and VAT returns with ease</li>
                <li><strong>Tax Calculator:</strong> Calculate CIT, PIT, CGT, and more</li>
                <li><strong>AI Tax Advisor:</strong> Get instant answers to tax questions</li>
                <li><strong>Compliance Calendar:</strong> Never miss a filing deadline</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('VITE_SUPABASE_URL')?.replace('supabase.co', 'lovable.app') || 'https://app.taxpro.ng'}/dashboard" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>

            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1a1a1a;">📚 Helpful Resources:</h3>
              <ul style="line-height: 1.8;">
                <li><a href="${Deno.env.get('VITE_SUPABASE_URL')?.replace('supabase.co', 'lovable.app') || 'https://app.taxpro.ng'}/knowledge" style="color: #667eea;">Knowledge Base</a> - Tax guides and documentation</li>
                <li><a href="${Deno.env.get('VITE_SUPABASE_URL')?.replace('supabase.co', 'lovable.app') || 'https://app.taxpro.ng'}/tax-qa" style="color: #667eea;">AI Tax Advisor</a> - Ask tax questions anytime</li>
                <li><a href="${Deno.env.get('VITE_SUPABASE_URL')?.replace('supabase.co', 'lovable.app') || 'https://app.taxpro.ng'}/support" style="color: #667eea;">Support Center</a> - Get help from our team</li>
              </ul>
            </div>

            <p style="line-height: 1.6;">If you have any questions or need assistance, our support team is here to help!</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #666; margin: 0;">Best regards,<br/><strong>The TaxProNG Team</strong></p>
          </div>
        </div>
      `,
    });

    console.log("Welcome email sent successfully");

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
