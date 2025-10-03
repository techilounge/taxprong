-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create knowledge base documents table
CREATE TABLE IF NOT EXISTS kb_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_url TEXT,
  file_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create knowledge base chunks table with vector embeddings
CREATE TABLE IF NOT EXISTS kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES kb_docs(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(doc_id, chunk_index)
);

-- Create knowledge base ingest jobs table
CREATE TABLE IF NOT EXISTS kb_ingest_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT NOT NULL,
  doc_id UUID REFERENCES kb_docs(id) ON DELETE CASCADE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE kb_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_ingest_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kb_docs
-- Global docs (org_id is null) are viewable by everyone
CREATE POLICY "Anyone can view global kb docs"
  ON kb_docs FOR SELECT
  USING (org_id IS NULL);

-- Org members can view their org's docs
CREATE POLICY "Org members can view org kb docs"
  ON kb_docs FOR SELECT
  USING (
    org_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM org_users
      WHERE org_users.org_id = kb_docs.org_id
      AND org_users.user_id = auth.uid()
    )
  );

-- Org owners/staff can insert docs
CREATE POLICY "Org staff can insert kb docs"
  ON kb_docs FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM org_users
      WHERE org_users.org_id = kb_docs.org_id
      AND org_users.user_id = auth.uid()
      AND org_users.role = ANY (ARRAY['owner'::app_role, 'staff'::app_role])
    )
  );

-- RLS Policies for kb_chunks
-- Anyone can view chunks from viewable docs
CREATE POLICY "Users can view chunks from accessible docs"
  ON kb_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM kb_docs
      WHERE kb_docs.id = kb_chunks.doc_id
      AND (
        kb_docs.org_id IS NULL OR
        EXISTS (
          SELECT 1 FROM org_users
          WHERE org_users.org_id = kb_docs.org_id
          AND org_users.user_id = auth.uid()
        )
      )
    )
  );

-- Service role can insert chunks (for edge function)
CREATE POLICY "Service role can manage chunks"
  ON kb_chunks FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for kb_ingest_jobs
-- Users can view their own jobs
CREATE POLICY "Users can view own ingest jobs"
  ON kb_ingest_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM kb_docs
      WHERE kb_docs.id = kb_ingest_jobs.doc_id
      AND kb_docs.uploaded_by = auth.uid()
    )
  );

-- Service role can manage jobs
CREATE POLICY "Service role can manage ingest jobs"
  ON kb_ingest_jobs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS kb_chunks_embedding_idx ON kb_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for faster doc lookups
CREATE INDEX IF NOT EXISTS kb_chunks_doc_id_idx ON kb_chunks(doc_id);
CREATE INDEX IF NOT EXISTS kb_docs_org_id_idx ON kb_docs(org_id);