-- 1. org_users: prevent privilege escalation on insert
DROP POLICY IF EXISTS "Users can insert own membership" ON public.org_users;
CREATE POLICY "Users can insert own owner membership"
ON public.org_users
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'owner'::app_role
  AND EXISTS (
    SELECT 1 FROM public.orgs o
    WHERE o.id = org_users.org_id
      AND o.owner_id = auth.uid()
  )
);

-- 2. subscriptions: restrict plan/status on insert and update to free
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert own free subscription"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND plan = 'free'
  AND status IN ('active','trialing')
);

DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
CREATE POLICY "Users can update own free subscription"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND plan = 'free'
);

-- Allow service role full management for server-side upgrades
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can manage subscriptions"
ON public.subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. backup_runs: restrict manage policy to service_role only
DROP POLICY IF EXISTS "Service role can manage backup runs" ON public.backup_runs;
CREATE POLICY "Service role can manage backup runs"
ON public.backup_runs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. audit_logs: remove broad org-owner read access (admins still covered)
DROP POLICY IF EXISTS "Org owners can view audit logs" ON public.audit_logs;

-- 5. tax-documents storage: require org membership for insert/delete
DROP POLICY IF EXISTS "Org staff can upload tax documents" ON storage.objects;
CREATE POLICY "Org members can upload tax documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tax-documents'
  AND EXISTS (
    SELECT 1
    FROM public.generated_documents gd
    JOIN public.org_users ou ON gd.org_id = ou.org_id
    WHERE gd.file_url = storage.objects.name
      AND ou.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Org staff can delete tax documents" ON storage.objects;
CREATE POLICY "Org members can delete tax documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tax-documents'
  AND EXISTS (
    SELECT 1
    FROM public.generated_documents gd
    JOIN public.org_users ou ON gd.org_id = ou.org_id
    WHERE gd.file_url = storage.objects.name
      AND ou.user_id = auth.uid()
  )
);

-- 6. messages: allow engagement client to read messages
DROP POLICY IF EXISTS "Engagement parties can view messages" ON public.messages;
CREATE POLICY "Engagement parties can view messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.engagements e
    JOIN public.pros p ON e.pro_id = p.id
    LEFT JOIN public.clients c ON e.client_id = c.id
    WHERE e.id = messages.engagement_id
      AND (
        p.user_id = auth.uid()
        OR messages.sender_id = auth.uid()
        OR c.person_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.org_users ou
          WHERE ou.org_id = c.org_id AND ou.user_id = auth.uid()
        )
      )
  )
);