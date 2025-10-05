-- Remove plaintext credential columns from backup_settings table
-- All application code already uses the encrypted columns via RPC functions
-- This migration enhances security by ensuring no plaintext credentials exist in the database

ALTER TABLE backup_settings 
  DROP COLUMN IF EXISTS access_key,
  DROP COLUMN IF EXISTS secret_key;

-- Add a comment to document the security improvement
COMMENT ON TABLE backup_settings IS 
  'Stores cloud storage backup configuration. Credentials are stored encrypted using pgsodium. 
   Use get_backup_credentials() RPC function to access decrypted credentials (service role only).
   Use set_backup_credentials() RPC function to update credentials with automatic encryption.';

-- Verify the encrypted columns and nonces exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'backup_settings' 
    AND column_name IN ('access_key_encrypted', 'secret_key_encrypted', 'access_key_nonce', 'secret_key_nonce')
  ) THEN
    RAISE EXCEPTION 'Required encrypted credential columns are missing. Migration aborted.';
  END IF;
END $$;