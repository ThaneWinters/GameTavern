# Site Configuration Guide

This application uses environment variables for branding and configuration, making it easy to deploy as a white-label game library.

## Environment Variables

Add these to your `.env` file or hosting platform's environment configuration:

### Required (for custom branding)

```env
# Site name displayed in header, sidebar, and browser tab
VITE_SITE_NAME="Your Game Library"

# Description for SEO meta tags
VITE_SITE_DESCRIPTION="Browse and discover our collection of board games, card games, and more."

# Author name for meta tags (defaults to VITE_SITE_NAME if not set)
VITE_SITE_AUTHOR="Your Name"

# Twitter handle for social cards (without @, optional)
VITE_TWITTER_HANDLE="YourTwitter"
```

### Required (for backend)

```env
# Supabase connection (these are auto-configured by Lovable Cloud)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"
```

## Supabase Secrets (Edge Functions)

These secrets must be configured in your Supabase project's Edge Functions settings:

| Secret | Required | Description |
|--------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key for admin operations |
| `PII_ENCRYPTION_KEY` | Yes | 32-byte hex key for encrypting personal data |
| `TURNSTILE_SECRET_KEY` | Yes | Cloudflare Turnstile secret for anti-spam |
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | Yes | SMTP port (usually 587 or 465) |
| `SMTP_USER` | Yes | SMTP username |
| `SMTP_PASS` | Yes | SMTP password |
| `SMTP_FROM` | Yes | From email address for outgoing mail |

## Docker Deployment

When deploying with Docker, pass environment variables via:

```bash
docker run -d \
  -e VITE_SITE_NAME="My Game Library" \
  -e VITE_SUPABASE_URL="https://xxx.supabase.co" \
  -e VITE_SUPABASE_PUBLISHABLE_KEY="your-key" \
  your-image:tag
```

Or use a `.env` file:

```bash
docker run -d --env-file .env your-image:tag
```

## Customization Points

### Static Files (index.html)

For full customization of meta tags, favicons, and Open Graph images, edit `index.html` directly:

- Line 19: `<title>` tag
- Line 20-21: Meta description and author
- Line 23-25: Open Graph tags
- Line 28-30: Twitter Card tags
- Line 26, 30: OG/Twitter images

### Theme Customization

Colors and theming are controlled in:
- `src/index.css` - CSS variables for colors
- `tailwind.config.ts` - Tailwind theme configuration

### Database Schema

See `supabase/migrations/` for the complete database schema including:
- `games` - Game entries with all metadata
- `mechanics` - Game mechanics/categories
- `publishers` - Publisher information
- `game_messages` - Encrypted contact form messages
- `site_settings` - Dynamic site configuration
- `user_roles` - Role-based access control
