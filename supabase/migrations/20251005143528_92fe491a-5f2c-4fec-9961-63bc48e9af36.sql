-- Drop the insecure view
DROP VIEW IF EXISTS public.backup_settings_view;

-- Create a secure function to get backup settings metadata (without credentials)
CREATE OR REPLACE FUNCTION public.get_backup_settings_metadata(_org_id uuid)
RETURNS TABLE (
  org_id uuid,
  provider text,
  bucket text,
  prefix text,
  region text,
  enabled boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only return data if the requesting user is an org owner
  SELECT 
    bs.org_id,
    bs.provider,
    bs.bucket,
    bs.prefix,
    bs.region,
    bs.enabled,
    bs.created_at,
    bs.updated_at
  FROM backup_settings bs
  WHERE bs.org_id = _org_id
  AND EXISTS (
    SELECT 1 
    FROM org_users ou
    WHERE ou.org_id = _org_id
    AND ou.user_id = auth.uid()
    AND ou.role = 'owner'::app_role
  );
$$;