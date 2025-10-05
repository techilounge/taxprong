-- Phase 3 Security Hardening: Fix Remaining Vulnerabilities (Fixed)

-- 1. Fix profiles table RLS to prevent anonymous access
DROP POLICY IF EXISTS "Users can view own profile securely" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile securely" ON public.profiles;

-- Create policies that explicitly require authentication
CREATE POLICY "Authenticated users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure no public or anon access
CREATE POLICY "Block anonymous profile access"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- 2. Fix QA citations to be user/org specific
DROP POLICY IF EXISTS "Users can view qa citations" ON public.qa_citations;
DROP POLICY IF EXISTS "Service role can insert citations" ON public.qa_citations;

-- Add user_id column to qa_citations for proper tracking
ALTER TABLE qa_citations 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create index for efficient user-based queries
CREATE INDEX IF NOT EXISTS idx_qa_citations_user_id 
ON qa_citations(user_id);

-- Create user-specific access policy
CREATE POLICY "Users can view own qa citations by user_id"
ON public.qa_citations
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR user_id IS NULL
);

CREATE POLICY "Service role can manage qa citations"
ON public.qa_citations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Add audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_access(
  _table_name text,
  _record_id uuid,
  _operation text,
  _severity text DEFAULT 'medium'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (
    entity, 
    entity_id, 
    action, 
    user_id, 
    payload_hash,
    severity
  )
  VALUES (
    _table_name,
    _record_id::text,
    _operation,
    auth.uid(),
    'sensitive_access',
    _severity
  );
END;
$$;

COMMENT ON FUNCTION public.audit_sensitive_access IS 
  'Logs access to sensitive data tables for security monitoring and compliance.';

-- 4. Create function to check if user should have access to TIN data
CREATE OR REPLACE FUNCTION public.user_can_view_tin(
  _business_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_owner boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM businesses b
    JOIN org_users ou ON b.org_id = ou.org_id
    WHERE b.id = _business_id
      AND ou.user_id = auth.uid()
      AND ou.role = 'owner'::app_role
  ) INTO is_owner;
  
  RETURN is_owner;
END;
$$;

COMMENT ON FUNCTION public.user_can_view_tin IS 
  'Checks if the current user has permission to view business TIN data. Only org owners allowed.';

-- 5. Add trigger to audit TIN updates (not selects - that's application-level)
CREATE OR REPLACE FUNCTION public.audit_tin_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tin IS DISTINCT FROM OLD.tin THEN
    PERFORM audit_sensitive_access('businesses_tin', NEW.id, 'UPDATE', 'high');
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_business_tin_update ON businesses;
CREATE TRIGGER audit_business_tin_update
  AFTER UPDATE ON businesses
  FOR EACH ROW
  WHEN (NEW.tin IS NOT NULL)
  EXECUTE FUNCTION audit_tin_update();

-- 6. Add metadata columns to audit_logs for better security monitoring
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS ip_address inet,
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS severity text CHECK (severity IN ('low', 'medium', 'high', 'critical'));

-- Update existing rows to have default severity
UPDATE audit_logs SET severity = 'low' WHERE severity IS NULL;

-- Create indexes for security monitoring queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity 
ON audit_logs(severity, time DESC) 
WHERE severity IN ('high', 'critical');

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_time 
ON audit_logs(entity, time DESC);

-- 7. Create view for security monitoring
CREATE OR REPLACE VIEW security_events AS
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
    WHEN al.entity = 'profile_access' THEN 'Profile Enumeration Attempt'
    WHEN al.entity LIKE '%_tin' THEN 'TIN Access'
    WHEN al.entity = 'data_export' THEN 'Data Export'
    WHEN al.entity LIKE 'admin_%' THEN 'Admin Operation'
    ELSE 'General Access'
  END as event_type
FROM audit_logs al
LEFT JOIN profiles p ON al.user_id = p.id
WHERE al.time > NOW() - INTERVAL '30 days'
ORDER BY al.time DESC;

COMMENT ON VIEW security_events IS 
  'Aggregated view of security-relevant events from audit logs for monitoring and compliance.';

-- 8. Create function to get security summary
CREATE OR REPLACE FUNCTION public.get_security_summary(
  _days_back integer DEFAULT 7
)
RETURNS TABLE(
  total_events bigint,
  high_severity_events bigint,
  unique_users bigint,
  failed_rate_limits bigint,
  tin_accesses bigint,
  data_exports bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view security summary';
  END IF;
  
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_events,
    COUNT(*) FILTER (WHERE severity IN ('high', 'critical'))::bigint as high_severity_events,
    COUNT(DISTINCT user_id)::bigint as unique_users,
    COUNT(*) FILTER (WHERE payload_hash = 'rate_limited')::bigint as failed_rate_limits,
    COUNT(*) FILTER (WHERE entity LIKE '%_tin')::bigint as tin_accesses,
    COUNT(*) FILTER (WHERE entity = 'data_export')::bigint as data_exports
  FROM audit_logs
  WHERE time > NOW() - (_days_back || ' days')::interval;
END;
$$;

COMMENT ON FUNCTION public.get_security_summary IS 
  'Provides a summary of security events for monitoring. Admin access only.';