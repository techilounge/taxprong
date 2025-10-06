-- Phase 2: Medium-Priority Security Enhancements

-- 2.1: Add rate limiting for professional services requests (anti-harvesting)
CREATE OR REPLACE FUNCTION check_professional_services_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rate limit professional services queries to prevent contact harvesting
  -- Allow 50 queries per hour per user
  PERFORM log_and_check_rate_limit('professional_services_access', 50, 3600);
  RETURN NEW;
END;
$$;

-- Trigger on professional services requests SELECT operations
-- Note: Triggers can't fire on SELECT, so we'll use a security definer function instead
CREATE OR REPLACE FUNCTION get_professional_services_requests(_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  service_type text,
  status text,
  contact_name text,
  contact_email text,
  contact_phone text,
  company_name text,
  budget_range text,
  preferred_date date,
  description text,
  admin_notes text,
  assigned_to uuid,
  user_id uuid,
  org_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rate limit access
  PERFORM log_and_check_rate_limit('professional_services_access', 50, 3600);
  
  -- Audit the bulk access
  INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash, severity)
  VALUES ('professional_services_bulk_access', auth.uid()::text, 'read', auth.uid(), 
          'limit_' || _limit::text, 'medium');
  
  -- Return data based on user permissions
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    -- Admins can see all
    RETURN QUERY
    SELECT 
      psr.id, psr.service_type, psr.status, psr.contact_name, psr.contact_email,
      psr.contact_phone, psr.company_name, psr.budget_range, psr.preferred_date,
      psr.description, psr.admin_notes, psr.assigned_to, psr.user_id, psr.org_id,
      psr.created_at, psr.updated_at
    FROM professional_services_requests psr
    ORDER BY psr.created_at DESC
    LIMIT _limit;
  ELSE
    -- Regular users can only see their own
    RETURN QUERY
    SELECT 
      psr.id, psr.service_type, psr.status, psr.contact_name, psr.contact_email,
      psr.contact_phone, psr.company_name, psr.budget_range, psr.preferred_date,
      psr.description, psr.admin_notes, psr.assigned_to, psr.user_id, psr.org_id,
      psr.created_at, psr.updated_at
    FROM professional_services_requests psr
    WHERE psr.user_id = auth.uid()
    ORDER BY psr.created_at DESC
    LIMIT _limit;
  END IF;
END;
$$;

-- 2.2: Add rate limiting for marketplace data (anti-scraping)
CREATE OR REPLACE FUNCTION get_pros_list(_limit integer DEFAULT 50, _offset integer DEFAULT 0)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  org_id uuid,
  practice_name text,
  bio text,
  hourly_rate numeric,
  services text[],
  badges text[],
  avg_rating numeric,
  review_count integer,
  kyc_status text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rate limit marketplace queries to prevent scraping
  -- Allow 100 queries per hour per user
  PERFORM log_and_check_rate_limit('marketplace_pros_access', 100, 3600);
  
  -- Audit bulk access patterns
  IF _limit > 20 OR _offset > 100 THEN
    INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash, severity)
    VALUES ('marketplace_bulk_scraping_attempt', auth.uid()::text, 'read', auth.uid(), 
            'limit_' || _limit::text || '_offset_' || _offset::text, 'high');
  END IF;
  
  -- Return pros data with reasonable limits
  RETURN QUERY
  SELECT 
    p.id, p.user_id, p.org_id, p.practice_name, p.bio, p.hourly_rate,
    p.services, p.badges, p.avg_rating, p.review_count, p.kyc_status, p.created_at
  FROM pros p
  ORDER BY p.created_at DESC
  LIMIT LEAST(_limit, 50)  -- Max 50 results per query
  OFFSET _offset;
END;
$$;

CREATE OR REPLACE FUNCTION get_pro_reviews(_pro_id uuid, _limit integer DEFAULT 20)
RETURNS TABLE (
  id uuid,
  pro_id uuid,
  reviewer_user_id uuid,
  engagement_id uuid,
  rating integer,
  comment text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rate limit review queries
  PERFORM log_and_check_rate_limit('marketplace_reviews_access', 100, 3600);
  
  -- Audit bulk access
  IF _limit > 20 THEN
    INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash, severity)
    VALUES ('reviews_bulk_access', _pro_id::text, 'read', auth.uid(), 
            'limit_' || _limit::text, 'medium');
  END IF;
  
  -- Return reviews with limit
  RETURN QUERY
  SELECT 
    r.id, r.pro_id, r.reviewer_user_id, r.engagement_id, r.rating, r.comment, r.created_at
  FROM pro_reviews r
  WHERE r.pro_id = _pro_id
  ORDER BY r.created_at DESC
  LIMIT LEAST(_limit, 20);  -- Max 20 reviews per query
END;
$$;

-- Add monitoring function for suspicious patterns
CREATE OR REPLACE FUNCTION detect_suspicious_access_patterns()
RETURNS TABLE (
  user_id uuid,
  action_type text,
  request_count bigint,
  first_request timestamp with time zone,
  last_request timestamp with time zone,
  severity text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can view this
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can view access patterns';
  END IF;
  
  RETURN QUERY
  SELECT 
    al.user_id,
    al.entity as action_type,
    COUNT(*) as request_count,
    MIN(al.time) as first_request,
    MAX(al.time) as last_request,
    CASE 
      WHEN COUNT(*) > 500 THEN 'critical'
      WHEN COUNT(*) > 200 THEN 'high'
      WHEN COUNT(*) > 100 THEN 'medium'
      ELSE 'low'
    END as severity
  FROM audit_logs al
  WHERE al.time > NOW() - INTERVAL '1 hour'
    AND al.entity IN (
      'professional_services_access',
      'marketplace_pros_access', 
      'marketplace_reviews_access',
      'profile_access'
    )
  GROUP BY al.user_id, al.entity
  HAVING COUNT(*) > 50  -- Flag users with >50 requests/hour
  ORDER BY request_count DESC;
END;
$$;

-- Add helper function for single pro access with rate limiting
CREATE OR REPLACE FUNCTION get_pro_safely(_pro_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  org_id uuid,
  practice_name text,
  bio text,
  hourly_rate numeric,
  services text[],
  badges text[],
  avg_rating numeric,
  review_count integer,
  kyc_status text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rate limit individual pro queries
  PERFORM log_and_check_rate_limit('marketplace_pro_view', 200, 3600);
  
  RETURN QUERY
  SELECT 
    p.id, p.user_id, p.org_id, p.practice_name, p.bio, p.hourly_rate,
    p.services, p.badges, p.avg_rating, p.review_count, p.kyc_status, p.created_at
  FROM pros p
  WHERE p.id = _pro_id;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION get_professional_services_requests IS 
'Rate-limited access to professional services requests. Limits to 50 queries per hour per user and logs bulk access patterns to detect contact harvesting.';

COMMENT ON FUNCTION get_pros_list IS 
'Rate-limited access to professionals marketplace. Limits to 100 queries per hour and caps results at 50 per query to prevent scraping.';

COMMENT ON FUNCTION get_pro_reviews IS 
'Rate-limited access to professional reviews. Limits to 100 queries per hour and caps at 20 reviews per query.';

COMMENT ON FUNCTION detect_suspicious_access_patterns IS 
'Admin-only function to detect suspicious access patterns including scraping attempts and contact harvesting. Identifies users making excessive queries.';

COMMENT ON FUNCTION get_pro_safely IS 
'Rate-limited function to safely retrieve a single professional profile. Use this instead of direct table queries to prevent enumeration attacks.';