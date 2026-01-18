-- Fix 1: Remove the public SELECT policy on games table
-- The games_public view should be used for public access, not direct table access
DROP POLICY IF EXISTS "Public can view games via games_public view" ON public.games;

-- Fix 2: Create a view for public site settings (excludes contact_email)
-- First, drop if exists to ensure clean recreation
DROP VIEW IF EXISTS public.site_settings_public;

CREATE VIEW public.site_settings_public
WITH (security_invoker=on) AS
  SELECT id, key, value, created_at, updated_at
  FROM public.site_settings
  WHERE key NOT IN ('contact_email');

-- Fix 3: Restrict site_settings SELECT to admins only
-- First drop the permissive public policy
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;

-- Create admin-only SELECT policy for base table
CREATE POLICY "Admins can view all site settings"
  ON public.site_settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create public SELECT policy for non-sensitive settings only
CREATE POLICY "Public can view non-sensitive site settings"
  ON public.site_settings FOR SELECT
  USING (key NOT IN ('contact_email'));