-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE app_role AS ENUM ('owner', 'staff', 'viewer');
CREATE TYPE org_type AS ENUM ('business', 'practice');
CREATE TYPE invoice_type AS ENUM ('sale', 'purchase');
CREATE TYPE supply_type AS ENUM ('standard', 'zero', 'exempt');
CREATE TYPE task_status AS ENUM ('open', 'done', 'snoozed');
CREATE TYPE engagement_fee_type AS ENUM ('fixed', 'hourly', 'milestone');
CREATE TYPE escrow_status AS ENUM ('unfunded', 'funded', 'released', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'released', 'refunded');
CREATE TYPE direction AS ENUM ('debit', 'credit');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'export', 'submit');

-- Organizations table
CREATE TABLE public.orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type org_type NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  twofa_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Org membership table
CREATE TABLE public.org_users (
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

ALTER TABLE public.org_users ENABLE ROW LEVEL SECURITY;

-- Businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  tin TEXT,
  sector TEXT,
  turnover_band TEXT,
  small_company BOOLEAN DEFAULT false,
  mne_member BOOLEAN DEFAULT false,
  epz BOOLEAN DEFAULT false,
  vat_registered BOOLEAN DEFAULT false,
  year_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Tax profiles
CREATE TABLE public.tax_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  vat_scheme TEXT,
  notes TEXT,
  etr_scope_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_profiles ENABLE ROW LEVEL SECURITY;

-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type invoice_type NOT NULL,
  counterparty_name TEXT,
  counterparty_tin TEXT,
  supply_type supply_type NOT NULL,
  net DECIMAL(15,2) NOT NULL,
  vat_rate DECIMAL(5,2),
  vat DECIMAL(15,2),
  issue_date DATE NOT NULL,
  due_date DATE,
  efs_status TEXT,
  einvoice_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- VAT returns
CREATE TABLE public.vat_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  output_vat DECIMAL(15,2) DEFAULT 0,
  input_vat DECIMAL(15,2) DEFAULT 0,
  payable DECIMAL(15,2) DEFAULT 0,
  due_date DATE,
  efs_batch_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, period)
);

ALTER TABLE public.vat_returns ENABLE ROW LEVEL SECURITY;

-- PIT profiles
CREATE TABLE public.pit_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  annual_income DECIMAL(15,2),
  rent_paid DECIMAL(15,2),
  rent_relief DECIMAL(15,2),
  bands_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pit_profiles ENABLE ROW LEVEL SECURITY;

-- CIT calculations
CREATE TABLE public.cit_calcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  assessable_profits DECIMAL(15,2),
  cit_rate DECIMAL(5,2),
  cit_payable DECIMAL(15,2),
  development_levy_rate DECIMAL(5,2),
  development_levy DECIMAL(15,2),
  etr_percent DECIMAL(5,2),
  etr_topup DECIMAL(15,2),
  is_mne BOOLEAN DEFAULT false,
  turnover_band TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cit_calcs ENABLE ROW LEVEL SECURITY;

-- CGT events
CREATE TABLE public.cgt_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  proceeds DECIMAL(15,2),
  cost DECIMAL(15,2),
  gain DECIMAL(15,2),
  reinvest_amount DECIMAL(15,2),
  exempt_reason TEXT,
  legal_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cgt_events ENABLE ROW LEVEL SECURITY;

-- Stamp instruments
CREATE TABLE public.stamp_instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  exec_date DATE NOT NULL,
  duty_due DECIMAL(15,2),
  liable_party TEXT,
  stamped BOOLEAN DEFAULT false,
  deadline DATE,
  attachment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stamp_instruments ENABLE ROW LEVEL SECURITY;

-- Documents
CREATE TABLE public.docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  doc_type TEXT,
  tags TEXT[],
  linked_entity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.docs ENABLE ROW LEVEL SECURITY;

-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date DATE,
  status task_status DEFAULT 'open',
  auto_created BOOLEAN DEFAULT false,
  link_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Tax professionals
CREATE TABLE public.pros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  practice_name TEXT,
  bio TEXT,
  badges TEXT[],
  hourly_rate DECIMAL(10,2),
  services TEXT[],
  kyc_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pros ENABLE ROW LEVEL SECURITY;

-- Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_pro UUID NOT NULL REFERENCES public.pros(id),
  org_id UUID REFERENCES public.orgs(id) ON DELETE SET NULL,
  person_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Engagements
CREATE TABLE public.engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID NOT NULL REFERENCES public.pros(id),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  scope TEXT,
  fee_type engagement_fee_type,
  quote DECIMAL(15,2),
  escrow_status escrow_status DEFAULT 'unfunded',
  loe_url TEXT,
  authority_url TEXT,
  authority_to_file BOOLEAN DEFAULT false,
  due_dates_json JSONB,
  parties JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;

-- Pro invoices
CREATE TABLE public.pro_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.engagements(id),
  amount DECIMAL(15,2) NOT NULL,
  status payment_status DEFAULT 'pending',
  payment_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pro_invoices ENABLE ROW LEVEL SECURITY;

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.engagements(id),
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  body TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  merchant TEXT,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  vat_amount DECIMAL(15,2),
  vat_recoverable_pct DECIMAL(5,2),
  category TEXT,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  receipt_url TEXT,
  flags_json JSONB,
  ocr_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Bank transactions
CREATE TABLE public.bank_txns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  narration TEXT,
  amount DECIMAL(15,2) NOT NULL,
  direction direction NOT NULL,
  matched_expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  import_batch_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_txns ENABLE ROW LEVEL SECURITY;

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action audit_action NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  time TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload_hash TEXT
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Orgs: Members can view their orgs
CREATE POLICY "Org members can view org"
  ON public.orgs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE org_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create orgs"
  ON public.orgs FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update org"
  ON public.orgs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE org_id = id AND user_id = auth.uid() AND role = 'owner'
    )
  );

-- Org users: View org members
CREATE POLICY "Org members can view membership"
  ON public.org_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_users ou
      WHERE ou.org_id = org_id AND ou.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage membership"
  ON public.org_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE org_users.org_id = org_id AND user_id = auth.uid() AND role = 'owner'
    )
  );

-- Businesses: Org members can access
CREATE POLICY "Org members can view businesses"
  ON public.businesses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE org_id = businesses.org_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Org staff can manage businesses"
  ON public.businesses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE org_id = businesses.org_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'staff')
    )
  );

-- Tax profiles
CREATE POLICY "Org members can view tax profiles"
  ON public.tax_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.org_users ou ON b.org_id = ou.org_id
      WHERE b.id = business_id AND ou.user_id = auth.uid()
    )
  );

CREATE POLICY "Org staff can manage tax profiles"
  ON public.tax_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.org_users ou ON b.org_id = ou.org_id
      WHERE b.id = business_id 
        AND ou.user_id = auth.uid() 
        AND ou.role IN ('owner', 'staff')
    )
  );

-- Invoices
CREATE POLICY "Org members can view invoices"
  ON public.invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.org_users ou ON b.org_id = ou.org_id
      WHERE b.id = business_id AND ou.user_id = auth.uid()
    )
  );

CREATE POLICY "Org staff can manage invoices"
  ON public.invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.org_users ou ON b.org_id = ou.org_id
      WHERE b.id = business_id 
        AND ou.user_id = auth.uid() 
        AND ou.role IN ('owner', 'staff')
    )
  );

-- VAT returns
CREATE POLICY "Org members can view vat returns"
  ON public.vat_returns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.org_users ou ON b.org_id = ou.org_id
      WHERE b.id = business_id AND ou.user_id = auth.uid()
    )
  );

CREATE POLICY "Org staff can manage vat returns"
  ON public.vat_returns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.org_users ou ON b.org_id = ou.org_id
      WHERE b.id = business_id 
        AND ou.user_id = auth.uid() 
        AND ou.role IN ('owner', 'staff')
    )
  );

-- Expenses
CREATE POLICY "Org members can view expenses"
  ON public.expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE org_id = expenses.org_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Org staff can manage expenses"
  ON public.expenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE org_id = expenses.org_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'staff')
    )
  );

-- Tasks
CREATE POLICY "Org members can view tasks"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE org_id = tasks.org_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Org staff can manage tasks"
  ON public.tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE org_id = tasks.org_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'staff')
    )
  );

