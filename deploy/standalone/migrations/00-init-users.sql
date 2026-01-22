-- Initialize Supabase internal users with correct passwords
-- This runs during postgres container init (before other services connect)

-- Set password for auth admin (used by GoTrue)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    EXECUTE format('ALTER ROLE supabase_auth_admin WITH PASSWORD %L', current_setting('app.settings.postgres_password', true));
  END IF;
END
$$;

-- Set password for authenticator (used by PostgREST)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
    EXECUTE format('ALTER ROLE authenticator WITH PASSWORD %L', current_setting('app.settings.postgres_password', true));
  END IF;
END
$$;

-- Set password for supabase_admin (used by Realtime and Studio)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    EXECUTE format('ALTER ROLE supabase_admin WITH PASSWORD %L', current_setting('app.settings.postgres_password', true));
  END IF;
END
$$;
