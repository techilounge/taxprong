-- Fix infinite recursion in org_users RLS policies
-- Drop the problematic policies
DROP POLICY IF EXISTS "Org members can view membership" ON public.org_users;
DROP POLICY IF EXISTS "Owners can manage membership" ON public.org_users;

-- Create new policies that don't cause recursion
-- Users can see their own memberships
CREATE POLICY "Users can view own membership"
  ON public.org_users FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert themselves when creating orgs
CREATE POLICY "Users can insert own membership"
  ON public.org_users FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Owners can manage memberships by checking orgs table directly
CREATE POLICY "Org owners can manage membership"
  ON public.org_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.orgs
      WHERE orgs.id = org_users.org_id 
        AND orgs.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orgs
      WHERE orgs.id = org_users.org_id 
        AND orgs.owner_id = auth.uid()
    )
  );