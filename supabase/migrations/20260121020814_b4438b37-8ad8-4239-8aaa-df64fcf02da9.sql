-- Grant SELECT permission on public views to anon and authenticated roles
GRANT SELECT ON public.games_public TO anon, authenticated;
GRANT SELECT ON public.site_settings_public TO anon, authenticated;