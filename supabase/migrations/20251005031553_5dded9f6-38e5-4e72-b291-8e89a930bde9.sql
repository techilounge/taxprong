-- Phase 2 Security Fixes

-- 2.1: Drop public_profiles view (it has no RLS and exposes user data)
DROP VIEW IF EXISTS public.public_profiles CASCADE;

-- 2.2: Restrict pro_reviews to authenticated users only
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.pro_reviews;

CREATE POLICY "Authenticated users can view reviews"
ON public.pro_reviews
FOR SELECT
TO authenticated
USING (true);

-- 2.3: Add RLS policy for users to view own reviews
CREATE POLICY "Users can view reviews they wrote"
ON public.pro_reviews
FOR SELECT
TO authenticated
USING (reviewer_user_id = auth.uid());