import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

export async function logAudit(
  supabase: SupabaseClient,
  entity: string,
  entityId: string,
  action: 'create' | 'update' | 'delete' | 'export' | 'submit',
  userId: string,
  payload?: any
) {
  try {
    const payloadHash = payload 
      ? btoa(JSON.stringify(payload)).substring(0, 64)
      : null;

    await supabase.from("audit_logs").insert({
      entity,
      entity_id: entityId,
      action,
      user_id: userId,
      payload_hash: payloadHash,
    });
  } catch (error) {
    console.error("Error logging audit:", error);
  }
}
