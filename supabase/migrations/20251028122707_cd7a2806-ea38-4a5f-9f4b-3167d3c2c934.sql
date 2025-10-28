-- Drop the restrictive policy that only allows staff to see their own record
DROP POLICY IF EXISTS "Staff can view their own record" ON public.staff;

-- Create a new policy that allows staff to view all staff records
CREATE POLICY "Staff can view all staff records"
ON public.staff
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'staff'::app_role)
);