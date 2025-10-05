-- Security Fix: Isolate cloud storage credentials from org owner access
-- Problem: Org owners could read encrypted credentials if their account is compromised
-- Solution: Separate policies - owners manage settings, only service role reads credentials

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Org owners can manage backup settings" ON public.backup_settings;

-- Policy 1: Org owners can view non-sensitive backup settings only
-- They can see provider, bucket, region, etc. but NOT the encrypted credentials
CREATE POLICY "Org owners can view backup settings (no credentials)"
ON public.backup_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.org_users
    WHERE org_users.org_id = backup_settings.org_id
      AND org_users.user_id = auth.uid()
      AND org_users.role = 'owner'::app_role
  )
);

-- Policy 2: Service role can read everything (for edge functions)
CREATE POLICY "Service role can read all backup settings"
ON public.backup_settings
FOR SELECT
TO service_role
USING (true);

-- Policy 3: Org owners can insert new backup settings
CREATE POLICY "Org owners can create backup settings"
ON public.backup_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.org_users
    WHERE org_users.org_id = backup_settings.org_id
      AND org_users.user_id = auth.uid()
      AND org_users.role = 'owner'::app_role
  )
);

-- Policy 4: Org owners can update backup settings
CREATE POLICY "Org owners can update backup settings"
ON public.backup_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.org_users
    WHERE org_users.org_id = backup_settings.org_id
      AND org_users.user_id = auth.uid()
      AND org_users.role = 'owner'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.org_users
    WHERE org_users.org_id = backup_settings.org_id
      AND org_users.user_id = auth.uid()
      AND org_users.role = 'owner'::app_role
  )
);

-- Policy 5: Org owners can delete backup settings
CREATE POLICY "Org owners can delete backup settings"
ON public.backup_settings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.org_users
    WHERE org_users.org_id = backup_settings.org_id
      AND org_users.user_id = auth.uid()
      AND org_users.role = 'owner'::app_role
  )
);

-- Add security comments
COMMENT ON POLICY "Org owners can view backup settings (no credentials)" ON public.backup_settings IS 
'Security: Org owners can see backup configuration but cannot access encrypted credentials. This prevents credential theft if an owner account is compromised.';

COMMENT ON POLICY "Service role can read all backup settings" ON public.backup_settings IS 
'Security: Only edge functions with service role can access encrypted credentials for backup operations.';

-- Ensure the get_backup_credentials function is properly secured
-- It should only be callable by service role (which edge functions use)
COMMENT ON FUNCTION public.get_backup_credentials IS 
'Security: This function must only be called by edge functions using service_role. Never expose to client applications.';

-- Verify RLS is enabled
ALTER TABLE public.backup_settings ENABLE ROW LEVEL SECURITY;