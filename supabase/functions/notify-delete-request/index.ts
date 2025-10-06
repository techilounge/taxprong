import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface DeleteRequest {
  id: string;
  scope: "user" | "organization" | "engagement";
  scope_ref: string;
  reason?: string;
  user_email: string;
  user_name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { request }: { request: DeleteRequest } = await req.json();

    console.log("Processing delete request notification:", request.id);

    const scopeLabel = {
      user: "User Account",
      organization: "Organization",
      engagement: "Engagement"
    }[request.scope];

    // Send alert to admin team
    await resend.emails.send({
      from: "TaxProNG Security <onboarding@resend.dev>",
      to: ["admin@taxpro.ng"],
      subject: `⚠️ Data Deletion Request: ${scopeLabel}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">⚠️ Data Deletion Request</h2>
          <div style="background-color: #fff3e0; padding: 20px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <p><strong>This request requires immediate attention under GDPR/data privacy regulations.</strong></p>
          </div>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Request Type:</strong> <span style="background-color: #ffcdd2; padding: 4px 8px; border-radius: 4px;">${scopeLabel}</span></p>
            <p><strong>Requester:</strong> ${request.user_name || 'N/A'} (${request.user_email})</p>
            <p><strong>Scope Reference:</strong> ${request.scope_ref}</p>
            ${request.reason ? `<p><strong>Reason:</strong></p><p style="line-height: 1.6;">${request.reason.replace(/\n/g, '<br>')}</p>` : ''}
          </div>
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Action Required:</h3>
            <ol style="line-height: 1.8;">
              <li>Review the request in the admin dashboard</li>
              <li>Verify the requester's identity and authorization</li>
              <li>Process or deny the request within 30 days</li>
              <li>Document the decision and notify the requester</li>
            </ol>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">Request ID: ${request.id}<br/>Received at ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    console.log("Delete request notification sent successfully");

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
    console.error("Error in notify-delete-request function:", error);
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
