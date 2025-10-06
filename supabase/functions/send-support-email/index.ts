import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SupportRequest {
  name: string;
  email: string;
  category: "technical" | "billing" | "feature" | "other";
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, category, subject, message }: SupportRequest = await req.json();

    if (!name || !email || !category || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Processing support request from:", email);

    // Send notification to support team
    await resend.emails.send({
      from: "TaxProNG Support <onboarding@resend.dev>",
      to: ["support@taxpro.ng"],
      replyTo: email,
      subject: `[${category.toUpperCase()}] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">New Support Request</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Category:</strong> <span style="background-color: #e0e0e0; padding: 4px 8px; border-radius: 4px;">${category}</span></p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="margin: 20px 0;">
            <h3 style="color: #1a1a1a;">Message:</h3>
            <p style="line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">Received at ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    // Send auto-reply to user
    await resend.emails.send({
      from: "TaxProNG Support <onboarding@resend.dev>",
      to: [email],
      subject: "We received your support request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Thank you for contacting TaxProNG Support</h2>
          <p>Hi ${name},</p>
          <p>We've received your support request and will get back to you within 24 hours.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Request:</h3>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p style="margin-bottom: 0;"><strong>Message:</strong></p>
            <p style="line-height: 1.6; margin-top: 8px;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          <p>If you have any additional information to add, please reply to this email.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          <p style="color: #666;">Best regards,<br/>The TaxProNG Team</p>
        </div>
      `,
    });

    console.log("Support emails sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Support request sent successfully. We'll get back to you within 24 hours." 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-support-email function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send support request. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
