-- Make kb-documents bucket public so edge functions can access files
UPDATE storage.buckets
SET public = true
WHERE id = 'kb-documents';