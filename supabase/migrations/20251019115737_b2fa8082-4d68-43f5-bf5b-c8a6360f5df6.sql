-- Assign director role to the main admin account
INSERT INTO user_roles (user_id, role)
SELECT id, 'director'::app_role
FROM auth.users
WHERE email = 'rodrigoteste@escola.pt'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign admin role to all other users so they can access the system
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- Update students table RLS policies to allow all authenticated users
DROP POLICY IF EXISTS "Admins can read students" ON students;
DROP POLICY IF EXISTS "Admins can insert students" ON students;
DROP POLICY IF EXISTS "Admins can update students" ON students;
DROP POLICY IF EXISTS "Admins can delete students" ON students;

CREATE POLICY "Authenticated users can read students" 
ON students FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert students" 
ON students FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update students" 
ON students FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Directors can delete students" 
ON students FOR DELETE 
TO authenticated
USING (is_director(auth.uid()));

-- Update staff table RLS policies to allow all authenticated users
DROP POLICY IF EXISTS "Admins can read staff" ON staff;
DROP POLICY IF EXISTS "Admins can insert staff" ON staff;
DROP POLICY IF EXISTS "Admins can update staff" ON staff;
DROP POLICY IF EXISTS "Admins can delete staff" ON staff;

CREATE POLICY "Authenticated users can read staff" 
ON staff FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert staff" 
ON staff FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update staff" 
ON staff FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Directors can delete staff" 
ON staff FOR DELETE 
TO authenticated
USING (is_director(auth.uid()));

-- Update departments table RLS policies
DROP POLICY IF EXISTS "Admins can read departments" ON departments;
DROP POLICY IF EXISTS "Admins can insert departments" ON departments;
DROP POLICY IF EXISTS "Admins can update departments" ON departments;

CREATE POLICY "Authenticated users can read departments" 
ON departments FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins can insert departments" 
ON departments FOR INSERT 
TO authenticated
WITH CHECK (is_any_admin(auth.uid()));

CREATE POLICY "Admins can update departments" 
ON departments FOR UPDATE 
TO authenticated
USING (is_any_admin(auth.uid()));