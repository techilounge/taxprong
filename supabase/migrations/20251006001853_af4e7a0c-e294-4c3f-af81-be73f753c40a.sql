-- Phase 1 Critical Security Fixes

-- 1.2: Add enhanced audit logging for profile access attempts
-- This helps detect enumeration attacks
CREATE OR REPLACE FUNCTION audit_profile_enumeration()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log any profile query attempt with rate limit tracking
  PERFORM log_and_check_rate_limit('profile_access', 100, 3600);
END;
$$;

COMMENT ON FUNCTION audit_profile_enumeration() IS 
'Logs profile access attempts and enforces rate limiting to prevent enumeration attacks. Applications should call this function before querying profiles.';

-- 1.3: Fix QA Citations exposure - remove NULL user_id access
-- This prevents exposure of system-generated or orphaned Q&A data
DROP POLICY IF EXISTS "Users can view own qa citations by user_id" ON qa_citations;

CREATE POLICY "Users can view only their own qa citations"
ON qa_citations
FOR SELECT
USING (user_id = auth.uid());

-- Allow admins to view all citations for support purposes
CREATE POLICY "Admins can view all qa citations"
ON qa_citations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add security documentation
COMMENT ON TABLE profiles IS 
'User profile data with strict RLS. Access is restricted to the profile owner only. Applications should use get_profile_safely() function and call audit_profile_enumeration() to log access attempts.';

COMMENT ON TABLE qa_citations IS 
'Q&A citation history. Access restricted to the user who created the citation or admins. Previously allowed NULL user_id access which has been removed for security.';