-- Docs
CREATE POLICY "Org members can view docs"
  ON public.docs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE org_id = docs.org_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Org staff can manage docs"
  ON public.docs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE org_id = docs.org_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'staff')
    )
  );

-- Pros can view their own profile
CREATE POLICY "Pros can manage own profile"
  ON public.pros FOR ALL
  USING (user_id = auth.uid());

-- Clients
CREATE POLICY "Pros can manage their clients"
  ON public.clients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pros
      WHERE id = created_by_pro AND user_id = auth.uid()
    )
  );

-- Engagements
CREATE POLICY "Pros can manage their engagements"
  ON public.engagements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pros
      WHERE id = pro_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view their engagements"
  ON public.engagements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id 
        AND (c.person_user_id = auth.uid() 
          OR EXISTS (
            SELECT 1 FROM public.org_users ou
            WHERE ou.org_id = c.org_id AND ou.user_id = auth.uid()
          ))
    )
  );

-- Messages
CREATE POLICY "Engagement parties can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      JOIN public.pros p ON e.pro_id = p.id
      WHERE e.id = engagement_id 
        AND (p.user_id = auth.uid() OR sender_id = auth.uid())
    )
  );

CREATE POLICY "Engagement parties can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.engagements e
      JOIN public.pros p ON e.pro_id = p.id
      WHERE e.id = engagement_id 
        AND (p.user_id = auth.uid() OR sender_id = auth.uid())
    ) AND sender_id = auth.uid()
  );

-- Pro invoices
CREATE POLICY "Pros can manage their invoices"
  ON public.pro_invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      JOIN public.pros p ON e.pro_id = p.id
      WHERE e.id = engagement_id AND p.user_id = auth.uid()
    )
  );

-- Bank transactions
CREATE POLICY "Org members can view bank txns"
  ON public.bank_txns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE org_id = bank_txns.org_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Org staff can manage bank txns"
  ON public.bank_txns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE org_id = bank_txns.org_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'staff')
    )
  );

-- CIT, CGT, PIT, Stamp policies (similar pattern)
CREATE POLICY "Org members can view cit calcs"
  ON public.cit_calcs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.org_users ou ON b.org_id = ou.org_id
      WHERE b.id = business_id AND ou.user_id = auth.uid()
    )
  );

CREATE POLICY "Org staff can manage cit calcs"
  ON public.cit_calcs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.org_users ou ON b.org_id = ou.org_id
      WHERE b.id = business_id 
        AND ou.user_id = auth.uid() 
        AND ou.role IN ('owner', 'staff')
    )
  );

CREATE POLICY "Org members can view cgt events"
  ON public.cgt_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.org_users ou ON b.org_id = ou.org_id
      WHERE b.id = business_id AND ou.user_id = auth.uid()
    )
  );

CREATE POLICY "Org staff can manage cgt events"
  ON public.cgt_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.org_users ou ON b.org_id = ou.org_id
      WHERE b.id = business_id 
        AND ou.user_id = auth.uid() 
        AND ou.role IN ('owner', 'staff')
    )
  );

CREATE POLICY "Users can view own pit profile"
  ON public.pit_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own pit profile"
  ON public.pit_profiles FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Org members can view stamp instruments"
  ON public.stamp_instruments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.org_users ou ON b.org_id = ou.org_id
      WHERE b.id = business_id AND ou.user_id = auth.uid()
    )
  );

CREATE POLICY "Org staff can manage stamp instruments"
  ON public.stamp_instruments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.org_users ou ON b.org_id = ou.org_id
      WHERE b.id = business_id 
        AND ou.user_id = auth.uid() 
        AND ou.role IN ('owner', 'staff')
    )
  );

-- Audit logs: all authenticated users can insert
CREATE POLICY "Users can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Org owners can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_users
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Function to auto-update stamp duty deadline
CREATE OR REPLACE FUNCTION public.set_stamp_duty_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.deadline := NEW.exec_date + INTERVAL '30 days';
  RETURN NEW;
END;
$$;

CREATE TRIGGER stamp_duty_deadline_trigger
  BEFORE INSERT OR UPDATE OF exec_date ON public.stamp_instruments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_stamp_duty_deadline();