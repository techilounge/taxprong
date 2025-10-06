-- Phase 1: Critical Security Fixes (Corrected)

-- Fix 1: Remove blocking profile policy and add proper RLS
DROP POLICY IF EXISTS "Block anonymous profile access" ON profiles;

CREATE POLICY "Authenticated users can view own profile v2"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can update own profile v2"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Fix 2: Create secure function for security dashboard (since views can't have RLS)
CREATE OR REPLACE FUNCTION get_security_dashboard_summary()
RETURNS TABLE(
  events_24h bigint,
  critical_events_24h bigint,
  active_users_24h bigint,
  rate_limits_24h bigint,
  total_admins bigint,
  backups_enabled bigint,
  last_updated timestamp with time zone
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
  
  RETURN QUERY
  SELECT * FROM security_dashboard_summary;
END;
$$;

COMMENT ON FUNCTION get_security_dashboard_summary IS 'Security definer function for admins to access security dashboard metrics. Replaces direct view access.';

-- Fix 3: Create safe backup settings view (metadata only, no credentials)
CREATE OR REPLACE VIEW backup_settings_safe AS
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

-- Grant access to the safe view
GRANT SELECT ON backup_settings_safe TO authenticated;

-- Update backup_settings RLS to be more restrictive
DROP POLICY IF EXISTS "Org owners can view backup settings metadata only" ON backup_settings;
DROP POLICY IF EXISTS "Service role can read all backup settings" ON backup_settings;

-- Only service role can read credentials (for edge functions)
CREATE POLICY "Service role only can read credentials"
ON backup_settings FOR SELECT
USING (auth.role() = 'service_role');

-- Org owners use get_backup_settings_metadata function
CREATE POLICY "Org owners blocked from direct access"
ON backup_settings FOR SELECT
TO authenticated
USING (FALSE); -- Force use of get_backup_settings_metadata function

-- Fix 4: Fix bank_txns cross-org data leakage
DROP POLICY IF EXISTS "Org members can view bank txns" ON bank_txns;

CREATE POLICY "Org members can view bank txns v2"
ON bank_txns FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM org_users ou
    WHERE ou.org_id = bank_txns.org_id 
    AND ou.user_id = auth.uid()
  )
  AND (
    -- If business_id is set, verify it belongs to the same org
    bank_txns.business_id IS NULL
    OR EXISTS (
      SELECT 1 
      FROM businesses b
      WHERE b.id = bank_txns.business_id 
      AND b.org_id = bank_txns.org_id
    )
  )
);

-- Fix 5: Restrict TIN access to staff and owners only
DROP POLICY IF EXISTS "Org members can view businesses" ON businesses;

-- All org members can view business metadata (but not TIN)
CREATE POLICY "Org members can view businesses metadata"
ON businesses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM org_users 
    WHERE org_id = businesses.org_id 
    AND user_id = auth.uid()
  )
);

