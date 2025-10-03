-- Create backup_runs table
CREATE TABLE public.backup_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('ok', 'failed', 'running')),
  file_url TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  tables_count INTEGER DEFAULT 0,
  rows_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backup_runs ENABLE ROW LEVEL SECURITY;

-- Org owners can view backup runs
CREATE POLICY "Org owners can view backup runs"
  ON public.backup_runs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.org_users
    WHERE org_users.org_id = backup_runs.org_id
    AND org_users.user_id = auth.uid()
    AND org_users.role = 'owner'
  ));

-- Service role can manage backup runs
CREATE POLICY "Service role can manage backup runs"
  ON public.backup_runs
  FOR ALL
  USING (true);

-- Add indexes
CREATE INDEX idx_backup_runs_org_id ON public.backup_runs(org_id);
CREATE INDEX idx_backup_runs_started_at ON public.backup_runs(started_at DESC);