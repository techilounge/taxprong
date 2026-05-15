
-- Fix 1: Restrict kb-documents storage SELECT to org members of the matching kb_docs row
DROP POLICY IF EXISTS "Users can read KB documents" ON storage.objects;

CREATE POLICY "Users can read KB documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kb-documents'
  AND EXISTS (
    SELECT 1 FROM public.kb_docs d
    WHERE d.file_url LIKE '%' || storage.objects.name
      AND (
        d.org_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.org_users ou
          WHERE ou.org_id = d.org_id AND ou.user_id = auth.uid()
        )
      )
  )
);

-- Fix 2: Hide reviewer_user_id from authenticated users at column level
REVOKE SELECT (reviewer_user_id) ON public.pro_reviews FROM authenticated, anon;
