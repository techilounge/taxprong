-- Phase 2: High-Priority Security Improvements

-- 1. Create automated monitoring system
CREATE TABLE IF NOT EXISTS security_monitoring_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  schedule_cron text, -- For scheduled checks (e.g., '0 0 * * *' for daily)
  alert_threshold integer,
  last_run_at timestamp with time zone,
  next_run_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE security_monitoring_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage monitoring config"
ON security_monitoring_config FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Create security alerts table for tracking
CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  details jsonb,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view security alerts"
ON security_alerts FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can manage security alerts"
ON security_alerts FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Create function to automatically check for security issues
CREATE OR REPLACE FUNCTION run_automated_security_checks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  check_result RECORD;
  alert_count integer := 0;
BEGIN
  -- Run health check and create alerts for failures
  FOR check_result IN 
    SELECT * FROM run_security_health_check()
    WHERE status IN ('fail', 'warning')
  LOOP
    INSERT INTO security_alerts (
      alert_type,
      severity,
      title,
      description,
      details
    ) VALUES (
      'health_check_failure',
      check_result.severity,
      check_result.check_name,
      check_result.details,
      jsonb_build_object(
        'recommendation', check_result.recommendation,
        'check_time', now()
      )
    );
    alert_count := alert_count + 1;
  END LOOP;

  -- Check for suspicious patterns
  FOR check_result IN
    SELECT * FROM detect_suspicious_access_patterns()
    WHERE severity IN ('high', 'critical')
  LOOP
    INSERT INTO security_alerts (
      alert_type,
      severity,
      title,
      description,
      details
    ) VALUES (
      'suspicious_activity',
      check_result.severity,
      'Suspicious Access Pattern Detected',
      'User ' || check_result.user_id || ' made ' || check_result.request_count || ' requests for ' || check_result.action_type,
      jsonb_build_object(
        'user_id', check_result.user_id,
        'action_type', check_result.action_type,
        'request_count', check_result.request_count,
        'first_request', check_result.first_request,
        'last_request', check_result.last_request
      )
    );
    alert_count := alert_count + 1;
  END LOOP;

  -- Check for high rate of failed rate limits
  IF EXISTS (
    SELECT 1 FROM audit_logs
    WHERE payload_hash = 'rate_limited'
    AND time > NOW() - INTERVAL '1 hour'
    HAVING COUNT(*) > 50
  ) THEN
    INSERT INTO security_alerts (
      alert_type,
      severity,
      title,
      description,
      details
    ) VALUES (
      'rate_limit_abuse',
      'high',
      'High Rate of Rate Limit Failures',
      'More than 50 rate limit failures detected in the last hour',
      jsonb_build_object(
        'check_time', now(),
        'threshold', 50
      )
    );
    alert_count := alert_count + 1;
  END IF;

  -- Log the automated check
  INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash, severity)
  VALUES (
    'automated_security_check',
    gen_random_uuid()::text,
    'create',
    '00000000-0000-0000-0000-000000000000', -- System user
    'alerts_created_' || alert_count::text,
    CASE WHEN alert_count > 0 THEN 'high' ELSE 'low' END
  );
END;
$$;

COMMENT ON FUNCTION run_automated_security_checks IS 'Automated security check function that runs health checks, detects suspicious patterns, and creates alerts. Should be scheduled to run regularly.';

