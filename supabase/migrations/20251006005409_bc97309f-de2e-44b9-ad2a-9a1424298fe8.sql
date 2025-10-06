-- Fix RLS on profile_security_documentation table

-- Enable RLS on the documentation table
ALTER TABLE profile_security_documentation ENABLE ROW LEVEL SECURITY;

-- Only admins can view security documentation
CREATE POLICY "Only admins can view profile security docs"
  ON profile_security_documentation
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Prevent any modifications
CREATE POLICY "Prevent manual modifications to security docs"
  ON profile_security_documentation
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE profile_security_documentation IS 
'Documentation of profile security controls. Admin-only access. Updated via migrations only.';