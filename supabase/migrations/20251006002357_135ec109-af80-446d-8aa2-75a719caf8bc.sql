-- Phase 3: Monitoring & Maintenance

-- 3.1: Comprehensive Security Health Check
CREATE OR REPLACE FUNCTION run_security_health_check()
RETURNS TABLE (
  check_name text,
  status text,
  severity text,
  details text,
  recommendation text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can run security health checks
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can run security health checks';
  END IF;

  -- Check 1: Tables without RLS enabled
  RETURN QUERY
  SELECT 
    'Tables without RLS'::text as check_name,
    CASE 
      WHEN COUNT(*) > 0 THEN 'fail'
      ELSE 'pass'
    END::text as status,
    CASE 
      WHEN COUNT(*) > 0 THEN 'critical'
      ELSE 'info'
    END::text as severity,
    'Found ' || COUNT(*) || ' tables without RLS enabled'::text as details,
    'Enable RLS on all tables containing user data'::text as recommendation
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename NOT IN ('schema_migrations')
  AND NOT (
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = pg_tables.tablename 
    AND relnamespace = 'public'::regnamespace
  );

  -- Check 2: Failed authentication attempts in last hour
  RETURN QUERY
  SELECT 
    'Failed Auth Attempts'::text,
    CASE 
      WHEN COUNT(*) > 100 THEN 'fail'
      WHEN COUNT(*) > 50 THEN 'warning'
      ELSE 'pass'
    END::text,
    CASE 
      WHEN COUNT(*) > 100 THEN 'high'
      WHEN COUNT(*) > 50 THEN 'medium'
      ELSE 'low'
    END::text,
    'Found ' || COUNT(*) || ' failed auth attempts in last hour'::text,
    'Monitor for brute force attacks. Consider implementing account lockout.'::text
  FROM audit_logs
  WHERE entity LIKE '%auth%'
    AND payload_hash = 'rate_limited'
    AND time > NOW() - INTERVAL '1 hour';

  -- Check 3: High privilege users (admins and pros)
  RETURN QUERY
  SELECT 
    'High Privilege Users'::text,
    CASE 
      WHEN COUNT(*) > 10 THEN 'warning'
      ELSE 'pass'
    END::text,
    'medium'::text,
    'Found ' || COUNT(*) || ' users with admin role'::text,
    'Review admin access regularly. Remove unnecessary admin privileges.'::text
  FROM user_roles
  WHERE role = 'admin'::app_role;

  -- Check 4: Unaudited sensitive data access
  RETURN QUERY
  SELECT 
    'Sensitive Data Access'::text,
    CASE 
      WHEN COUNT(*) = 0 THEN 'fail'
      ELSE 'pass'
    END::text,
    CASE 
      WHEN COUNT(*) = 0 THEN 'medium'
      ELSE 'info'
    END::text,
    'Found ' || COUNT(*) || ' TIN access logs in last 24h'::text,
    'Ensure all sensitive data access is logged via audit_sensitive_access()'::text
  FROM audit_logs
  WHERE entity LIKE '%_tin'
    AND time > NOW() - INTERVAL '24 hours';

  -- Check 5: Backup configuration
  RETURN QUERY
  SELECT 
    'Backup Configuration'::text,
    CASE 
      WHEN COUNT(*) > 0 THEN 'pass'
      ELSE 'warning'
    END::text,
    CASE 
      WHEN COUNT(*) > 0 THEN 'info'
      ELSE 'medium'
    END::text,
    'Found ' || COUNT(*) || ' organizations with backup enabled'::text,
    'Configure automated backups for all production organizations'::text
  FROM backup_settings
  WHERE enabled = true;

  -- Check 6: Recent data exports
  RETURN QUERY
  SELECT 
    'Recent Data Exports'::text,
    CASE 
      WHEN COUNT(*) > 50 THEN 'warning'
      ELSE 'pass'
    END::text,
    CASE 
      WHEN COUNT(*) > 50 THEN 'medium'
      ELSE 'info'
    END::text,
    'Found ' || COUNT(*) || ' data exports in last 7 days'::text,
    'Monitor for unusual export patterns that may indicate data exfiltration'::text
  FROM data_export_requests
  WHERE created_at > NOW() - INTERVAL '7 days';

  -- Check 7: Orphaned sessions
  RETURN QUERY
  SELECT 
    'Active Sessions'::text,
    'info'::text,
    'info'::text,
    'Monitor active user sessions'::text,
    'Review and revoke suspicious sessions through auth.users'::text;

END;
$$;

-- 3.2: Security Alert Triggers
-- Function to check for suspicious bulk data access
CREATE OR REPLACE FUNCTION check_bulk_access_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Count recent similar accesses by this user
  SELECT COUNT(*)
  INTO recent_count
  FROM audit_logs
  WHERE user_id = NEW.user_id
    AND entity = NEW.entity
    AND time > NOW() - INTERVAL '5 minutes';

  -- If more than 10 accesses in 5 minutes, log high severity alert
  IF recent_count > 10 THEN
    NEW.severity := 'high';
    
    -- Also insert a separate alert
    INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash, severity)
    VALUES (
      'bulk_access_alert',
      NEW.user_id::text,
      'read',
      NEW.user_id,
      'rapid_access_detected',
      'high'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for bulk access detection
DROP TRIGGER IF EXISTS trigger_bulk_access_alert ON audit_logs;
CREATE TRIGGER trigger_bulk_access_alert
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION check_bulk_access_alert();

-- 3.3: Security Metrics for Dashboard
CREATE OR REPLACE FUNCTION get_security_metrics(_days integer DEFAULT 30)
RETURNS TABLE (
  metric_name text,
  metric_value numeric,
  trend text,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can view metrics
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can view security metrics';
  END IF;

  -- Metric 1: Average events per day
  RETURN QUERY
  SELECT 
    'Avg Daily Events'::text,
    (COUNT(*)::numeric / _days),
    CASE 
      WHEN (COUNT(*)::numeric / _days) > 1000 THEN 'increasing'
      WHEN (COUNT(*)::numeric / _days) > 500 THEN 'stable'
      ELSE 'decreasing'
    END::text,
    'info'::text
  FROM audit_logs
  WHERE time > NOW() - (_days || ' days')::interval;

  -- Metric 2: Rate limit effectiveness
  RETURN QUERY
  SELECT 
    'Rate Limits Blocked'::text,
    COUNT(*)::numeric,
    CASE 
      WHEN COUNT(*) > 100 THEN 'increasing'
      ELSE 'stable'
    END::text,
    CASE 
      WHEN COUNT(*) > 100 THEN 'warning'
      ELSE 'good'
    END::text
  FROM audit_logs
  WHERE payload_hash = 'rate_limited'
    AND time > NOW() - (_days || ' days')::interval;

  -- Metric 3: Unique active users
  RETURN QUERY
  SELECT 
    'Active Users'::text,
    COUNT(DISTINCT user_id)::numeric,
    'stable'::text,
    'info'::text
  FROM audit_logs
  WHERE time > NOW() - (_days || ' days')::interval;

  -- Metric 4: High severity incidents
  RETURN QUERY
  SELECT 
    'Critical Incidents'::text,
    COUNT(*)::numeric,
    CASE 
      WHEN COUNT(*) > 10 THEN 'increasing'
      ELSE 'stable'
    END::text,
    CASE 
      WHEN COUNT(*) > 10 THEN 'critical'
      WHEN COUNT(*) > 5 THEN 'warning'
      ELSE 'good'
    END::text
  FROM audit_logs
  WHERE severity IN ('critical', 'high')
    AND time > NOW() - (_days || ' days')::interval;

END;
$$;

-- 3.4: Automated Security Report Generation
CREATE OR REPLACE FUNCTION generate_security_report(_start_date timestamp, _end_date timestamp)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report jsonb;
  event_summary jsonb;
  top_users jsonb;
  security_incidents jsonb;
BEGIN
  -- Only admins can generate reports
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can generate security reports';
  END IF;

  -- Build event summary
  SELECT jsonb_build_object(
    'total_events', COUNT(*),
    'high_severity', COUNT(*) FILTER (WHERE severity IN ('high', 'critical')),
    'medium_severity', COUNT(*) FILTER (WHERE severity = 'medium'),
    'low_severity', COUNT(*) FILTER (WHERE severity = 'low'),
    'rate_limits_hit', COUNT(*) FILTER (WHERE payload_hash = 'rate_limited')
  )
  INTO event_summary
  FROM audit_logs
  WHERE time BETWEEN _start_date AND _end_date;

  -- Get top active users
  SELECT jsonb_agg(user_data)
  INTO top_users
  FROM (
    SELECT jsonb_build_object(
      'user_id', user_id,
      'event_count', COUNT(*),
      'high_severity_events', COUNT(*) FILTER (WHERE severity IN ('high', 'critical'))
    ) as user_data
    FROM audit_logs
    WHERE time BETWEEN _start_date AND _end_date
    GROUP BY user_id
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) top_users_subquery;

  -- Get security incidents
  SELECT jsonb_agg(incident_data)
  INTO security_incidents
  FROM (
    SELECT jsonb_build_object(
      'time', time,
      'entity', entity,
      'severity', severity,
      'user_id', user_id
    ) as incident_data
    FROM audit_logs
    WHERE time BETWEEN _start_date AND _end_date
      AND severity IN ('high', 'critical')
    ORDER BY time DESC
    LIMIT 50
  ) incidents_subquery;

  -- Build final report
  report := jsonb_build_object(
    'report_period', jsonb_build_object(
      'start', _start_date,
      'end', _end_date
    ),
    'generated_at', NOW(),
    'generated_by', auth.uid(),
    'event_summary', event_summary,
    'top_users', COALESCE(top_users, '[]'::jsonb),
    'security_incidents', COALESCE(security_incidents, '[]'::jsonb)
  );

  -- Log report generation
  INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash, severity)
  VALUES ('security_report', auth.uid()::text, 'create', auth.uid(), 'generated', 'medium');

  RETURN report;
END;
$$;

-- Add comments
COMMENT ON FUNCTION run_security_health_check IS 
'Performs comprehensive security health check covering RLS policies, authentication attempts, privilege escalation, sensitive data access, backup configuration, and data exports. Admin-only.';

COMMENT ON FUNCTION get_security_metrics IS 
'Returns key security metrics including event rates, rate limit effectiveness, active users, and critical incidents. Used for security dashboard visualizations. Admin-only.';

COMMENT ON FUNCTION generate_security_report IS 
'Generates comprehensive security report for specified time period including event summaries, top users, and security incidents. Admin-only.';

COMMENT ON FUNCTION check_bulk_access_alert IS 
'Trigger function that detects rapid repeated access patterns (>10 accesses in 5 minutes) and automatically escalates severity to high, logging separate alert.';

-- Create a view for quick security dashboard access
CREATE OR REPLACE VIEW security_dashboard_summary AS
SELECT 
  (SELECT COUNT(*) FROM audit_logs WHERE time > NOW() - INTERVAL '24 hours') as events_24h,
  (SELECT COUNT(*) FROM audit_logs WHERE severity IN ('high', 'critical') AND time > NOW() - INTERVAL '24 hours') as critical_events_24h,
  (SELECT COUNT(DISTINCT user_id) FROM audit_logs WHERE time > NOW() - INTERVAL '24 hours') as active_users_24h,
  (SELECT COUNT(*) FROM audit_logs WHERE payload_hash = 'rate_limited' AND time > NOW() - INTERVAL '24 hours') as rate_limits_24h,
  (SELECT COUNT(*) FROM user_roles WHERE role = 'admin'::app_role) as total_admins,
  (SELECT COUNT(*) FROM backup_settings WHERE enabled = true) as orgs_with_backup,
  NOW() as last_updated;

-- Grant access to admins only
COMMENT ON VIEW security_dashboard_summary IS 
'Quick summary view for security dashboard. Shows 24-hour metrics for events, critical incidents, active users, rate limits, admin count, and backup configuration.';