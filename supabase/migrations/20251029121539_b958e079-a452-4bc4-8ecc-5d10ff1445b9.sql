-- Ensure RLS is enabled on the students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Verify the students table is properly secured
-- The existing policies already restrict access to global_admin and staff roles
-- This migration ensures RLS is definitely enabled to prevent public access