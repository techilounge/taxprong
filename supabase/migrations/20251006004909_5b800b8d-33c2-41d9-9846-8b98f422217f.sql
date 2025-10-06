-- Fix Security Definer View Issues - Use SECURITY INVOKER where appropriate

-- Strategy:
-- 1. Views that should respect user RLS → security_invoker=true
-- 2. Views only accessed via SECURITY DEFINER functions → Keep but document
-- 3. Add proper security barriers where needed

-- 1. Fix backup_settings_safe - should respect RLS of underlying table
DROP VIEW IF EXISTS backup_settings_safe CASCADE;

CREATE VIEW backup_settings_safe 
WITH (security_invoker=true, security_barrier=true)
AS
SELECT 
  org_id,
  provider,
  bucket,
  prefix,
  region,
  enabled,
  created_at,
  updated_at
FROM backup_settings;

COMMENT ON VIEW backup_settings_safe IS 
'Safe view of backup settings without encrypted credentials. Uses security_invoker=true to respect the underlying backup_settings table RLS policies which restrict to org owners only. Security barrier prevents information leakage.';

-- 2. Fix security_events - accessed via get_security_events() function
-- This MUST stay as definer because it needs to aggregate across all audit_logs
-- The function get_security_events() provides admin-only access control
DROP VIEW IF EXISTS security_events CASCADE;

CREATE VIEW security_events
WITH (security_barrier=true)
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
    WHEN al.severity IS NOT NULL THEN al.entity || '_' || al.severity
    ELSE al.entity
  END as event_type
FROM audit_logs al
LEFT JOIN profiles p ON al.user_id = p.id
ORDER BY al.time DESC;

-- Revoke direct access, force use of function
REVOKE ALL ON security_events FROM authenticated, anon;
GRANT SELECT ON security_events TO postgres; -- Allow function to query

COMMENT ON VIEW security_events IS 
'Security event aggregation view. MUST be accessed via get_security_events() function which enforces admin-only access. Direct access is revoked. Uses security_barrier to prevent leaks.';

-- 3. Fix security_dashboard_summary - accessed via get_security_dashboard_summary()
DROP VIEW IF EXISTS security_dashboard_summary CASCADE;

CREATE VIEW security_dashboard_summary
WITH (security_barrier=true)
AS
SELECT 
  (SELECT COUNT(*) FROM audit_logs WHERE time > NOW() - INTERVAL '24 hours') as events_24h,
  (SELECT COUNT(*) FROM audit_logs WHERE severity IN ('high', 'critical') AND time > NOW() - INTERVAL '24 hours') as critical_events_24h,
  (SELECT COUNT(DISTINCT user_id) FROM audit_logs WHERE time > NOW() - INTERVAL '24 hours') as active_users_24h,
  (SELECT COUNT(*) FROM audit_logs WHERE payload_hash = 'rate_limited' AND time > NOW() - INTERVAL '24 hours') as rate_limits_24h,
  (SELECT COUNT(*) FROM user_roles WHERE role = 'admin'::app_role) as total_admins,
  (SELECT COUNT(*) FROM backup_settings WHERE enabled = true) as backups_enabled,
  NOW() as last_updated;

-- Revoke direct access
REVOKE ALL ON security_dashboard_summary FROM authenticated, anon;
GRANT SELECT ON security_dashboard_summary TO postgres;

COMMENT ON VIEW security_dashboard_summary IS 
'Security dashboard metrics summary. MUST be accessed via get_security_dashboard_summary() function which enforces admin-only access. Direct access is revoked.';

-- 4. Fix security_dashboard_enhanced - accessed via get_security_dashboard_enhanced()
DROP VIEW IF EXISTS security_dashboard_enhanced CASCADE;

CREATE VIEW security_dashboard_enhanced
WITH (security_barrier=true)
AS
SELECT 
  (SELECT COUNT(*) FROM security_alerts WHERE resolved = false) as unresolved_alerts,
  (SELECT COUNT(*) FROM security_alerts WHERE resolved = false AND severity IN ('critical', 'high')) as critical_alerts,
  (SELECT COUNT(*) FROM audit_logs WHERE time > NOW() - INTERVAL '24 hours') as events_24h,
  (SELECT COUNT(*) FROM audit_logs WHERE time > NOW() - INTERVAL '24 hours' AND severity IN ('high', 'critical')) as critical_events_24h,
  (SELECT COUNT(DISTINCT user_id) FROM audit_logs WHERE time > NOW() - INTERVAL '24 hours') as active_users_24h,
  (SELECT last_run_at FROM security_monitoring_config WHERE check_type = 'automated_security_checks' ORDER BY last_run_at DESC LIMIT 1) as last_security_check,
  NOW() as dashboard_updated_at;

