-- Drop the existing view
DROP VIEW IF EXISTS user_role_assignments;

-- Recreate the view to show ALL users from profiles
-- Default to 'user' role if no explicit role is assigned
CREATE OR REPLACE VIEW user_role_assignments AS
SELECT 
  COALESCE(ur.id, gen_random_uuid()) as id,
  p.id as user_id,
  COALESCE(ur.role::text, 'user') as role,
  p.email,
  p.name,
  p.created_at as user_created_at
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
ORDER BY p.created_at DESC;