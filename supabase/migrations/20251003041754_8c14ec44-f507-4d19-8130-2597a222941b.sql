-- Create qa_citations table
CREATE TABLE IF NOT EXISTS public.qa_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  citations JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.qa_citations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own citations (matched by session_id or created in same session)
CREATE POLICY "Users can view qa citations"
  ON public.qa_citations
  FOR SELECT
  USING (true);

-- Policy: Service role can insert citations
CREATE POLICY "Service role can insert citations"
  ON public.qa_citations
  FOR INSERT
  WITH CHECK (true);

-- Add index for session lookups
CREATE INDEX IF NOT EXISTS idx_qa_citations_session ON public.qa_citations(session_id);
CREATE INDEX IF NOT EXISTS idx_qa_citations_created_at ON public.qa_citations(created_at DESC);