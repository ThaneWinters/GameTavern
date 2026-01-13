-- Create app_role enum for role types
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table to store user roles separately (prevents privilege escalation)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Only admins can manage roles (we'll bootstrap the first admin separately)
CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Create security definer function to check roles (avoids RLS recursion)
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

-- Drop existing overly permissive policies for games
DROP POLICY IF EXISTS "Authenticated users can insert games" ON public.games;
DROP POLICY IF EXISTS "Authenticated users can update games" ON public.games;
DROP POLICY IF EXISTS "Authenticated users can delete games" ON public.games;

-- Create admin-only policies for games
CREATE POLICY "Admins can insert games" ON public.games 
FOR INSERT TO authenticated 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update games" ON public.games 
FOR UPDATE TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete games" ON public.games 
FOR DELETE TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing overly permissive policies for mechanics
DROP POLICY IF EXISTS "Authenticated users can insert mechanics" ON public.mechanics;

-- Create admin-only policy for mechanics
CREATE POLICY "Admins can insert mechanics" ON public.mechanics 
FOR INSERT TO authenticated 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update mechanics" ON public.mechanics 
FOR UPDATE TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete mechanics" ON public.mechanics 
FOR DELETE TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing overly permissive policies for publishers
DROP POLICY IF EXISTS "Authenticated users can insert publishers" ON public.publishers;

-- Create admin-only policy for publishers
CREATE POLICY "Admins can insert publishers" ON public.publishers 
FOR INSERT TO authenticated 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update publishers" ON public.publishers 
FOR UPDATE TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete publishers" ON public.publishers 
FOR DELETE TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing overly permissive policies for game_mechanics
DROP POLICY IF EXISTS "Authenticated users can insert game_mechanics" ON public.game_mechanics;
DROP POLICY IF EXISTS "Authenticated users can delete game_mechanics" ON public.game_mechanics;

-- Create admin-only policies for game_mechanics
CREATE POLICY "Admins can insert game_mechanics" ON public.game_mechanics 
FOR INSERT TO authenticated 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update game_mechanics" ON public.game_mechanics 
FOR UPDATE TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete game_mechanics" ON public.game_mechanics 
FOR DELETE TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));