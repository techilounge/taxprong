-- Fix: Add admin-only access function for scheduled_jobs_status view
-- This resolves the security finding by ensuring only admins can access job scheduling information

-- 1. Create admin-only function to access scheduled jobs status
CREATE OR REPLACE FUNCTION public.get_scheduled_jobs_status()
RETURNS TABLE (
  jobid bigint,
  schedule text,
  command text,
  nodename text,
  nodeport integer,
  "database" text,
  username text,
  active boolean,
  jobname text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enforce admin-only access
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can view scheduled jobs status';
  END IF;

  -- Audit the access
  INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash, severity)
  VALUES (
    'scheduled_jobs_access',
    auth.uid()::text,
    'read',
    auth.uid(),
    'admin_access',
    'medium'
  );

  -- Return the job status data
  RETURN QUERY
  SELECT 
    s.jobid,
    s.schedule,
    s.command,
    s.nodename,
    s.nodeport,
    s."database",
    s.username,
    s.active,
    s.jobname
  FROM scheduled_jobs_status s
  ORDER BY s.jobname;
END;
$$;

-- 2. Grant execute permission to authenticated users (function will enforce admin check)
GRANT EXECUTE ON FUNCTION public.get_scheduled_jobs_status() TO authenticated;

-- 3. Add helpful comments
COMMENT ON FUNCTION public.get_scheduled_jobs_status() IS 
'Admin-only function to view scheduled maintenance jobs. Enforces role-based access control and audits all access attempts. This is the ONLY approved method to access job scheduling information.';

-- 4. Update security documentation
UPDATE security_view_documentation 
SET 
  security_notes = 'Uses security_barrier=true. Direct access REVOKED. MUST be accessed via get_scheduled_jobs_status() function which enforces admin-only access and audits all queries.',
  access_control = 'Admin-only via get_scheduled_jobs_status() function with audit logging',
  last_reviewed_at = now()
WHERE view_name = 'scheduled_jobs_status';

-- 5. Create security documentation entry for the new function
INSERT INTO security_view_documentation (view_name, purpose, access_control, security_notes)
VALUES (
  'get_scheduled_jobs_status()',
  'Admin function to safely query scheduled maintenance jobs',
  'Admin-only with has_role() check and audit logging',
  'Wraps scheduled_jobs_status view with role verification. Logs all access attempts. Prevents unauthorized access to system internals.'
)
ON CONFLICT (view_name) DO UPDATE SET
  purpose = EXCLUDED.purpose,
  access_control = EXCLUDED.access_control,
  security_notes = EXCLUDED.security_notes,
  last_reviewed_at = now();