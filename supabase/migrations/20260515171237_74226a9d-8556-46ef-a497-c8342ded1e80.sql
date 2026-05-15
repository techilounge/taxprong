
-- 1) Fix log_and_check_rate_limit to write meaningful audit rows
CREATE OR REPLACE FUNCTION public.log_and_check_rate_limit(
  _action text,
  _max_requests integer DEFAULT 100,
  _time_window_seconds integer DEFAULT 3600
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_allowed boolean;
  rate_limit_sentinel constant uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  is_allowed := check_rate_limit(auth.uid(), _action, _max_requests, _time_window_seconds);

  INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash)
  VALUES (
    'rate_limit:' || _action,
    rate_limit_sentinel,
    'access',
    auth.uid(),
    CASE WHEN is_allowed THEN 'allowed' ELSE 'rate_limited' END
  );

  IF NOT is_allowed THEN
    RAISE EXCEPTION 'Rate limit exceeded for action: %. Please try again later.', _action;
  END IF;

  RETURN is_allowed;
END;
$function$;

-- 2) Make kb-documents bucket private
UPDATE storage.buckets SET public = false WHERE id = 'kb-documents';

-- 3) Restrict admin_notes column on professional_services_requests
-- Revoke column-level SELECT/UPDATE for non-admin roles
REVOKE ALL ON public.professional_services_requests FROM authenticated, anon;

GRANT SELECT (
  id, service_type, status, contact_name, contact_email, contact_phone,
  company_name, budget_range, preferred_date, description,
  assigned_to, user_id, org_id, created_at, updated_at
) ON public.professional_services_requests TO authenticated;

GRANT INSERT ON public.professional_services_requests TO authenticated;

GRANT UPDATE (
  service_type, status, contact_name, contact_email, contact_phone,
  company_name, budget_range, preferred_date, description, updated_at
) ON public.professional_services_requests TO authenticated;

-- Service role retains full access (default), and admin RLS policy + SECURITY DEFINER
-- function get_professional_services_requests continue to surface admin_notes for admins.
