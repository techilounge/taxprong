-- Create backup_settings table
CREATE TABLE public.backup_settings (
  org_id UUID PRIMARY KEY REFERENCES public.orgs(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('s3', 'gcs')),
  bucket TEXT NOT NULL,
  prefix TEXT NOT NULL DEFAULT '',
  access_key TEXT NOT NULL,
  secret_key TEXT NOT NULL, -- Should be encrypted at application level
  region TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backup_settings ENABLE ROW LEVEL SECURITY;

-- Org owners can manage backup settings
CREATE POLICY "Org owners can manage backup settings"
  ON public.backup_settings
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.org_users
    WHERE org_users.org_id = backup_settings.org_id
    AND org_users.user_id = auth.uid()
    AND org_users.role = 'owner'
  ));

-- Add index
CREATE INDEX idx_backup_settings_org_id ON public.backup_settings(org_id);