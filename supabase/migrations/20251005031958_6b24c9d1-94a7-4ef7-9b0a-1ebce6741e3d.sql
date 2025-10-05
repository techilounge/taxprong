-- Phase 1: Critical Security Fixes

-- 1. Remove admin profile harvesting capability
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 2. Fix pros table RLS policies - change from public to authenticated and split policies
DROP POLICY IF EXISTS "Pros can manage own profile" ON public.pros;

-- Create separate, properly scoped policies for pros table
CREATE POLICY "Authenticated users can view pros"
ON public.pros
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Pros can update own profile"
ON public.pros
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Pros can insert own profile"
ON public.pros
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Pros can delete own profile"
ON public.pros
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 3. Add search_path to SECURITY DEFINER functions to prevent search path hijacking

CREATE OR REPLACE FUNCTION public.create_monthly_vat_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_org RECORD;
  v_business RECORD;
  v_previous_month TEXT;
BEGIN
  v_previous_month := TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM');
  
  FOR v_business IN 
    SELECT id, org_id, name 
    FROM businesses 
    WHERE vat_registered = true
  LOOP
    INSERT INTO tasks (
      org_id,
      title,
      due_date,
      link_to,
      status,
      auto_created
    )
    SELECT 
      v_business.org_id,
      'VAT Return for ' || v_previous_month || ' - ' || v_business.name,
      (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '14 days')::DATE,
      'vat-console',
      'open',
      true
    WHERE NOT EXISTS (
      SELECT 1 FROM tasks 
      WHERE org_id = v_business.org_id 
      AND title = 'VAT Return for ' || v_previous_month || ' - ' || v_business.name
    );
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.send_task_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_task RECORD;
  v_days_until_due INTEGER;
BEGIN
  FOR v_task IN 
    SELECT t.*, o.owner_id
    FROM tasks t
    JOIN orgs o ON t.org_id = o.id
    WHERE t.status = 'open'
    AND t.due_date IN (CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '1 day')
  LOOP
    v_days_until_due := v_task.due_date - CURRENT_DATE;
    
    INSERT INTO audit_logs (
      entity,
      entity_id,
      action,
      user_id,
      payload_hash
    )
    VALUES (
      'task_reminder',
      v_task.id,
      'create',
      v_task.owner_id,
      'D-' || v_days_until_due::TEXT
    );
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_pro_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE pros
  SET 
    avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM pro_reviews WHERE pro_id = NEW.pro_id),
    review_count = (SELECT COUNT(*) FROM pro_reviews WHERE pro_id = NEW.pro_id)
  WHERE id = NEW.pro_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_stamp_duty_deadline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.deadline := NEW.exec_date + INTERVAL '30 days';
  RETURN NEW;
END;
$function$;