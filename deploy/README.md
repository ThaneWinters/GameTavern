# Game Haven - Cloudron Deployment

One-click deployment to Cloudron.

## Quick Start

```bash
cd deploy/cloudron
docker build -t your-registry/gamehaven:latest -f Dockerfile ../..
docker push your-registry/gamehaven:latest
cloudron install
```

## Environment Variables

Set these in Cloudron dashboard after installation:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `SITE_NAME` | ❌ | Site title (default: "Game Haven") |
| `SITE_DESCRIPTION` | ❌ | Site description |
| `FEATURE_PLAY_LOGS` | ❌ | Enable play logging (default: true) |
| `FEATURE_WISHLIST` | ❌ | Enable wishlists (default: true) |
| `FEATURE_FOR_SALE` | ❌ | Enable for-sale listings (default: true) |
| `FEATURE_MESSAGING` | ❌ | Enable messaging (default: true) |
| `FEATURE_DEMO_MODE` | ❌ | Enable demo mode (default: false) |

## Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Navigate to Settings → API
3. Copy the **Project URL** → `SUPABASE_URL`
4. Copy the **anon/public key** → `SUPABASE_ANON_KEY`

## Database Setup

Run the SQL migrations from `supabase/migrations/` in your Supabase SQL editor.

## Health Check

```bash
curl https://your-app.cloudron.domain/health
# {"status":"healthy"}
```

## Files

```
deploy/cloudron/
├── Dockerfile           # Build image
├── CloudronManifest.json # Cloudron app config
├── nginx.conf           # Web server config
├── start.sh             # Runtime config injection
└── logo.png             # App icon (add your own)
```
