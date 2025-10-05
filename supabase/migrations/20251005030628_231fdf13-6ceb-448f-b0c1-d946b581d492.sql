-- Fix Security Definer View issue
-- Problem: public_profiles view was using SECURITY DEFINER, which bypasses user's RLS
-- Solution: Explicitly set view to SECURITY INVOKER to respect querying user's permissions

-- Drop the existing view
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate the view with explicit SECURITY INVOKER
-- This ensures the view respects the RLS policies of the user querying it
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Add documentation explaining the security model
COMMENT ON VIEW public.public_profiles IS 
'Security: SECURITY INVOKER view containing only non-sensitive profile data (id, name, created_at). 
This view respects the RLS policies of the querying user, ensuring proper access control. 
Use this instead of profiles table for collaborative features where you need to display user names.';