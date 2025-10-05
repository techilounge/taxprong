-- Add progress column to kb_ingest_jobs table
ALTER TABLE kb_ingest_jobs 
ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

COMMENT ON COLUMN kb_ingest_jobs.progress IS 'Progress percentage (0-100) for processing jobs';