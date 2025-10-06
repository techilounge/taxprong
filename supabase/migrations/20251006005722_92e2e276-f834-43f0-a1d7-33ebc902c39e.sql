-- Fix profiles table RLS policies to explicitly scope by role
-- This prevents any potential bypass or misconfiguration

-- Drop the ambiguous "Deny all anonymous access to profiles" policy
DROP POLICY IF EXISTS "Deny all anonymous access to profiles" ON profiles;

-- Create explicit role-scoped policies for anonymous users
-- This ensures anonymous users are completely blocked from all operations
CREATE POLICY "Block all anonymous SELECT on profiles"
  ON profiles
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "Block all anonymous INSERT on profiles"
  ON profiles
  FOR INSERT
  TO anon
  WITH CHECK (false);

CREATE POLICY "Block all anonymous UPDATE on profiles"
  ON profiles
  FOR UPDATE
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Block all anonymous DELETE on profiles"
  ON profiles
  FOR DELETE
  TO anon
  USING (false);

-- Drop and recreate authenticated user policies with explicit role targeting
DROP POLICY IF EXISTS "Users can view only their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update only their own profile" ON profiles;
DROP POLICY IF EXISTS "Prevent manual profile insertion" ON profiles;
DROP POLICY IF EXISTS "Prevent profile deletion" ON profiles;

-- Authenticated users can only view their own profile
CREATE POLICY "Authenticated users view own profile only"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Authenticated users can only update their own profile
CREATE POLICY "Authenticated users update own profile only"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Prevent all manual insertions (profiles created via trigger only)
CREATE POLICY "Block all manual INSERT on profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Prevent all deletions (profiles should never be deleted)
CREATE POLICY "Block all DELETE on profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (false);

-- Add comprehensive comments for security documentation
COMMENT ON POLICY "Block all anonymous SELECT on profiles" ON profiles IS 
  'SECURITY: Completely blocks anonymous users from reading any profile data. Prevents harvesting of email addresses, phone numbers, and names.';

COMMENT ON POLICY "Authenticated users view own profile only" ON profiles IS 
  'SECURITY: Authenticated users can only view their own profile data (auth.uid() = id). Prevents lateral movement and data harvesting.';

COMMENT ON POLICY "Authenticated users update own profile only" ON profiles IS 
  'SECURITY: Users can only modify their own profile. Both USING and WITH CHECK enforce auth.uid() = id to prevent privilege escalation.';

COMMENT ON POLICY "Block all manual INSERT on profiles" ON profiles IS 
  'SECURITY: Profiles can only be created via the handle_new_user() trigger. Prevents manual profile creation attacks.';

COMMENT ON POLICY "Block all DELETE on profiles" ON profiles IS 
  'SECURITY: Profiles cannot be deleted directly. Use the delete_request flow for GDPR compliance instead.';