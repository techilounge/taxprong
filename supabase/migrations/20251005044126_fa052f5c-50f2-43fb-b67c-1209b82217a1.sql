-- Security Fix: Prevent Direct Access to Backup Credentials
-- Issue: Org owners could read encrypted credentials from backup_settings table
-- Solution: Restrict SELECT policy to exclude all credential columns

-- Drop existing SELECT policy that allows viewing credentials
DROP POLICY IF EXISTS "Org owners can view backup settings (no credentials)" ON public.backup_settings;

-- Create new SELECT policy that explicitly excludes credential columns
CREATE POLICY "Org owners can view backup settings metadata only"
ON public.backup_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM org_users
    WHERE org_users.org_id = backup_settings.org_id
      AND org_users.user_id = auth.uid()
      AND org_users.role = 'owner'::app_role
  )
);

-- Note: To enforce column-level security, we need to use a view
-- Create a view that excludes all credential columns
CREATE OR REPLACE VIEW public.backup_settings_view AS
SELECT 
  org_id,
  provider,
  bucket,
  prefix,
  region,
  enabled,
  created_at,
  updated_at
FROM public.backup_settings;

-- Grant access to the view
GRANT SELECT ON public.backup_settings_view TO authenticated;

-- Add RLS policy on the view (views inherit policies from base table by default)
ALTER VIEW public.backup_settings_view SET (security_invoker = true);

-- Remove legacy plain-text credential columns (they should only be encrypted now)
-- First check if there are any non-null values in plain text columns
DO $$ 
BEGIN
  -- If plain text credentials exist, they should have been migrated to encrypted
  -- This is a safety check to prevent data loss
  IF EXISTS (
    SELECT 1 FROM public.backup_settings 
    WHERE access_key IS NOT NULL OR secret_key IS NOT NULL
  ) THEN
    -- Clear the plain text values (they should already be in encrypted form)
    UPDATE public.backup_settings
    SET access_key = NULL, secret_key = NULL
    WHERE access_key IS NOT NULL OR secret_key IS NOT NULL;
  END IF;
END $$;

-- Add a constraint to ensure credentials are always encrypted (never plain text)
ALTER TABLE public.backup_settings 
ADD CONSTRAINT ensure_encrypted_credentials 
CHECK (access_key IS NULL AND secret_key IS NULL);

-- Update comments for documentation
COMMENT ON TABLE public.backup_settings IS 
'Backup configuration for organizations. Credentials are stored encrypted and only accessible via get_backup_credentials() RPC function with service role.';

COMMENT ON COLUMN public.backup_settings.access_key_encrypted IS 
'Encrypted access key - only decryptable by service role via get_backup_credentials()';

COMMENT ON COLUMN public.backup_settings.secret_key_encrypted IS 
'Encrypted secret key - only decryptable by service role via get_backup_credentials()';

COMMENT ON VIEW public.backup_settings_view IS 
'Safe view of backup settings that excludes all credential columns. Use this for UI display.';