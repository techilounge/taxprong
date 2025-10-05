import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SupportRequest {
  name: string;
  email: string;
  category: "technical" | "billing" | "feature" | "other";
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, category, subject, message }: SupportRequest = await req.json();

    // Validate input
    if (!name || !email || !category || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // For now, just log the support request
    // In production, you would send this via Resend or store in database
    console.log("Support request received:", {
      name,
      email,
      category,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    // TODO: Integrate with Resend for actual email sending
    // const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    // await resend.emails.send({
    //   from: "TaxProNG Support <support@taxpro.ng>",
    //   to: ["support@taxpro.ng"],
    //   replyTo: email,
    //   subject: `[${category.toUpperCase()}] ${subject}`,
    //   html: `
    //     <h2>New Support Request</h2>
    //     <p><strong>From:</strong> ${name} (${email})</p>
    //     <p><strong>Category:</strong> ${category}</p>
    //     <p><strong>Subject:</strong> ${subject}</p>
    //     <hr />
    //     <p>${message}</p>
    //   `,
    // });

    // Send auto-reply confirmation
    // await resend.emails.send({
    //   from: "TaxProNG Support <support@taxpro.ng>",
    //   to: [email],
    //   subject: "We received your support request",
    //   html: `
    //     <h2>Thank you for contacting TaxProNG Support</h2>
    //     <p>Hi ${name},</p>
    //     <p>We've received your support request and will get back to you within 24 hours.</p>
    //     <p><strong>Your request:</strong></p>
    //     <p><strong>Category:</strong> ${category}</p>
    //     <p><strong>Subject:</strong> ${subject}</p>
    //     <hr />
    //     <p>Best regards,<br/>The TaxProNG Team</p>
    //   `,
    // });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Support request received successfully" 
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
