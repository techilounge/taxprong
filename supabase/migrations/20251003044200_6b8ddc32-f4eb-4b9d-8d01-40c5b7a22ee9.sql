-- Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists and recreate
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create enums for delete requests
CREATE TYPE public.delete_scope AS ENUM ('user', 'org', 'engagement');
CREATE TYPE public.delete_request_status AS ENUM ('pending', 'approved', 'denied', 'processed');

-- Create delete_requests table
CREATE TABLE public.delete_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope delete_scope NOT NULL,
  scope_ref TEXT NOT NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status delete_request_status NOT NULL DEFAULT 'pending',
  reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.delete_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own delete requests
CREATE POLICY "Users can view own delete requests"
  ON public.delete_requests
  FOR SELECT
  USING (requested_by = auth.uid());

-- Users can submit delete requests
CREATE POLICY "Users can submit delete requests"
  ON public.delete_requests
  FOR INSERT
  WITH CHECK (requested_by = auth.uid() AND status = 'pending');

-- Admins can view all delete requests
CREATE POLICY "Admins can view all delete requests"
  ON public.delete_requests
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update delete requests
CREATE POLICY "Admins can update delete requests"
  ON public.delete_requests
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add indexes
CREATE INDEX idx_delete_requests_status ON public.delete_requests(status);
CREATE INDEX idx_delete_requests_requested_by ON public.delete_requests(requested_by);
CREATE INDEX idx_delete_requests_scope ON public.delete_requests(scope, scope_ref);

-- Add deleted_at column to relevant tables for tombstoning
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.engagements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;