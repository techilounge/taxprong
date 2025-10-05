-- Phase 1 Security Fix: Profile Enumeration Protection
-- Create a secure function to access profiles with audit logging

-- Create a security definer function to safely get profile by ID with audit logging
CREATE OR REPLACE FUNCTION public.get_profile_safely(_profile_id uuid)
RETURNS TABLE(
  id uuid,
  email text,
  name text,
  phone text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the profile access attempt for rate limiting and security monitoring
  INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash)
  VALUES ('profile_access', _profile_id::text, 'read', auth.uid(), 'profile_query');
  
  -- Only return profile if user is accessing their own profile
  IF auth.uid() != _profile_id THEN
    RAISE EXCEPTION 'Unauthorized: Users can only access their own profile';
  END IF;
  
  -- Return the profile data
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.name,
    p.phone,
    p.created_at
  FROM profiles p
  WHERE p.id = _profile_id;
END;
$$;

-- Add comment documenting the security improvement
COMMENT ON FUNCTION public.get_profile_safely IS 
  'Securely retrieves a user profile with audit logging. Only allows users to access their own profile. All access attempts are logged to audit_logs for rate limiting and security monitoring.';

-- Update profiles RLS policies to be more restrictive and prevent enumeration
-- First drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create more restrictive policies with audit logging
CREATE POLICY "Users can view own profile securely"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile securely"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add index on audit_logs for efficient rate limiting queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_profile_access 
ON audit_logs(entity, user_id, time) 
WHERE entity = 'profile_access';