-- 4. Create function to get unresolved security alerts
CREATE OR REPLACE FUNCTION get_unresolved_security_alerts()
RETURNS TABLE(
  id uuid,
  alert_type text,
  severity text,
  title text,
  description text,
  details jsonb,
  created_at timestamp with time zone,
  age_hours numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can view security alerts';
  END IF;
  
  RETURN QUERY
  SELECT 
    sa.id,
    sa.alert_type,
    sa.severity,
    sa.title,
    sa.description,
    sa.details,
    sa.created_at,
    EXTRACT(EPOCH FROM (NOW() - sa.created_at)) / 3600 as age_hours
  FROM security_alerts sa
  WHERE sa.resolved = false
  ORDER BY 
    CASE sa.severity
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      ELSE 4
    END,
    sa.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_unresolved_security_alerts IS 'Returns all unresolved security alerts ordered by severity and age. Admin only.';

-- 5. Create function to resolve security alerts
CREATE OR REPLACE FUNCTION resolve_security_alert(_alert_id uuid, _resolution_notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can resolve
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can resolve security alerts';
  END IF;
  
  UPDATE security_alerts
  SET 
    resolved = true,
    resolved_at = now(),
    resolved_by = auth.uid(),
    details = CASE 
      WHEN _resolution_notes IS NOT NULL 
      THEN jsonb_set(COALESCE(details, '{}'::jsonb), '{resolution_notes}', to_jsonb(_resolution_notes))
      ELSE details
    END
  WHERE id = _alert_id;
  
  -- Log the resolution
  INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash, severity)
  VALUES (
    'security_alert_resolved',
    _alert_id::text,
    'update',
    auth.uid(),
    'alert_resolved',
    'medium'
  );
END;
$$;

COMMENT ON FUNCTION resolve_security_alert IS 'Marks a security alert as resolved. Admin only.';

-- 6. Create profile access monitoring function
CREATE OR REPLACE FUNCTION audit_profile_access_pattern()
RETURNS TABLE(
  user_id uuid,
  profile_queries_count bigint,
  unique_profiles_accessed bigint,
  last_access timestamp with time zone,
  risk_level text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can view profile access patterns';
  END IF;
  
  RETURN QUERY
  SELECT 
    al.user_id,
    COUNT(*) as profile_queries_count,
    COUNT(DISTINCT al.entity_id) as unique_profiles_accessed,
    MAX(al.time) as last_access,
    CASE 
      WHEN COUNT(*) > 100 THEN 'high'
      WHEN COUNT(*) > 50 THEN 'medium'
      ELSE 'low'
    END::text as risk_level
  FROM audit_logs al
  WHERE al.entity = 'profile_access'
    AND al.time > NOW() - INTERVAL '24 hours'
  GROUP BY al.user_id
  HAVING COUNT(*) > 10  -- Only show users with more than 10 accesses
  ORDER BY COUNT(*) DESC;
END;
$$;

COMMENT ON FUNCTION audit_profile_access_pattern IS 'Analyzes profile access patterns to detect potential enumeration attacks. Admin only.';

-- 7. Insert default monitoring configurations
INSERT INTO security_monitoring_config (check_type, schedule_cron, alert_threshold, next_run_at) VALUES
  ('automated_security_checks', '0 0 * * *', 0, NOW() + INTERVAL '1 day'), -- Daily at midnight
  ('suspicious_patterns_scan', '0 */6 * * *', 5, NOW() + INTERVAL '6 hours'), -- Every 6 hours
  ('profile_access_audit', '0 */12 * * *', 10, NOW() + INTERVAL '12 hours') -- Every 12 hours
ON CONFLICT DO NOTHING;

-- 8. Create view for security dashboard (safe for admins)
CREATE OR REPLACE VIEW security_dashboard_enhanced AS
SELECT 
  (SELECT COUNT(*) FROM security_alerts WHERE resolved = false) as unresolved_alerts,
  (SELECT COUNT(*) FROM security_alerts WHERE resolved = false AND severity IN ('critical', 'high')) as critical_alerts,
  (SELECT COUNT(*) FROM audit_logs WHERE time > NOW() - INTERVAL '24 hours') as events_24h,
  (SELECT COUNT(*) FROM audit_logs WHERE time > NOW() - INTERVAL '24 hours' AND severity IN ('high', 'critical')) as critical_events_24h,
  (SELECT COUNT(DISTINCT user_id) FROM audit_logs WHERE time > NOW() - INTERVAL '24 hours') as active_users_24h,
  (SELECT last_run_at FROM security_monitoring_config WHERE check_type = 'automated_security_checks' ORDER BY last_run_at DESC LIMIT 1) as last_security_check,
  NOW() as dashboard_updated_at;

-- Create secure function for dashboard access (since views can't have RLS)
CREATE OR REPLACE FUNCTION get_security_dashboard_enhanced()
RETURNS TABLE(
  unresolved_alerts bigint,
  critical_alerts bigint,
  events_24h bigint,
  critical_events_24h bigint,
  active_users_24h bigint,
  last_security_check timestamp with time zone,
  dashboard_updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can view security dashboard';
  END IF;
  
  RETURN QUERY SELECT * FROM security_dashboard_enhanced;
END;
$$;

COMMENT ON FUNCTION get_security_dashboard_enhanced IS 'Enhanced security dashboard with alert tracking. Admin only.';