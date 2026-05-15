
-- 1) Fix messages INSERT policy: require caller to actually be a party
DROP POLICY IF EXISTS "Engagement parties can send messages" ON public.messages;
CREATE POLICY "Engagement parties can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM engagements e
    JOIN pros p ON e.pro_id = p.id
    LEFT JOIN clients c ON e.client_id = c.id
    WHERE e.id = messages.engagement_id
      AND (
        p.user_id = auth.uid()
        OR c.person_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM org_users ou
          WHERE ou.org_id = c.org_id AND ou.user_id = auth.uid()
        )
      )
  )
);

-- 2) Fix kb_chunks "Service role can manage chunks" to actually be service_role only
DROP POLICY IF EXISTS "Service role can manage chunks" ON public.kb_chunks;
CREATE POLICY "Service role can manage chunks"
ON public.kb_chunks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3) Remove user-writable audit_logs INSERT; only service_role writes
DROP POLICY IF EXISTS "Authenticated users can insert own audit logs" ON public.audit_logs;

-- 4) Restrict data-exports storage bucket INSERT to service_role only
DROP POLICY IF EXISTS "Service role can upload exports" ON storage.objects;
CREATE POLICY "Service role can upload exports"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'data-exports');
