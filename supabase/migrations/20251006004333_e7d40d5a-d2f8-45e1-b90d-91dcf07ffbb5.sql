-- Phase 3: Maintenance - Automated Security Tasks (Simplified)

-- Create a table to track maintenance task runs
CREATE TABLE IF NOT EXISTS maintenance_task_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  details JSONB DEFAULT '{}'::jsonb,
  error_message TEXT
);

-- Enable RLS on maintenance_task_runs
ALTER TABLE maintenance_task_runs ENABLE ROW LEVEL SECURITY;

-- Only admins can view maintenance task runs
CREATE POLICY "Admins can view maintenance task runs"
  ON maintenance_task_runs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can manage maintenance task runs
CREATE POLICY "Service role can manage maintenance task runs"
  ON maintenance_task_runs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to cleanup old audit logs (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
  task_id UUID;
  result JSONB;
BEGIN
  -- Log task start
  INSERT INTO maintenance_task_runs (task_name, status)
  VALUES ('cleanup_old_audit_logs', 'running')
  RETURNING id INTO task_id;
  
  -- Delete old audit logs (keep 90 days)
  DELETE FROM audit_logs
  WHERE time < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Update task status
  UPDATE maintenance_task_runs
  SET 
    finished_at = now(),
    status = 'completed',
    details = jsonb_build_object('deleted_count', deleted_count)
  WHERE id = task_id;
  
  result := jsonb_build_object(
    'success', true,
    'task_id', task_id,
    'deleted_count', deleted_count
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  -- Log error
  UPDATE maintenance_task_runs
  SET 
    finished_at = now(),
    status = 'failed',
    error_message = SQLERRM
  WHERE id = task_id;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Function to cleanup old security alerts (resolved and older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_security_alerts()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
  task_id UUID;
  result JSONB;
BEGIN
  -- Log task start
  INSERT INTO maintenance_task_runs (task_name, status)
  VALUES ('cleanup_old_security_alerts', 'running')
  RETURNING id INTO task_id;
  
  -- Delete resolved alerts older than 30 days
  DELETE FROM security_alerts
  WHERE resolved = true
    AND resolved_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Update task status
  UPDATE maintenance_task_runs
  SET 
    finished_at = now(),
    status = 'completed',
    details = jsonb_build_object('deleted_count', deleted_count)
  WHERE id = task_id;
  
  result := jsonb_build_object(
    'success', true,
    'task_id', task_id,
    'deleted_count', deleted_count
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  -- Log error
  UPDATE maintenance_task_runs
  SET 
    finished_at = now(),
    status = 'failed',
    error_message = SQLERRM
  WHERE id = task_id;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Function to verify backup health
CREATE OR REPLACE FUNCTION verify_backup_health()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  orgs_without_backup INTEGER;
  failed_backups INTEGER;
  task_id UUID;
  result JSONB;
BEGIN
  -- Log task start
  INSERT INTO maintenance_task_runs (task_name, status)
  VALUES ('verify_backup_health', 'running')
  RETURNING id INTO task_id;
  
  -- Count orgs without backup configured
  SELECT COUNT(*) INTO orgs_without_backup
  FROM orgs o
  WHERE NOT EXISTS (
    SELECT 1 FROM backup_settings bs
    WHERE bs.org_id = o.id AND bs.enabled = true
  );
  
  -- Count failed backups in last 48 hours
  SELECT COUNT(*) INTO failed_backups
  FROM backup_runs
  WHERE status = 'failed'
    AND started_at > NOW() - INTERVAL '48 hours';
  
  -- Create alerts if issues found
  IF orgs_without_backup > 0 THEN
    INSERT INTO security_alerts (
      alert_type,
      severity,
      title,
      description,
      details
    ) VALUES (
      'backup_health_check',
      'medium',
      'Organizations Without Backup',
      orgs_without_backup || ' organizations do not have backup configured',
      jsonb_build_object('org_count', orgs_without_backup)
    );
  END IF;
  
  IF failed_backups > 0 THEN
    INSERT INTO security_alerts (
      alert_type,
      severity,
      title,
      description,
      details
    ) VALUES (
      'backup_health_check',
      'high',
      'Recent Backup Failures',
      failed_backups || ' backup failures detected in the last 48 hours',
      jsonb_build_object('failed_count', failed_backups)
    );
  END IF;
  
  -- Update task status
  UPDATE maintenance_task_runs
  SET 
    finished_at = now(),
    status = 'completed',
    details = jsonb_build_object(
      'orgs_without_backup', orgs_without_backup,
      'failed_backups', failed_backups
    )
  WHERE id = task_id;
  
  result := jsonb_build_object(
    'success', true,
    'task_id', task_id,
    'orgs_without_backup', orgs_without_backup,
    'failed_backups', failed_backups
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  -- Log error
  UPDATE maintenance_task_runs
  SET 
    finished_at = now(),
    status = 'failed',
    error_message = SQLERRM
  WHERE id = task_id;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Function to get maintenance task history
CREATE OR REPLACE FUNCTION get_maintenance_task_history(_days INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID,
  task_name TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  status TEXT,
  details JSONB,
  error_message TEXT,
  duration_seconds NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can view maintenance history
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can view maintenance history';
  END IF;
  
  RETURN QUERY
  SELECT 
    mtr.id,
    mtr.task_name,
    mtr.started_at,
    mtr.finished_at,
    mtr.status,
    mtr.details,
    mtr.error_message,
    EXTRACT(EPOCH FROM (COALESCE(mtr.finished_at, now()) - mtr.started_at)) as duration_seconds
  FROM maintenance_task_runs mtr
  WHERE mtr.started_at > NOW() - (_days || ' days')::interval
  ORDER BY mtr.started_at DESC;
END;
$$;

-- Document the maintenance functions
COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Removes audit logs older than 90 days to maintain database performance';
COMMENT ON FUNCTION cleanup_old_security_alerts IS 'Removes resolved security alerts older than 30 days';
COMMENT ON FUNCTION verify_backup_health IS 'Checks backup configuration and creates alerts for issues';
COMMENT ON FUNCTION get_maintenance_task_history IS 'Returns history of maintenance task executions (admin only)';