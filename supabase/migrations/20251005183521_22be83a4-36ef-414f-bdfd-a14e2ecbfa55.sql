-- Fix security_events view to use security_invoker instead of security_definer
DROP VIEW IF EXISTS security_events;

CREATE VIEW security_events
WITH (security_invoker = true)
AS
SELECT 
  al.id,
  al.entity,
  al.action,
  al.time,
  al.severity,
  al.ip_address,
  p.email as user_email,
  p.name as user_name,
  CASE 
    WHEN al.entity = 'profile_access' THEN 'Profile Enumeration Attempt'
    WHEN al.entity LIKE '%_tin' THEN 'TIN Access'
    WHEN al.entity = 'data_export' THEN 'Data Export'
    WHEN al.entity LIKE 'admin_%' THEN 'Admin Operation'
    ELSE 'General Access'
  END as event_type
FROM audit_logs al
LEFT JOIN profiles p ON al.user_id = p.id
WHERE al.time > NOW() - INTERVAL '30 days'
ORDER BY al.time DESC;

-- Create RLS policy for the view - only admins can access security events
CREATE POLICY "Only admins can view security events"
ON audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

COMMENT ON VIEW security_events IS 
  'Aggregated view of security-relevant events from audit logs. Uses security_invoker to enforce caller permissions. Admin access only via RLS.';