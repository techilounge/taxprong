-- Create saved_reports table
CREATE TABLE public.saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  query_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

-- Org members can view saved reports
CREATE POLICY "Org members can view saved reports"
  ON public.saved_reports
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.org_users
    WHERE org_users.org_id = saved_reports.org_id
    AND org_users.user_id = auth.uid()
  ));

-- Org staff can manage saved reports
CREATE POLICY "Org staff can manage saved reports"
  ON public.saved_reports
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.org_users
    WHERE org_users.org_id = saved_reports.org_id
    AND org_users.user_id = auth.uid()
    AND org_users.role IN ('owner', 'staff', 'admin')
  ));

-- Add indexes
CREATE INDEX idx_saved_reports_org_id ON public.saved_reports(org_id);
CREATE INDEX idx_saved_reports_created_by ON public.saved_reports(created_by);