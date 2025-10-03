-- Add delete policy for kb_docs
CREATE POLICY "Org staff can delete kb docs"
ON kb_docs
FOR DELETE
TO authenticated
USING (
  uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1
    FROM org_users
    WHERE org_users.org_id = kb_docs.org_id
      AND org_users.user_id = auth.uid()
      AND org_users.role IN ('owner', 'staff')
  )
);

-- Add cascade delete for related chunks and jobs
ALTER TABLE kb_chunks
DROP CONSTRAINT IF EXISTS kb_chunks_doc_id_fkey,
ADD CONSTRAINT kb_chunks_doc_id_fkey
  FOREIGN KEY (doc_id)
  REFERENCES kb_docs(id)
  ON DELETE CASCADE;

ALTER TABLE kb_ingest_jobs
DROP CONSTRAINT IF EXISTS kb_ingest_jobs_doc_id_fkey,
ADD CONSTRAINT kb_ingest_jobs_doc_id_fkey
  FOREIGN KEY (doc_id)
  REFERENCES kb_docs(id)
  ON DELETE CASCADE;