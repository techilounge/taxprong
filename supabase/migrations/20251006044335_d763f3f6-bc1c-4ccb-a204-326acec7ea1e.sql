-- Simply recreate the view with SECURITY INVOKER
-- This makes it respect underlying table RLS policies
DROP VIEW IF EXISTS user_role_assignments CASCADE;

CREATE VIEW user_role_assignments 
WITH (security_invoker=true, security_barrier=true)
AS
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