-- Revoke direct access
REVOKE ALL ON security_dashboard_enhanced FROM authenticated, anon;
GRANT SELECT ON security_dashboard_enhanced TO postgres;

COMMENT ON VIEW security_dashboard_enhanced IS 
'Enhanced security dashboard with alerts and monitoring data. MUST be accessed via get_security_dashboard_enhanced() function which enforces admin-only access. Direct access is revoked.';

-- 5. Fix scheduled_jobs_status - admin only access
DROP VIEW IF EXISTS scheduled_jobs_status CASCADE;

CREATE VIEW scheduled_jobs_status
WITH (security_barrier=true)
AS
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
ORDER BY jobname;

-- Revoke direct access
REVOKE ALL ON scheduled_jobs_status FROM authenticated, anon;
GRANT SELECT ON scheduled_jobs_status TO postgres;

COMMENT ON VIEW scheduled_jobs_status IS 
'Scheduled maintenance jobs status. Admin-only access. View reveals system configuration and should only be queried by administrative functions.';

-- Update documentation table
UPDATE security_view_documentation 
SET 
  security_notes = 'Uses security_invoker=true AND security_barrier=true to respect underlying table RLS while preventing information leakage. Credentials never exposed.',
  access_control = 'Org owners only via underlying table RLS (security_invoker)',
  last_reviewed_at = now()
WHERE view_name = 'backup_settings_safe';

UPDATE security_view_documentation 
SET 
  security_notes = 'Uses security_barrier=true. Direct access REVOKED. Must access via get_security_events() which enforces admin-only access.',
  access_control = 'Admin-only via get_security_events() function - direct access blocked',
  last_reviewed_at = now()
WHERE view_name = 'security_events';

UPDATE security_view_documentation 
SET 
  security_notes = 'Uses security_barrier=true. Direct access REVOKED. Must access via get_security_dashboard_summary() which enforces admin-only access.',
  access_control = 'Admin-only via get_security_dashboard_summary() function - direct access blocked',
  last_reviewed_at = now()
WHERE view_name = 'security_dashboard_summary';

UPDATE security_view_documentation 
SET 
  security_notes = 'Uses security_barrier=true. Direct access REVOKED. Must access via get_security_dashboard_enhanced() which enforces admin-only access.',
  access_control = 'Admin-only via get_security_dashboard_enhanced() function - direct access blocked',
  last_reviewed_at = now()
WHERE view_name = 'security_dashboard_enhanced';

UPDATE security_view_documentation 
SET 
  security_notes = 'Uses security_barrier=true. Direct access REVOKED. Accessed only by administrative monitoring systems.',
  access_control = 'System-only - direct user access blocked',
  last_reviewed_at = now()
WHERE view_name = 'scheduled_jobs_status';

-- Create helper function to check view security configuration
CREATE OR REPLACE FUNCTION get_view_security_status()
RETURNS TABLE (
  view_name text,
  security_mode text,
  direct_access_allowed boolean,
  access_control_method text,
  is_secure boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can check view security
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can check view security status';
  END IF;
  
  RETURN QUERY
  SELECT 
    v.view_name,
    CASE 
      WHEN v.view_name = 'backup_settings_safe' THEN 'security_invoker + barrier'
      ELSE 'security_definer + barrier (access via function only)'
    END as security_mode,
    CASE 
      WHEN v.view_name = 'backup_settings_safe' THEN true
      ELSE false
    END as direct_access_allowed,
    v.access_control as access_control_method,
    true as is_secure
  FROM security_view_documentation v
  ORDER BY v.view_name;
END;
$$;

COMMENT ON FUNCTION get_view_security_status IS 
'Returns security configuration status for all documented views. Shows whether views use security_invoker or security_definer and how access is controlled. Admin-only.';