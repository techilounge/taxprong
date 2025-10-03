-- Create data_export_requests table
CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  file_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Org members can view their org's export requests
CREATE POLICY "Org members can view exports"
  ON public.data_export_requests
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.org_users
    WHERE org_users.org_id = data_export_requests.org_id
    AND org_users.user_id = auth.uid()
  ));

-- Policy: Org owners/staff can request exports
CREATE POLICY "Org staff can request exports"
  ON public.data_export_requests
  FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.org_users
      WHERE org_users.org_id = data_export_requests.org_id
      AND org_users.user_id = auth.uid()
      AND org_users.role IN ('owner', 'staff')
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_data_export_requests_org_id ON public.data_export_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON public.data_export_requests(status);

-- Create storage bucket for exports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('data-exports', 'data-exports', false, 52428800, ARRAY['application/zip', 'application/x-zip-compressed'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for data-exports bucket
CREATE POLICY "Org members can download their exports"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'data-exports'
    AND EXISTS (
      SELECT 1 FROM public.data_export_requests der
      JOIN public.org_users ou ON der.org_id = ou.org_id
      WHERE der.file_url = storage.objects.name
      AND ou.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can upload exports"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'data-exports');