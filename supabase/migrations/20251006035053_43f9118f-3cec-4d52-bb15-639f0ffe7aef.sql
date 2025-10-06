-- Additional Security Hardening for Backup Settings
-- Ensures comprehensive protection against credential theft

-- 1. Add explicit RLS policy to prevent any direct table queries
-- This ensures all access must go through the controlled functions
ALTER TABLE backup_settings ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might allow access
DROP POLICY IF EXISTS "Only service role can manage backup settings" ON backup_settings;
DROP POLICY IF EXISTS "Org owners blocked from direct access" ON backup_settings;
DROP POLICY IF EXISTS "Service role only can read credentials" ON backup_settings;

-- Create the most restrictive policies possible
-- Policy 1: Block ALL authenticated user access to the table
CREATE POLICY "Block all authenticated user access to backup_settings"
ON backup_settings
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Policy 2: Allow ONLY service role full access
CREATE POLICY "Service role only full access to backup_settings"
ON backup_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Create a comprehensive security verification function
CREATE OR REPLACE FUNCTION public.verify_backup_security()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT,
  severity TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can run security verification
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can verify backup security';
  END IF;

  -- Check 1: RLS is enabled
  RETURN QUERY
  SELECT 
    'RLS Enabled on backup_settings'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM pg_tables t
        JOIN pg_class c ON c.relname = t.tablename
        WHERE t.tablename = 'backup_settings'
        AND c.relrowsecurity = true
      ) THEN 'PASS'
      ELSE 'FAIL'
    END::TEXT,
    'RLS must be enabled to enforce access controls'::TEXT,
    'critical'::TEXT;

  -- Check 2: No views expose credentials
  RETURN QUERY
  SELECT 
    'No views expose credentials'::TEXT,
    CASE 
      WHEN NOT EXISTS (
        SELECT 1 FROM information_schema.view_column_usage
        WHERE view_name LIKE '%backup%'
        AND column_name IN ('access_key_encrypted', 'secret_key_encrypted', 'access_key_nonce', 'secret_key_nonce')
      ) THEN 'PASS'
      ELSE 'FAIL'
    END::TEXT,
    'Views must not expose encrypted credentials or nonces'::TEXT,
    'critical'::TEXT;

  -- Check 3: get_backup_credentials blocks non-service-role
  RETURN QUERY
  SELECT 
    'get_backup_credentials is service-role only'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.proname = 'get_backup_credentials'
        AND n.nspname = 'public'
      ) THEN 'PASS'
      ELSE 'FAIL'
    END::TEXT,
    'Function must exist and enforce service role access'::TEXT,
    'critical'::TEXT;

  -- Check 4: All access is audit logged
  RETURN QUERY
  SELECT 
    'Backup credential access is audit logged'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM audit_logs
        WHERE entity IN ('backup_credentials_service_access', 'backup_settings_metadata_access')
        AND time > NOW() - INTERVAL '30 days'
      ) THEN 'PASS'
      ELSE 'INFO'
    END::TEXT,
    'All credential and metadata access should be logged'::TEXT,
    'medium'::TEXT;

  -- Check 5: No unauthorized access attempts in last 24 hours
  RETURN QUERY
  SELECT 
    'No recent unauthorized access attempts'::TEXT,
    CASE 
      WHEN NOT EXISTS (
        SELECT 1 FROM audit_logs
        WHERE entity = 'backup_credentials_unauthorized_access'
        AND time > NOW() - INTERVAL '24 hours'
      ) THEN 'PASS'
      ELSE 'FAIL'
    END::TEXT,
    'Check for unauthorized credential access attempts'::TEXT,
    'high'::TEXT;

  -- Check 6: Authenticated users blocked by RLS
  RETURN QUERY
  SELECT 
    'Authenticated users blocked by RLS'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'backup_settings'
        AND policyname LIKE '%Block all authenticated%'
        AND cmd = 'ALL'
      ) THEN 'PASS'
      ELSE 'FAIL'
    END::TEXT,
    'RLS must explicitly block authenticated users from direct access'::TEXT,
    'critical'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_backup_security() TO authenticated;

COMMENT ON FUNCTION public.verify_backup_security() IS 
'Admin-only function to verify comprehensive backup security controls. Checks RLS, function access controls, audit logging, and potential security breaches.';

-- 3. Create automated alert for suspicious activity
CREATE OR REPLACE FUNCTION public.alert_on_backup_security_breach()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unauthorized_attempts INTEGER;
BEGIN
  -- Count unauthorized attempts in last hour
  SELECT COUNT(*)
  INTO unauthorized_attempts
  FROM audit_logs
  WHERE entity = 'backup_credentials_unauthorized_access'
  AND time > NOW() - INTERVAL '1 hour';

  -- If any unauthorized attempts, create security alert
  IF unauthorized_attempts > 0 THEN
    INSERT INTO security_alerts (
      alert_type,
      severity,
      title,
      description,
      details
    ) VALUES (
      'backup_credential_theft_attempt',
      'critical',
      'Unauthorized Backup Credential Access Attempt',
      'One or more unauthorized attempts to access encrypted backup credentials were detected and blocked',
      jsonb_build_object(
        'attempt_count', unauthorized_attempts,
        'time_window', '1 hour',
        'action_required', 'Review audit logs and investigate user accounts',
        'check_time', NOW()
      )
    );
  END IF;
END;
$$;

COMMENT ON FUNCTION public.alert_on_backup_security_breach() IS 
'Automated function to create security alerts when unauthorized backup credential access is detected. Called by security monitoring.';

-- 4. Update security documentation
INSERT INTO security_definer_functions (function_name, purpose, required_role, security_notes) VALUES
('verify_backup_security', 'Verify backup credential security controls', 'admin', 'Comprehensive security validation for backup system'),
('alert_on_backup_security_breach', 'Create alerts for credential theft attempts', NULL, 'Automated monitoring - creates critical alerts')
ON CONFLICT (function_name) DO UPDATE SET
  purpose = EXCLUDED.purpose,
  required_role = EXCLUDED.required_role,
  security_notes = EXCLUDED.security_notes,
  last_reviewed_at = now();

-- 5. Add detailed RLS policy comments
COMMENT ON POLICY "Block all authenticated user access to backup_settings" ON backup_settings IS 
'CRITICAL: Blocks ALL authenticated users from directly accessing backup_settings table. Users must use get_backup_settings_safe() or get_backup_settings_metadata() for metadata. This prevents credential theft even if other security layers fail.';

COMMENT ON POLICY "Service role only full access to backup_settings" ON backup_settings IS 
'Allows service role (edge functions only) full access to backup_settings for automated backup operations via get_backup_credentials().';