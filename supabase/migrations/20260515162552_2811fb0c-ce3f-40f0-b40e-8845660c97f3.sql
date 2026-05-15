-- Prevent users from escalating their own subscription privileges by changing
-- status / trial_ends_at / expires_at on their free subscription row.
CREATE OR REPLACE FUNCTION public.prevent_subscription_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role bypass (server-side flows manage paid plans, trials, expiry)
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan
     AND NEW.plan <> 'free' THEN
    RAISE EXCEPTION 'Plan upgrades must go through the server-side payments flow';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Subscription status can only be modified by the service role';
  END IF;

  IF NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at THEN
    RAISE EXCEPTION 'Trial end date can only be modified by the service role';
  END IF;

  IF NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
    RAISE EXCEPTION 'Subscription expiry can only be modified by the service role';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Subscription user_id is immutable';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_subscription_privilege_escalation_trg ON public.subscriptions;
CREATE TRIGGER prevent_subscription_privilege_escalation_trg
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_subscription_privilege_escalation();