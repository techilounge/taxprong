-- Security Fix: Prevent customer email and phone enumeration
-- Problem: User IDs are exposed in many tables, allowing potential enumeration of profiles
-- Solution: Maintain strict user-own-profile access, add admin-only exception, create public view

-- Drop existing policies to recreate with explicit role targeting
DROP POLICY IF EXISTS "Authenticated users can view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update own profile only" ON public.profiles;

-- Policy 1: Users can ONLY view their own profile (prevents enumeration)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Admins can view all profiles (for legitimate admin operations like delete requests)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Policy 3: Users can ONLY update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a public_profiles view with ONLY non-sensitive data
-- This can be safely used in collaborative contexts without exposing PII
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  name,
  created_at
FROM public.profiles;

-- Grant access to the public view
GRANT SELECT ON public.public_profiles TO authenticated;

-- Add security documentation
COMMENT ON TABLE public.profiles IS 
'Security: Contains sensitive PII (email, phone). Access restricted to profile owner and admins only. Use public_profiles view for non-sensitive profile data.';

COMMENT ON COLUMN public.profiles.email IS 
'Security: Sensitive PII. Only accessible to profile owner and admins. Never expose in public APIs.';

COMMENT ON COLUMN public.profiles.phone IS 
'Security: Sensitive PII. Only accessible to profile owner and admins. Never expose in public APIs.';

COMMENT ON VIEW public.public_profiles IS 
'Security: Safe view containing only non-sensitive profile data (id, name, created_at). Use this instead of profiles table for collaborative features.';

-- Verify RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;