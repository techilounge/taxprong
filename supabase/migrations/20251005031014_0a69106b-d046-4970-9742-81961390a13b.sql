-- Phase 1 Critical Security Fixes

-- 1.1: Create function for admins to assign user roles (prevent privilege escalation)
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id UUID,
  role_name app_role
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only admins can call this function
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can assign roles';
  END IF;
  
  -- Insert the role (or do nothing if it already exists)
  INSERT INTO user_roles (user_id, role) 
  VALUES (target_user_id, role_name)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action
  INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash)
  VALUES ('user_role', target_user_id::text, 'create', auth.uid(), role_name::text);
END;
$$;

-- 1.2: Create function to revoke user roles
CREATE OR REPLACE FUNCTION public.revoke_user_role(
  target_user_id UUID,
  role_name app_role
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only admins can call this function
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can revoke roles';
  END IF;
  
  -- Delete the role
  DELETE FROM user_roles 
  WHERE user_id = target_user_id AND role = role_name;
  
  -- Log the action
  INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash)
  VALUES ('user_role', target_user_id::text, 'delete', auth.uid(), role_name::text);
END;
$$;

-- 1.3: Lock down audit_logs - remove user INSERT permission
DROP POLICY IF EXISTS "Users can create audit logs" ON audit_logs;

-- Create service-role-only INSERT policy for audit_logs
CREATE POLICY "Service role can insert audit logs"
ON audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create authenticated role INSERT policy for audit logging via app code
CREATE POLICY "Authenticated users can insert own audit logs"
ON audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add comment explaining audit log security
COMMENT ON TABLE audit_logs IS 
'Audit trail for all system actions. Users can only insert logs for their own actions. 
Service role can insert logs for system actions. Org owners can view all logs for their org.';

-- Grant execute permissions on role management functions to authenticated users
GRANT EXECUTE ON FUNCTION assign_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_user_role TO authenticated;