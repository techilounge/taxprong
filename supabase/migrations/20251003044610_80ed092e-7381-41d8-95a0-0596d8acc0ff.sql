-- Create filing_events table for tracking filing compliance
CREATE TABLE public.filing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  filing_type TEXT NOT NULL,
  period TEXT NOT NULL,
  due_date DATE NOT NULL,
  filed_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, filing_type, period)
);

-- Enable RLS
ALTER TABLE public.filing_events ENABLE ROW LEVEL SECURITY;

-- Org members can view filing events
CREATE POLICY "Org members can view filing events"
  ON public.filing_events
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.org_users
    WHERE org_users.org_id = filing_events.org_id
    AND org_users.user_id = auth.uid()
  ));

-- Org staff can manage filing events
CREATE POLICY "Org staff can manage filing events"
  ON public.filing_events
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.org_users
    WHERE org_users.org_id = filing_events.org_id
    AND org_users.user_id = auth.uid()
    AND org_users.role IN ('owner', 'staff', 'admin')
  ));

-- Add indexes
CREATE INDEX idx_filing_events_org_id ON public.filing_events(org_id);
CREATE INDEX idx_filing_events_due_date ON public.filing_events(due_date);
CREATE INDEX idx_filing_events_filing_type ON public.filing_events(filing_type);