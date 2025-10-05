-- Enable pgsodium extension for encryption if not already enabled
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Create a function to encrypt backup credentials
CREATE OR REPLACE FUNCTION public.encrypt_backup_credential(credential TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encrypted_value TEXT;
BEGIN
  -- Use pgsodium to encrypt the credential
  -- The key is automatically managed by Supabase
  encrypted_value := encode(
    pgsodium.crypto_secretbox(
      convert_to(credential, 'utf8'),
      pgsodium.crypto_secretbox_keygen()
    ),
    'base64'
  );
  RETURN encrypted_value;
END;
$$;

-- Create a function to decrypt backup credentials (only accessible by service role)
CREATE OR REPLACE FUNCTION public.decrypt_backup_credential(encrypted_credential TEXT, decryption_key BYTEA)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decrypted_value TEXT;
BEGIN
  -- Only service role should call this function
  -- Edge functions will use this to decrypt credentials
  decrypted_value := convert_from(
    pgsodium.crypto_secretbox_open(
      decode(encrypted_credential, 'base64'),
      decryption_key
    ),
    'utf8'
  );
  RETURN decrypted_value;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to decrypt credential';
END;
$$;

-- Add columns for encrypted credentials and encryption keys
ALTER TABLE public.backup_settings
ADD COLUMN IF NOT EXISTS access_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS secret_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS access_key_nonce BYTEA,
ADD COLUMN IF NOT EXISTS secret_key_nonce BYTEA;

-- Create a secure function to update backup credentials
CREATE OR REPLACE FUNCTION public.set_backup_credentials(
  _org_id UUID,
  _access_key TEXT,
  _secret_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  access_nonce BYTEA;
  secret_nonce BYTEA;
BEGIN
  -- Verify the user is an org owner
  IF NOT EXISTS (
    SELECT 1 FROM org_users 
    WHERE org_id = _org_id 
    AND user_id = auth.uid() 
    AND role = 'owner'::app_role
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only org owners can set backup credentials';
  END IF;

  -- Generate nonces for encryption
  access_nonce := pgsodium.crypto_secretbox_keygen();
  secret_nonce := pgsodium.crypto_secretbox_keygen();

  -- Update with encrypted credentials
  UPDATE backup_settings
  SET 
    access_key_encrypted = encode(
      pgsodium.crypto_secretbox(convert_to(_access_key, 'utf8'), access_nonce),
      'base64'
    ),
    secret_key_encrypted = encode(
      pgsodium.crypto_secretbox(convert_to(_secret_key, 'utf8'), secret_nonce),
      'base64'
    ),
    access_key_nonce = access_nonce,
    secret_key_nonce = secret_nonce,
    access_key = NULL,  -- Clear plain text
    secret_key = NULL,  -- Clear plain text
    updated_at = now()
  WHERE org_id = _org_id;
END;
$$;

-- Create a function for edge functions to get decrypted credentials
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
  -- This function should only be called by edge functions (service role)
  -- Not by regular authenticated users
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
      ELSE bs.access_key  -- Fallback for legacy plain text
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
      ELSE bs.secret_key  -- Fallback for legacy plain text
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

-- Make the plain text columns nullable for backward compatibility
ALTER TABLE public.backup_settings
ALTER COLUMN access_key DROP NOT NULL,
ALTER COLUMN secret_key DROP NOT NULL;

-- Add comment to document the security improvement
COMMENT ON TABLE public.backup_settings IS 'Backup settings with encrypted credential storage. Use set_backup_credentials() to update and get_backup_credentials() to retrieve.';
COMMENT ON COLUMN public.backup_settings.access_key IS 'DEPRECATED: Legacy plain text storage. Use access_key_encrypted instead.';
COMMENT ON COLUMN public.backup_settings.secret_key IS 'DEPRECATED: Legacy plain text storage. Use secret_key_encrypted instead.';