-- Drop the existing security_events view
DROP VIEW IF EXISTS security_events;

-- Create a security definer function that enforces admin-only access
CREATE OR REPLACE FUNCTION get_security_events()
RETURNS TABLE (
  id uuid,
  entity text,
  action audit_action,
  "time" timestamp with time zone,
  severity text,
  ip_address inet,
  user_email text,
  user_name text,
  event_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can view security events
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can view security events';
  END IF;

  -- Return the security events data
  RETURN QUERY
  SELECT 
    al.id,
    al.entity,
    al.action,
    al."time",
    al.severity,
    al.ip_address,
    p.email as user_email,
    p.name as user_name,
    CASE 
      WHEN al.severity IS NOT NULL THEN al.entity || '_' || al.severity
      ELSE al.entity
    END as event_type
  FROM audit_logs al
  LEFT JOIN profiles p ON al.user_id = p.id
  ORDER BY al."time" DESC;
END;
$$;

-- Add comment explaining the security model
COMMENT ON FUNCTION get_security_events() IS 
'Returns security event logs. Access is restricted to administrators only to prevent exposure of sensitive security information that could reveal system vulnerabilities or attack patterns.';

-- Recreate the security_events view that calls the secure function
-- This maintains backward compatibility with existing queries
CREATE VIEW security_events
WITH (security_barrier = true)
AS
SELECT * FROM get_security_events();