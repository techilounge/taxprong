-- Fix remaining security issues from Phase 2

-- 1. Fix backup_settings RLS to prevent org owners from manipulating credentials
DROP POLICY IF EXISTS "Org owners can create backup settings" ON backup_settings;
DROP POLICY IF EXISTS "Org owners can update backup settings" ON backup_settings;
DROP POLICY IF EXISTS "Org owners can delete backup settings" ON backup_settings;

-- Org owners cannot directly INSERT/UPDATE/DELETE credentials
-- They must use set_backup_credentials function
CREATE POLICY "Only service role can manage backup settings"
ON backup_settings FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 2. Grant SELECT on backup_settings_safe view to authenticated users
-- This view only shows metadata, not credentials
GRANT SELECT ON backup_settings_safe TO authenticated;

-- No RLS policies needed on views - access control via grants
-- Views inherit permissions from underlying tables and grants

-- 3. Update expenses RLS to ensure business-level authorization
DROP POLICY IF EXISTS "Org staff can manage expenses" ON expenses;

CREATE POLICY "Org staff can manage expenses v2"
ON expenses FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM org_users ou
    WHERE ou.org_id = expenses.org_id 
    AND ou.user_id = auth.uid() 
    AND ou.role IN ('owner'::app_role, 'staff'::app_role)
  )
  AND (
    -- If business_id is set, verify it belongs to the same org
    expenses.business_id IS NULL
    OR EXISTS (
      SELECT 1 
      FROM businesses b
      WHERE b.id = expenses.business_id 
      AND b.org_id = expenses.org_id
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM org_users ou
    WHERE ou.org_id = expenses.org_id 
    AND ou.user_id = auth.uid() 
    AND ou.role IN ('owner'::app_role, 'staff'::app_role)
  )
  AND (
    -- If business_id is set, verify it belongs to the same org
    expenses.business_id IS NULL
    OR EXISTS (
      SELECT 1 
      FROM businesses b
      WHERE b.id = expenses.business_id 
      AND b.org_id = expenses.org_id
    )
  )
);

-- 4. Add backup_settings management functions for org owners
-- This allows them to update non-sensitive settings without credential access
CREATE OR REPLACE FUNCTION update_backup_metadata(
  _org_id uuid,
  _provider text,
  _bucket text,
  _prefix text,
  _region text,
  _enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the user is an org owner
  IF NOT EXISTS (
    SELECT 1 FROM org_users 
    WHERE org_id = _org_id 
    AND user_id = auth.uid() 
    AND role = 'owner'::app_role
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only org owners can update backup settings';
  END IF;

  -- Update only metadata fields, never credentials
  INSERT INTO backup_settings (org_id, provider, bucket, prefix, region, enabled)
  VALUES (_org_id, _provider, _bucket, _prefix, _region, _enabled)
  ON CONFLICT (org_id) DO UPDATE SET
    provider = EXCLUDED.provider,
    bucket = EXCLUDED.bucket,
    prefix = EXCLUDED.prefix,
    region = EXCLUDED.region,
    enabled = EXCLUDED.enabled,
    updated_at = now();
END;
$$;

COMMENT ON FUNCTION update_backup_metadata IS 'Allows org owners to update backup metadata without accessing credentials. Security definer.';

-- Document the new functions
INSERT INTO security_definer_functions (function_name, purpose, required_role, security_notes) VALUES
('run_automated_security_checks', 'Automated security monitoring', NULL, 'System function - creates security alerts automatically'),
('get_unresolved_security_alerts', 'Retrieve unresolved security alerts', 'admin', 'Admin only - returns active security issues'),
('resolve_security_alert', 'Mark security alert as resolved', 'admin', 'Admin only - includes audit logging'),
('audit_profile_access_pattern', 'Detect profile enumeration attacks', 'admin', 'Admin only - monitors profile query patterns'),
('get_security_dashboard_enhanced', 'Enhanced security dashboard', 'admin', 'Admin only - includes alert counts'),
('update_backup_metadata', 'Update backup settings metadata', 'owner', 'Org owners only - never exposes credentials')
ON CONFLICT (function_name) DO UPDATE SET
  purpose = EXCLUDED.purpose,
  required_role = EXCLUDED.required_role,
  security_notes = EXCLUDED.security_notes,
  last_reviewed_at = now();