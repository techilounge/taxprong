-- Create professional_services_requests table
CREATE TABLE public.professional_services_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('setup_assistance', 'migration_help', 'custom_reporting', 'tax_advisory')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  company_name TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  description TEXT NOT NULL,
  preferred_date DATE,
  budget_range TEXT,
  admin_notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create onboarding_progress table to track user onboarding
CREATE TABLE public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_step INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  skipped BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bank_import_history table
CREATE TABLE public.bank_import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  imported_by UUID NOT NULL REFERENCES auth.users(id),
  bank_name TEXT,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  successful_rows INTEGER NOT NULL DEFAULT 0,
  failed_rows INTEGER NOT NULL DEFAULT 0,
  error_details JSONB,
  import_batch_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.professional_services_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_import_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for professional_services_requests
CREATE POLICY "Users can create their own service requests"
  ON public.professional_services_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own service requests"
  ON public.professional_services_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all service requests"
  ON public.professional_services_requests
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update service requests"
  ON public.professional_services_requests
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for onboarding_progress
CREATE POLICY "Users can view their own onboarding progress"
  ON public.onboarding_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own onboarding progress"
  ON public.onboarding_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for bank_import_history
CREATE POLICY "Org members can view import history"
  ON public.bank_import_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE org_users.org_id = bank_import_history.org_id
      AND org_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Org staff can create import history"
  ON public.bank_import_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    imported_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE org_users.org_id = bank_import_history.org_id
      AND org_users.user_id = auth.uid()
      AND org_users.role IN ('owner'::app_role, 'staff'::app_role)
    )
  );

-- Create indexes for performance
CREATE INDEX idx_service_requests_user_id ON public.professional_services_requests(user_id);
CREATE INDEX idx_service_requests_status ON public.professional_services_requests(status);
CREATE INDEX idx_onboarding_user_id ON public.onboarding_progress(user_id);
CREATE INDEX idx_bank_import_org_id ON public.bank_import_history(org_id);
CREATE INDEX idx_bank_import_batch_id ON public.bank_import_history(import_batch_id);