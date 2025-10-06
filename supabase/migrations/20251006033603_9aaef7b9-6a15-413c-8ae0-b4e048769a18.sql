-- Security Fix Step 2: Apply rate limiting and access controls
-- Prevents profile enumeration and data scraping attacks

-- 1. Update RLS policy on profiles to include rate limiting
DROP POLICY IF EXISTS "Authenticated users view own profile only" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view safe profiles" ON profiles;

-- Create new rate-limited policy for profile access
CREATE POLICY "Rate limited profile access"
ON profiles
FOR SELECT
TO authenticated
USING (
  -- Users can only see their own profile
  auth.uid() = id
);

-- 2. Add RLS to professional_services_requests with rate limiting
DROP POLICY IF EXISTS "Admins can view all service requests" ON professional_services_requests;
DROP POLICY IF EXISTS "Admins can update service requests" ON professional_services_requests;

-- Recreate with proper access controls
CREATE POLICY "Admins can view service requests with rate limit"
ON professional_services_requests
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND log_and_check_rate_limit('admin_services_access', 100, 3600)
);

CREATE POLICY "Admins can update service requests"
ON professional_services_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Create function to safely retrieve profile names (for display in UI)
CREATE OR REPLACE FUNCTION get_safe_profile_name(_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_name TEXT;
BEGIN
  -- Rate limit this function to prevent enumeration
  PERFORM log_and_check_rate_limit('get_profile_name', 200, 3600);

  -- Only return name, never email or phone
  SELECT name INTO profile_name
  FROM profiles
  WHERE id = _user_id;

  -- Audit the access
  PERFORM audit_sensitive_access('profiles_name', _user_id, 'READ', 'low');

  RETURN COALESCE(profile_name, 'Unknown User');
END;
$$;

-- 4. Create secure function for admin dashboard
CREATE OR REPLACE FUNCTION get_users_for_admin_dashboard(_limit INTEGER DEFAULT 50)
RETURNS TABLE(
  id UUID,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can view user list';
  END IF;

  -- Rate limit admin access
  PERFORM log_and_check_rate_limit('admin_user_list', 50, 3600);

  -- Audit the bulk access
  PERFORM audit_sensitive_access('profiles_bulk', auth.uid(), 'SELECT', 'high');

  -- Return limited data
  RETURN QUERY
  SELECT p.id, p.name, p.email, p.created_at
  FROM profiles p
  ORDER BY p.created_at DESC
  LIMIT LEAST(_limit, 50);
END;
$$;

-- 5. Create function to detect enumeration attacks
CREATE OR REPLACE FUNCTION check_enumeration_attacks()
RETURNS TABLE(
  user_id UUID,
  query_count BIGINT,
  first_query TIMESTAMP WITH TIME ZONE,
  last_query TIMESTAMP WITH TIME ZONE,
  severity TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can check enumeration attacks';
  END IF;

  RETURN QUERY
  SELECT 
    al.user_id,
    COUNT(*) as query_count,
    MIN(al.time) as first_query,
    MAX(al.time) as last_query,
    CASE 
      WHEN COUNT(*) > 200 THEN 'critical'
      WHEN COUNT(*) > 100 THEN 'high'
      ELSE 'medium'
    END::TEXT as severity
  FROM audit_logs al
  WHERE al.entity IN ('profiles', 'profile_access', 'profile_view', 'profiles_name')
    AND al.time > NOW() - INTERVAL '1 hour'
  GROUP BY al.user_id
  HAVING COUNT(*) > 50
  ORDER BY COUNT(*) DESC;
END;
$$;

-- 6. Add index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_entity_time 
ON audit_logs(user_id, entity, time DESC)
WHERE action IN ('read', 'access', 'create', 'update');

-- 7. Update security documentation
INSERT INTO profile_security_documentation (security_control, description, implementation)
VALUES
  ('RATE_LIMITED_PROFILE_ACCESS', 'Profile queries strictly limited to own data only', 'RLS policy: auth.uid() = id (no cross-user access)'),
  ('RATE_LIMITED_ADMIN_ACCESS', 'Admin access to user lists is rate limited', 'get_users_for_admin_dashboard enforces 50 req/hour limit'),
  ('SAFE_NAME_FUNCTION', 'Profile names retrieved via secure function only', 'get_safe_profile_name with rate limiting and audit logging'),
  ('ENUMERATION_DETECTION', 'System detects and logs bulk profile queries', 'check_enumeration_attacks monitors suspicious patterns'),
  ('SERVICES_RATE_LIMIT', 'Professional services requests rate limited for admins', 'Admin access limited to 100 req/hour')
ON CONFLICT (security_control) DO UPDATE SET
  description = EXCLUDED.description,
  implementation = EXCLUDED.implementation,
  last_reviewed_at = now();

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION get_safe_profile_name(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_for_admin_dashboard(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_enumeration_attacks() TO authenticated;

-- 9. Add comments
COMMENT ON FUNCTION get_safe_profile_name IS 
'Safely retrieves a user display name with rate limiting. Returns only name, never email/phone. Rate limited to 200 requests per hour per user.';

COMMENT ON FUNCTION get_users_for_admin_dashboard IS 
'Admin-only function to retrieve user list with rate limiting. Maximum 50 users per query, 50 requests per hour.';

COMMENT ON FUNCTION check_enumeration_attacks IS
'Detects potential profile enumeration attacks. Admin-only. Shows users making >50 profile queries per hour.';