-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create a PERMISSIVE SELECT policy so users can see their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);