-- Drop the existing profile SELECT policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a stronger policy that explicitly requires authentication
-- This prevents any unauthenticated access and makes the security intent crystal clear
CREATE POLICY "Authenticated users can view own profile only"
ON public.profiles
FOR SELECT
TO authenticated  -- Only applies to authenticated users
USING (
  auth.uid() IS NOT NULL  -- Explicit authentication check
  AND auth.uid() = id     -- Users can only see their own profile
);

-- Add a comment to document the security measure
COMMENT ON POLICY "Authenticated users can view own profile only" ON public.profiles IS 
'Security: Prevents unauthorized access to user PII (email, phone). Users can only view their own profile when authenticated.';

-- Verify RLS is enabled (should already be, but double-check)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Also ensure the UPDATE policy is secure
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Authenticated users can update own profile only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);

COMMENT ON POLICY "Authenticated users can update own profile only" ON public.profiles IS 
'Security: Prevents unauthorized modifications. Users can only update their own profile when authenticated.';