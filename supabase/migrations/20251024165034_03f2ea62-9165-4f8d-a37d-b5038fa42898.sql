-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('global_admin', 'staff');

-- Create departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Create financial_transactions table
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Create staff table
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  salary NUMERIC,
  hire_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  department_id UUID REFERENCES public.departments(id),
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  course TEXT,
  email TEXT,
  phone TEXT,
  enrollment_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  department_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
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

CREATE OR REPLACE FUNCTION public.is_global_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'global_admin')
$$;

-- RLS Policies for departments
CREATE POLICY "Global admins can view all departments"
  ON public.departments FOR SELECT
  USING (public.is_global_admin(auth.uid()));

CREATE POLICY "Global admins can insert departments"
  ON public.departments FOR INSERT
  WITH CHECK (public.is_global_admin(auth.uid()));

CREATE POLICY "Global admins can update departments"
  ON public.departments FOR UPDATE
  USING (public.is_global_admin(auth.uid()));

CREATE POLICY "Global admins can delete departments"
  ON public.departments FOR DELETE
  USING (public.is_global_admin(auth.uid()));

-- RLS Policies for financial_transactions
CREATE POLICY "Global admins can view all transactions"
  ON public.financial_transactions FOR SELECT
  USING (public.is_global_admin(auth.uid()));

CREATE POLICY "Global admins can insert transactions"
  ON public.financial_transactions FOR INSERT
  WITH CHECK (public.is_global_admin(auth.uid()));

CREATE POLICY "Global admins can update transactions"
  ON public.financial_transactions FOR UPDATE
  USING (public.is_global_admin(auth.uid()));

CREATE POLICY "Global admins can delete transactions"
  ON public.financial_transactions FOR DELETE
  USING (public.is_global_admin(auth.uid()));

-- RLS Policies for staff
CREATE POLICY "Global admins can view all staff"
  ON public.staff FOR SELECT
  USING (public.is_global_admin(auth.uid()));

CREATE POLICY "Staff can view their own record"
  ON public.staff FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Global admins can insert staff"
  ON public.staff FOR INSERT
  WITH CHECK (public.is_global_admin(auth.uid()));

CREATE POLICY "Global admins can update staff"
  ON public.staff FOR UPDATE
  USING (public.is_global_admin(auth.uid()));

CREATE POLICY "Global admins can delete staff"
  ON public.staff FOR DELETE
  USING (public.is_global_admin(auth.uid()));

-- RLS Policies for students
CREATE POLICY "Global admins can view all students"
  ON public.students FOR SELECT
  USING (public.is_global_admin(auth.uid()));

CREATE POLICY "Staff can view all students"
  ON public.students FOR SELECT
  USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Global admins can insert students"
  ON public.students FOR INSERT
  WITH CHECK (public.is_global_admin(auth.uid()));

CREATE POLICY "Staff can insert students"
  ON public.students FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Global admins can update students"
  ON public.students FOR UPDATE
  USING (public.is_global_admin(auth.uid()));

CREATE POLICY "Staff can update students"
  ON public.students FOR UPDATE
  USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Global admins can delete students"
  ON public.students FOR DELETE
  USING (public.is_global_admin(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Global admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_global_admin(auth.uid()));

CREATE POLICY "Global admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_global_admin(auth.uid()));

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();