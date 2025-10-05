-- Reset stuck ingestion jobs
UPDATE kb_ingest_jobs 
SET status = 'failed', 
    error_message = 'Job timeout - system reset. Please re-upload the document.', 
    finished_at = NOW()
WHERE status = 'processing' 
  AND created_at < NOW() - INTERVAL '1 hour';