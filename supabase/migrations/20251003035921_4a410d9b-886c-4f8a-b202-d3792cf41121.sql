-- Fix search_path for security on functions created in previous migration

-- Update create_monthly_vat_tasks function with search_path
CREATE OR REPLACE FUNCTION public.create_monthly_vat_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Update send_task_reminders function with search_path
CREATE OR REPLACE FUNCTION public.send_task_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;