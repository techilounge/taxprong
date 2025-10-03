import { supabase } from "@/integrations/supabase/client";

type AuditAction = "create" | "update" | "delete" | "export" | "submit";

export async function logAudit(
  entity: string,
  entityId: string,
  action: AuditAction,
  userId: string,
  payload?: any
) {
  try {
    const payloadHash = payload 
      ? btoa(JSON.stringify(payload)).substring(0, 64)
      : null;

    const { error } = await supabase.from("audit_logs").insert({
      entity,
      entity_id: entityId,
      action,
      user_id: userId,
      payload_hash: payloadHash,
    });

    if (error) {
      console.error("Error logging audit:", error);
    }
  } catch (error) {
    console.error("Error in logAudit:", error);
  }
}
