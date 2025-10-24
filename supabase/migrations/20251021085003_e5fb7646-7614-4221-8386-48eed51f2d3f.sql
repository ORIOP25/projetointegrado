-- Drop ALL policies that depend on the old functions first
DROP POLICY IF EXISTS "Admins can insert departments" ON public.departments;
DROP POLICY IF EXISTS "Admins can update departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can read staff" ON public.staff;
DROP POLICY IF EXISTS "Directors can delete transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Directors can insert transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Directors can read transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Directors can update transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Directors can delete staff" ON public.staff;
DROP POLICY IF EXISTS "Directors can delete students" ON public.students;
DROP POLICY IF EXISTS "Directors can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Directors can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Directors can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Directors can view all roles" ON public.user_roles;

-- Now drop the functions
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.is_director(uuid);
DROP FUNCTION IF EXISTS public.is_any_admin(uuid);

-- Drop the old enum type (this will cascade and remove the role column)
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Create new simplified enum with only 2 roles
CREATE TYPE public.app_role AS ENUM ('global_admin', 'staff');

-- Add the role column back to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN role app_role NOT NULL DEFAULT 'staff';

-- Recreate security definer functions with new roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_global_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'global_admin'
  )
$$;

-- Recreate all policies with new function
CREATE POLICY "Global admins can insert departments" 
ON public.departments 
FOR INSERT 
WITH CHECK (is_global_admin(auth.uid()));

CREATE POLICY "Global admins can update departments" 
ON public.departments 
FOR UPDATE 
USING (is_global_admin(auth.uid()));

CREATE POLICY "Authenticated users can read staff" 
ON public.staff 
FOR SELECT 
USING (is_global_admin(auth.uid()) OR (user_id = auth.uid()));

CREATE POLICY "Global admins can delete staff" 
ON public.staff 
FOR DELETE 
USING (is_global_admin(auth.uid()));

CREATE POLICY "Global admins can delete transactions" 
ON public.financial_transactions 
FOR DELETE 
USING (is_global_admin(auth.uid()));

CREATE POLICY "Global admins can insert transactions" 
ON public.financial_transactions 
FOR INSERT 
WITH CHECK (is_global_admin(auth.uid()));

CREATE POLICY "Global admins can read transactions" 
ON public.financial_transactions 
FOR SELECT 
USING (is_global_admin(auth.uid()));

CREATE POLICY "Global admins can update transactions" 
ON public.financial_transactions 
FOR UPDATE 
USING (is_global_admin(auth.uid()));

CREATE POLICY "Global admins can delete students" 
ON public.students 
FOR DELETE 
USING (is_global_admin(auth.uid()));

CREATE POLICY "Global admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (is_global_admin(auth.uid()));

CREATE POLICY "Global admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (is_global_admin(auth.uid()));

CREATE POLICY "Global admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (is_global_admin(auth.uid()));

CREATE POLICY "Global admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (is_global_admin(auth.uid()));