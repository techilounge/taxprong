-- Phase 2 Security Fix: Enhance KB Ingest Jobs Privacy
-- Add org-based scoping and strengthen RLS policies

-- Drop existing RLS policies on kb_ingest_jobs
DROP POLICY IF EXISTS "Users can view own ingest jobs" ON public.kb_ingest_jobs;
DROP POLICY IF EXISTS "Service role can manage ingest jobs" ON public.kb_ingest_jobs;

-- Create stricter RLS policies with org-based scoping
CREATE POLICY "Users can view own org ingest jobs"
ON public.kb_ingest_jobs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM kb_docs
    JOIN org_users ON kb_docs.org_id = org_users.org_id
    WHERE kb_docs.id = kb_ingest_jobs.doc_id
    AND org_users.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage all ingest jobs"
ON public.kb_ingest_jobs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comments documenting the security improvement
COMMENT ON TABLE kb_ingest_jobs IS 
  'Stores knowledge base document ingestion job status. Access is restricted to org members through kb_docs relationship. Service role can manage all jobs for processing.';

-- Create a security definer function for rate limiting checks
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _action text,
  _max_requests integer,
  _time_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count integer;
BEGIN
  -- Count recent requests for this user and action
  SELECT COUNT(*)
  INTO request_count
  FROM audit_logs
  WHERE user_id = _user_id
    AND entity = _action
    AND time > NOW() - (_time_window_seconds || ' seconds')::interval;
  
  -- Return true if under limit, false if over limit
  RETURN request_count < _max_requests;
END;
$$;

COMMENT ON FUNCTION public.check_rate_limit IS 
  'Checks if a user has exceeded rate limits for a specific action. Returns false if rate limit exceeded. Uses audit_logs for tracking.';

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_rate_limit 
ON audit_logs(user_id, entity, time DESC);

-- Add a helper function to log and check rate limits
CREATE OR REPLACE FUNCTION public.log_and_check_rate_limit(
  _action text,
  _max_requests integer DEFAULT 100,
  _time_window_seconds integer DEFAULT 3600
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_allowed boolean;
BEGIN
  -- Check if rate limit would be exceeded
  is_allowed := check_rate_limit(auth.uid(), _action, _max_requests, _time_window_seconds);
  
  -- Log the attempt regardless
  INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash)
  VALUES (_action, auth.uid()::text, 'access', auth.uid(), 
          CASE WHEN is_allowed THEN 'allowed' ELSE 'rate_limited' END);
  
  -- Raise exception if rate limited
  IF NOT is_allowed THEN
    RAISE EXCEPTION 'Rate limit exceeded for action: %. Please try again later.', _action;
  END IF;
  
  RETURN is_allowed;
END;
$$;

COMMENT ON FUNCTION public.log_and_check_rate_limit IS 
  'Logs the action attempt and checks rate limits. Raises exception if rate limit is exceeded. Default: 100 requests per hour.';