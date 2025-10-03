-- Fix orgs table RLS policies to allow owners immediate access

-- Update SELECT policy to allow both members and direct owners
DROP POLICY IF EXISTS "Org members can view org" ON public.orgs;

CREATE POLICY "Org members can view org"
ON public.orgs
FOR SELECT
USING (public.is_org_member(auth.uid(), id) OR owner_id = auth.uid());

-- Update UPDATE policy to use security definer function
DROP POLICY IF EXISTS "Owners can update org" ON public.orgs;

CREATE POLICY "Owners can update org"
ON public.orgs
FOR UPDATE
USING (public.is_org_owner(auth.uid(), id));