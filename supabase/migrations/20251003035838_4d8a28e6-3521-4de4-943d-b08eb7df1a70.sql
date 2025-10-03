-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP calls from cron
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create a function to create monthly VAT tasks
CREATE OR REPLACE FUNCTION public.create_monthly_vat_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org RECORD;
  v_business RECORD;
  v_previous_month TEXT;
BEGIN
  -- Calculate previous month in format 'YYYY-MM'
  v_previous_month := TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM');
  
  -- Loop through all businesses that are VAT registered
  FOR v_business IN 
    SELECT id, org_id, name 
    FROM businesses 
    WHERE vat_registered = true
  LOOP
    -- Create VAT return task for previous month if it doesn't exist
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
      (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '14 days')::DATE, -- Due 15th of current month
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

-- Create a function to send reminder notifications
CREATE OR REPLACE FUNCTION public.send_task_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task RECORD;
  v_days_until_due INTEGER;
BEGIN
  -- Find tasks due in 7 days or 1 day
  FOR v_task IN 
    SELECT t.*, o.owner_id
    FROM tasks t
    JOIN orgs o ON t.org_id = o.id
    WHERE t.status = 'open'
    AND t.due_date IN (CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '1 day')
  LOOP
    v_days_until_due := v_task.due_date - CURRENT_DATE;
    
    -- Insert a notification record (will be picked up by edge function to send actual email/SMS)
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

-- Schedule the VAT task creation for 1st of every month at 08:00 Lagos time (07:00 UTC)
SELECT cron.schedule(
  'create-monthly-vat-tasks',
  '0 7 1 * *',
  $$SELECT public.create_monthly_vat_tasks()$$
);

-- Schedule reminder checks daily at 08:00 Lagos time (07:00 UTC)
SELECT cron.schedule(
  'send-task-reminders',
  '0 7 * * *',
  $$SELECT public.send_task_reminders()$$
);