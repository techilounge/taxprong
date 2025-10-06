import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ServiceRequest {
  id: string;
  service_type: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  company_name?: string;
  budget_range?: string;
  preferred_date?: string;
  description: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { request }: { request: ServiceRequest } = await req.json();

    console.log("Processing professional services request:", request.id);

    // Send notification to admin team
    await resend.emails.send({
      from: "TaxProNG Services <onboarding@resend.dev>",
      to: ["services@taxpro.ng"],
      replyTo: request.contact_email,
      subject: `New Professional Services Request: ${request.service_type}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">New Professional Services Request</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Service Type:</strong> <span style="background-color: #e0e0e0; padding: 4px 8px; border-radius: 4px;">${request.service_type}</span></p>
            <p><strong>Contact Name:</strong> ${request.contact_name}</p>
            <p><strong>Email:</strong> ${request.contact_email}</p>
            ${request.contact_phone ? `<p><strong>Phone:</strong> ${request.contact_phone}</p>` : ''}
            ${request.company_name ? `<p><strong>Company:</strong> ${request.company_name}</p>` : ''}
            ${request.budget_range ? `<p><strong>Budget Range:</strong> ${request.budget_range}</p>` : ''}
            ${request.preferred_date ? `<p><strong>Preferred Date:</strong> ${request.preferred_date}</p>` : ''}
          </div>
          <div style="margin: 20px 0;">
            <h3 style="color: #1a1a1a;">Description:</h3>
            <p style="line-height: 1.6;">${request.description.replace(/\n/g, '<br>')}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">Request ID: ${request.id}<br/>Received at ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    // Send confirmation to requester
    await resend.emails.send({
      from: "TaxProNG Services <onboarding@resend.dev>",
      to: [request.contact_email],
      subject: "We received your service request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Thank you for your interest in TaxProNG Professional Services</h2>
          <p>Hi ${request.contact_name},</p>
          <p>We've received your request for <strong>${request.service_type}</strong> services and our team will review it shortly.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Request Details:</h3>
            <p><strong>Service:</strong> ${request.service_type}</p>
            ${request.budget_range ? `<p><strong>Budget Range:</strong> ${request.budget_range}</p>` : ''}
            ${request.preferred_date ? `<p><strong>Preferred Date:</strong> ${request.preferred_date}</p>` : ''}
            <p style="margin-bottom: 0;"><strong>Description:</strong></p>
            <p style="line-height: 1.6; margin-top: 8px;">${request.description.replace(/\n/g, '<br>')}</p>
          </div>
          <p>Our team will contact you within 1-2 business days to discuss your needs and provide a customized quote.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          <p style="color: #666;">Best regards,<br/>The TaxProNG Professional Services Team</p>
        </div>
      `,
    });

    console.log("Service request emails sent successfully");

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
    console.error("Error in notify-service-request function:", error);
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
