-- Step 1: Create security definer functions to break circular dependencies
CREATE OR REPLACE FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orgs
    WHERE id = _org_id
      AND owner_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_users
    WHERE org_id = _org_id
      AND user_id = _user_id
  )
$$;

-- Step 2: Fix orgs table RLS policies - remove circular dependency
DROP POLICY IF EXISTS "Org members can view org" ON public.orgs;

CREATE POLICY "Org members can view org"
ON public.orgs
FOR SELECT
USING (public.is_org_member(auth.uid(), id));

-- Step 3: Fix org_users table RLS policies
DROP POLICY IF EXISTS "Org owners can manage membership" ON public.org_users;

CREATE POLICY "Org owners can manage membership"
ON public.org_users
FOR ALL
USING (public.is_org_owner(auth.uid(), org_id))
WITH CHECK (public.is_org_owner(auth.uid(), org_id));

-- Step 4: Add missing INSERT policy to subscriptions table
CREATE POLICY "Users can insert own subscription"
ON public.subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);