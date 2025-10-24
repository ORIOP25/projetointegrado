-- Add user_id column to staff table to link with auth.users
ALTER TABLE staff ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);

-- Update RLS policies to ensure staff can only see their own data unless they're admin
DROP POLICY IF EXISTS "Authenticated users can read staff" ON staff;

CREATE POLICY "Authenticated users can read staff" 
ON staff FOR SELECT 
TO authenticated
USING (
  is_any_admin(auth.uid()) OR user_id = auth.uid()
);