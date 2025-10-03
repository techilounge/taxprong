-- Create privacy_consents table
CREATE TABLE IF NOT EXISTS public.privacy_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted BOOLEAN NOT NULL DEFAULT false,
  accepted_at TIMESTAMPTZ,
  version TEXT NOT NULL DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.privacy_consents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own consent records
CREATE POLICY "Users can view own consent"
  ON public.privacy_consents
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own consent
CREATE POLICY "Users can insert own consent"
  ON public.privacy_consents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own consent
CREATE POLICY "Users can update own consent"
  ON public.privacy_consents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_privacy_consents_user_id ON public.privacy_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_consents_accepted ON public.privacy_consents(accepted);