-- Get user ID and assign admin role to techilounge@gmail.com
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'techilounge@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Log the admin role assignment
INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash, severity)
SELECT 
  'user_role_assignment',
  id,
  'create'::audit_action,
  id,
  'admin_role_assigned',
  'high'
FROM auth.users
WHERE email = 'techilounge@gmail.com';

-- Create function to assign roles by email (admin only)
CREATE OR REPLACE FUNCTION assign_role_by_email(
  _email text,
  _role app_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id uuid;
  result jsonb;
BEGIN
  -- Only admins can assign roles
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can assign roles';
  END IF;
  
  -- Rate limit role assignments
  PERFORM log_and_check_rate_limit('role_assignment', 20, 3600);
  
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = _email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', _email;
  END IF;
  
  -- Insert role (will do nothing if already exists due to unique constraint)
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the assignment
  INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash, severity)
  VALUES (
    'user_role_assignment',
    target_user_id,
    'create'::audit_action,
    auth.uid(),
    _role::text || '_assigned_to_' || _email,
    'high'
  );
  
  result := jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'role', _role,
    'email', _email
  );
  
  RETURN result;
END;
$$;

-- Create function to remove roles (admin only)
CREATE OR REPLACE FUNCTION remove_role_by_email(
  _email text,
  _role app_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id uuid;
  result jsonb;
BEGIN
  -- Only admins can remove roles
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can remove roles';
  END IF;
  
  -- Rate limit role removals
  PERFORM log_and_check_rate_limit('role_removal', 20, 3600);
  
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = _email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', _email;
  END IF;
  
  -- Prevent removing last admin
  IF _role = 'admin'::app_role THEN
    IF (SELECT COUNT(*) FROM user_roles WHERE role = 'admin'::app_role) <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last admin role';
    END IF;
  END IF;
  
  -- Remove role
  DELETE FROM user_roles
  WHERE user_id = target_user_id AND role = _role;
  
  -- Log the removal
  INSERT INTO audit_logs (entity, entity_id, action, user_id, payload_hash, severity)
  VALUES (
    'user_role_removal',
    target_user_id,
    'delete'::audit_action,
    auth.uid(),
    _role::text || '_removed_from_' || _email,
    'high'
  );
  
  result := jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'role', _role,
    'email', _email
  );
  
  RETURN result;
END;
$$;

-- Create view for admin to see role assignments with user details
CREATE OR REPLACE VIEW user_role_assignments AS
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  p.email,
  p.name,
  p.created_at as user_created_at
FROM user_roles ur
LEFT JOIN profiles p ON ur.user_id = p.id
ORDER BY ur.role, p.email;

-- Grant access to the view for admins only
GRANT SELECT ON user_role_assignments TO authenticated;