-- Create storage bucket for knowledge base documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kb-documents',
  'kb-documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload KB documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kb-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read documents from their organization
CREATE POLICY "Users can read KB documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'kb-documents');

-- Allow authenticated users to delete their own documents
CREATE POLICY "Users can delete their own KB documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'kb-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);