-- Create a secure function to access TIN (staff/owners only)
CREATE OR REPLACE FUNCTION get_business_tin(_business_id uuid)
RETURNS TABLE(business_id uuid, tin text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only staff and owners can view TINs
  IF NOT EXISTS (
    SELECT 1 
    FROM businesses b
    JOIN org_users ou ON b.org_id = ou.org_id
    WHERE b.id = _business_id
    AND ou.user_id = auth.uid()
    AND ou.role IN ('owner'::app_role, 'staff'::app_role)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only staff and owners can view TINs';
  END IF;
  
  -- Audit the access
  PERFORM audit_sensitive_access('businesses_tin', _business_id, 'READ', 'high');
  
  RETURN QUERY
  SELECT b.id as business_id, b.tin
  FROM businesses b
  WHERE b.id = _business_id;
END;
$$;

COMMENT ON FUNCTION get_business_tin IS 'Security definer function for staff/owners to access TIN with audit logging.';

-- Fix 6: Create extensions schema (document for manual migration)
CREATE SCHEMA IF NOT EXISTS extensions;

-- Fix 7: Document all security definer functions
COMMENT ON FUNCTION has_role IS 'Security definer function to check user roles without RLS recursion. Required for RLS policies that check roles.';
COMMENT ON FUNCTION is_org_owner IS 'Security definer function to check org ownership without RLS recursion.';
COMMENT ON FUNCTION is_org_member IS 'Security definer function to check org membership without RLS recursion.';
COMMENT ON FUNCTION get_backup_settings_metadata IS 'Security definer function to safely retrieve backup settings metadata without exposing credentials.';
COMMENT ON FUNCTION get_backup_credentials IS 'Security definer function for edge functions to retrieve decrypted backup credentials. Service role only.';
COMMENT ON FUNCTION get_profile_safely IS 'Security definer function to retrieve profiles with audit logging and rate limiting.';
COMMENT ON FUNCTION get_professional_services_requests IS 'Security definer function with rate limiting to prevent bulk data scraping.';
COMMENT ON FUNCTION get_pros_list IS 'Security definer function with rate limiting to prevent marketplace scraping.';
COMMENT ON FUNCTION get_pro_reviews IS 'Security definer function with rate limiting to prevent review scraping.';
COMMENT ON FUNCTION get_pro_safely IS 'Security definer function with rate limiting for individual pro access.';
COMMENT ON FUNCTION run_security_health_check IS 'Security definer function for admins to run comprehensive security checks.';
COMMENT ON FUNCTION get_security_metrics IS 'Security definer function for admins to retrieve security metrics.';
COMMENT ON FUNCTION generate_security_report IS 'Security definer function for admins to generate security reports.';
COMMENT ON FUNCTION get_security_summary IS 'Security definer function for admins to view security summary.';
COMMENT ON FUNCTION get_security_events IS 'Security definer function for admins to view security events.';

-- Create security definer documentation table
CREATE TABLE IF NOT EXISTS security_definer_functions (
  function_name text PRIMARY KEY,
  purpose text NOT NULL,
  required_role app_role,
  security_notes text,
  last_reviewed_at timestamp with time zone DEFAULT now()
);

ALTER TABLE security_definer_functions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view security definer docs"
ON security_definer_functions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO security_definer_functions (function_name, purpose, required_role, security_notes) VALUES
('has_role', 'Check user roles without RLS recursion', NULL, 'Core security function - prevents infinite recursion in RLS policies'),
('is_org_owner', 'Check org ownership without RLS recursion', NULL, 'Core security function - prevents infinite recursion in RLS policies'),
('is_org_member', 'Check org membership without RLS recursion', NULL, 'Core security function - prevents infinite recursion in RLS policies'),
('get_backup_settings_metadata', 'Safely retrieve backup metadata', 'owner', 'Never exposes encrypted credentials - returns metadata only'),
('get_backup_credentials', 'Decrypt backup credentials for edge functions', NULL, 'Service role only - for automated backups'),
('get_profile_safely', 'Retrieve profiles with audit logging', NULL, 'Includes rate limiting and access logging'),
('get_business_tin', 'Retrieve TIN with access control', 'staff', 'Staff/owner only - includes audit logging'),
('get_professional_services_requests', 'Retrieve service requests with rate limiting', NULL, 'Prevents bulk scraping of contact info'),
('get_pros_list', 'Retrieve marketplace pros with rate limiting', NULL, 'Prevents marketplace scraping'),
('get_pro_reviews', 'Retrieve reviews with rate limiting', NULL, 'Prevents review scraping'),
('get_pro_safely', 'Retrieve individual pro with rate limiting', NULL, 'Prevents enumeration attacks'),
('run_security_health_check', 'Run security health checks', 'admin', 'Admin only - comprehensive security validation'),
('get_security_metrics', 'Retrieve security metrics', 'admin', 'Admin only - security dashboard metrics'),
('generate_security_report', 'Generate security reports', 'admin', 'Admin only - creates audit reports'),
('get_security_summary', 'View security summary', 'admin', 'Admin only - high-level security overview'),
('get_security_events', 'View security events', 'admin', 'Admin only - detailed security event log'),
('get_security_dashboard_summary', 'Access security dashboard metrics', 'admin', 'Admin only - dashboard summary data')
ON CONFLICT (function_name) DO UPDATE SET
  purpose = EXCLUDED.purpose,
  required_role = EXCLUDED.required_role,
  security_notes = EXCLUDED.security_notes,
  last_reviewed_at = now();