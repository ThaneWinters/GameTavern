-- Fix infinite recursion in user_roles RLS policies by removing self-referential subquery
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Allow admins to manage roles (no recursion)
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));