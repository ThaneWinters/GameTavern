#!/bin/bash
#
# Fix Auth Permissions
# Run this if you get "Database error checking email" errors
# Grants proper access to auth schema tables created by GoTrue
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load environment
if [ -f ../.env ]; then
    source ../.env
elif [ -f .env ]; then
    source .env
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

echo -e "${YELLOW}Fixing auth schema permissions...${NC}"

docker exec -i gamehaven-db psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres << 'EOSQL'
-- Grant schema access
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO supabase_admin;
GRANT ALL ON SCHEMA auth TO postgres;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;

-- Grant access to all existing tables in auth schema
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO service_role;

-- Grant access to all sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO supabase_auth_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO supabase_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO postgres;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth
GRANT ALL ON TABLES TO supabase_auth_admin, supabase_admin, postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth
GRANT SELECT ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth
GRANT ALL ON SEQUENCES TO supabase_auth_admin, supabase_admin, postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth
GRANT USAGE ON SEQUENCES TO service_role;

EOSQL

echo -e "${GREEN}✓${NC} Auth permissions fixed"
echo ""
echo -e "Now try running: ${YELLOW}./scripts/create-admin.sh${NC}"
