-- Critical Security Fix: Backup Credentials Protection
-- Issue: get_backup_credentials function lacks access control, allowing potential credential theft

-- Drop all versions of set_backup_credentials function
DROP FUNCTION IF EXISTS public.set_backup_credentials(uuid, text, text);
DROP FUNCTION IF EXISTS public.set_backup_credentials(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.set_backup_credentials(uuid, text, text, text, text);
DROP FUNCTION IF EXISTS public.set_backup_credentials(uuid, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.set_backup_credentials(uuid, text, text, text, text, text, text);

-- Drop and recreate get_backup_credentials with proper access control
DROP FUNCTION IF EXISTS public.get_backup_credentials(uuid);

CREATE OR REPLACE FUNCTION public.get_backup_credentials(_org_id UUID)
RETURNS TABLE(
  access_key TEXT,
  secret_key TEXT,
  provider TEXT,
  bucket TEXT,
  prefix TEXT,
  region TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- CRITICAL: Only service role can call this function
  -- Block all attempts from authenticated users
  IF auth.role() != 'service_role' THEN
    -- Log the unauthorized attempt
    INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash, severity)
    VALUES (
      'backup_credentials_unauthorized_access',
      _org_id::text,
      'read',
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'BLOCKED_ACCESS_ATTEMPT',
      'critical'
    );
    
    RAISE EXCEPTION 'SECURITY VIOLATION: Only service role can access backup credentials. This attempt has been logged.';
  END IF;
  
  -- Audit successful credential access by service role
  INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash, severity)
  VALUES (
    'backup_credentials_service_access',
    _org_id::text,
    'read',
    '00000000-0000-0000-0000-000000000000'::uuid, -- System/service role
    'service_role_access',
    'high'
  );
  
  -- Return decrypted credentials
  RETURN QUERY
  SELECT 
    CASE 
      WHEN bs.access_key_encrypted IS NOT NULL AND bs.access_key_nonce IS NOT NULL
      THEN convert_from(
        pgsodium.crypto_secretbox_open(
          decode(bs.access_key_encrypted, 'base64'),
          bs.access_key_nonce
        ),
        'utf8'
      )
      ELSE NULL  -- No fallback to plain text
    END as access_key,
    CASE 
      WHEN bs.secret_key_encrypted IS NOT NULL AND bs.secret_key_nonce IS NOT NULL
      THEN convert_from(
        pgsodium.crypto_secretbox_open(
          decode(bs.secret_key_encrypted, 'base64'),
          bs.secret_key_nonce
        ),
        'utf8'
      )
      ELSE NULL  -- No fallback to plain text
    END as secret_key,
    bs.provider,
    bs.bucket,
    bs.prefix,
    bs.region
  FROM backup_settings bs
  WHERE bs.org_id = _org_id
  AND bs.enabled = true;
END;
$$;

COMMENT ON FUNCTION public.get_backup_credentials IS 
'CRITICAL SECURITY: Only callable by service role. Decrypts and returns backup credentials for edge functions. Any unauthorized access attempt is logged as critical severity.';

-- Drop backup_settings_safe view and recreate as secure function
DROP VIEW IF EXISTS backup_settings_safe;

CREATE OR REPLACE FUNCTION public.get_backup_settings_safe(_org_id UUID)
RETURNS TABLE(
  org_id UUID,
  provider TEXT,
  bucket TEXT,
  prefix TEXT,
  region TEXT,
  enabled BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only org owners can view backup configuration
  IF NOT EXISTS (
    SELECT 1 
    FROM org_users ou
    WHERE ou.org_id = _org_id
    AND ou.user_id = auth.uid()
    AND ou.role = 'owner'::app_role
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only org owners can view backup configuration';
  END IF;
  
  -- Rate limit backup settings queries
  PERFORM log_and_check_rate_limit('backup_settings_access', 50, 3600);
  
  -- Audit the access
  INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash, severity)
  VALUES (
    'backup_settings_metadata_access',
    _org_id::text,
    'read',
    auth.uid(),
    'metadata_only',
    'medium'
  );
  
  -- Return safe metadata only (no credentials)
  RETURN QUERY
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
  WHERE bs.org_id = _org_id;
END;
$$;

COMMENT ON FUNCTION public.get_backup_settings_safe IS 
'Security definer function for org owners to safely view backup metadata without credentials. Includes rate limiting and audit logging.';

-- Recreate set_backup_credentials with audit logging
CREATE OR REPLACE FUNCTION public.set_backup_credentials(
  _org_id UUID,
  _access_key TEXT,
  _secret_key TEXT,
  _provider TEXT DEFAULT NULL,
  _bucket TEXT DEFAULT NULL,
  _prefix TEXT DEFAULT '',
  _region TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  access_key_nonce BYTEA;
  secret_key_nonce BYTEA;
  access_key_encrypted TEXT;
  secret_key_encrypted TEXT;
BEGIN
  -- Only org owners can set credentials
  IF NOT EXISTS (
    SELECT 1 
    FROM org_users ou
    WHERE ou.org_id = _org_id
    AND ou.user_id = auth.uid()
    AND ou.role = 'owner'::app_role
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only org owners can set backup credentials';
  END IF;
  
  -- Rate limit credential updates
  PERFORM log_and_check_rate_limit('backup_credentials_update', 10, 3600);
  
  -- Generate random nonces for encryption
  access_key_nonce := pgsodium.crypto_secretbox_noncegen();
  secret_key_nonce := pgsodium.crypto_secretbox_noncegen();
  
  -- Encrypt the credentials
  access_key_encrypted := encode(
    pgsodium.crypto_secretbox(
      convert_to(_access_key, 'utf8'),
      access_key_nonce
    ),
    'base64'
  );
  
  secret_key_encrypted := encode(
    pgsodium.crypto_secretbox(
      convert_to(_secret_key, 'utf8'),
      secret_key_nonce
    ),
    'base64'
  );
  
  -- Audit the credential update (before actual update)
  INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash, severity)
  VALUES (
    'backup_credentials_update',
    _org_id::text,
    'update',
    auth.uid(),
    'credentials_encrypted',
    'high'
  );
  
  -- Update or insert the settings
  INSERT INTO backup_settings (
    org_id, 
    provider, 
    bucket, 
    prefix, 
    region,
    access_key_encrypted,
    secret_key_encrypted,
    access_key_nonce,
    secret_key_nonce
  ) VALUES (
    _org_id,
    _provider,
    _bucket,
    _prefix,
    _region,
    access_key_encrypted,
    secret_key_encrypted,
    access_key_nonce,
    secret_key_nonce
  )
  ON CONFLICT (org_id) DO UPDATE SET
    provider = COALESCE(_provider, backup_settings.provider),
    bucket = COALESCE(_bucket, backup_settings.bucket),
    prefix = COALESCE(_prefix, backup_settings.prefix),
    region = COALESCE(_region, backup_settings.region),
    access_key_encrypted = access_key_encrypted,
    secret_key_encrypted = secret_key_encrypted,
    access_key_nonce = access_key_nonce,
    secret_key_nonce = secret_key_nonce,
    updated_at = now();
END;
$$;

COMMENT ON FUNCTION public.set_backup_credentials IS 
'Security definer function for org owners to set encrypted backup credentials. Includes rate limiting and audit logging. Never stores credentials in plain text.';

-- Create a function to detect potential credential theft attempts
CREATE OR REPLACE FUNCTION public.detect_backup_credential_theft_attempts()
RETURNS TABLE(
  user_id UUID,
  attempt_count BIGINT,
  first_attempt TIMESTAMPTZ,
  last_attempt TIMESTAMPTZ,
  severity TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can view theft attempts
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can view security incidents';
  END IF;
  
  RETURN QUERY
  SELECT 
    al.user_id,
    COUNT(*) as attempt_count,
    MIN(al.time) as first_attempt,
    MAX(al.time) as last_attempt,
    'critical'::text as severity
  FROM audit_logs al
  WHERE al.entity = 'backup_credentials_unauthorized_access'
  AND al.time > NOW() - INTERVAL '7 days'
  GROUP BY al.user_id
  ORDER BY COUNT(*) DESC;
END;
$$;

COMMENT ON FUNCTION public.detect_backup_credential_theft_attempts IS 
'Admin-only function to detect and analyze unauthorized backup credential access attempts.';

-- Update security documentation
INSERT INTO security_definer_functions (function_name, purpose, required_role, security_notes) VALUES
('get_backup_credentials', 'Decrypt credentials for edge functions', NULL, 'SERVICE ROLE ONLY - Blocks all user attempts, logs critical alerts'),
('get_backup_settings_safe', 'Safely retrieve backup metadata', 'owner', 'Rate limited, audit logged, no credentials exposed'),
('set_backup_credentials', 'Update encrypted backup credentials', 'owner', 'Rate limited, audit logged, automatic encryption'),
('detect_backup_credential_theft_attempts', 'Detect credential theft attempts', 'admin', 'Admin only - identifies suspicious access patterns')
ON CONFLICT (function_name) DO UPDATE SET
  purpose = EXCLUDED.purpose,
  required_role = EXCLUDED.required_role,
  security_notes = EXCLUDED.security_notes,
  last_reviewed_at = now();

-- Add comprehensive table documentation
COMMENT ON TABLE backup_settings IS 
'CRITICAL SECURITY: Stores encrypted cloud storage credentials for automated backups.
- Credentials encrypted via pgsodium with unique nonces per org
- Direct access blocked via RLS (service role only)
- Use set_backup_credentials() to update (org owners only)
- Use get_backup_credentials() to retrieve (service role only - edge functions)
- Use get_backup_settings_safe() to view metadata (org owners only)
- All access is audit logged with appropriate severity levels
- Unauthorized access attempts generate critical alerts';

COMMENT ON COLUMN backup_settings.access_key_encrypted IS 
'Encrypted access key for cloud storage. Only decryptable via get_backup_credentials() by service role.';

COMMENT ON COLUMN backup_settings.secret_key_encrypted IS 
'Encrypted secret key for cloud storage. Only decryptable via get_backup_credentials() by service role.';

COMMENT ON COLUMN backup_settings.access_key_nonce IS 
'Unique nonce for access_key encryption. Required for decryption.';

COMMENT ON COLUMN backup_settings.secret_key_nonce IS 
'Unique nonce for secret_key encryption. Required for decryption.';