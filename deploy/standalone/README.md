# Game Haven - Standalone Self-Hosted Deployment

Complete self-hosted package with two deployment options:

| Version | Stack | Complexity | Best For |
|---------|-------|------------|----------|
| **v2 (Recommended)** | Express + Postgres | Simple (3 containers) | Most users, Cloudron, Softaculous |
| **v1 (Legacy)** | Full Supabase | Complex (7+ containers) | Feature parity with cloud |

---

## Quick Start - v2 (Recommended)

The v2 stack uses a simplified Node.js/Express backend instead of Supabase microservices.

```bash
# One-liner install
curl -fsSL https://get.docker.com | sh && \
git clone https://github.com/ThaneWinters/GameTavern.git && \
cd GameTavern/deploy/standalone && \
chmod +x install.sh scripts/*.sh && \
./install.sh --v2
```

Or manually:

```bash
cd deploy/standalone
cp .env.example .env
# Edit .env with your settings
docker compose -f docker-compose-v2.yml up -d
```

### v2 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your Server                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Frontend   │  │  Express    │  │   PostgreSQL    │  │
│  │   (Nginx)   │──│    API      │──│   (Standard)    │  │
│  │   :3000     │  │   :3001     │  │     :5432       │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### v2 Features

| Feature | v2 Support |
|---------|------------|
| Game Management | ✅ Full |
| BGG Import | ✅ Full |
| Play Logs | ✅ Full |
| Wishlist | ✅ Full |
| Messaging | ✅ Full |
| Ratings | ✅ Full |
| AI Descriptions | ✅ BYOK (OpenAI/Gemini) |
| Admin Panel | ✅ Full |

### v2 Environment Variables

```bash
# Required
DATABASE_URL=postgresql://postgres:password@db:5432/gamehaven
JWT_SECRET=your-secret-at-least-32-chars
SITE_URL=https://yourdomain.com

# Optional - AI (Bring Your Own Key)
AI_PROVIDER=openai  # or 'gemini'
AI_API_KEY=sk-...

# Optional - Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass
SMTP_FROM=noreply@example.com

# Optional - Features (all true by default)
FEATURE_PLAY_LOGS=true
FEATURE_WISHLIST=true
FEATURE_FOR_SALE=true
FEATURE_MESSAGING=true
FEATURE_RATINGS=true
```

---

## Quick Start - v1 (Legacy Supabase Stack)

The v1 stack includes the full Supabase platform (GoTrue, PostgREST, Kong, Realtime, etc.).

```bash
curl -fsSL https://get.docker.com | sh && \
git clone https://github.com/ThaneWinters/GameTavern.git && \
cd GameTavern/deploy/standalone && \
chmod +x install.sh scripts/*.sh && \
./install.sh
```

### v1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Linux Server                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Game Haven  │  │    Kong     │  │      PostgreSQL     │  │
│  │  Frontend   │──│  API Gateway│──│   + Auth + REST     │  │
│  │   :3000     │  │    :8000    │  │   + Realtime        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### v1 Services

| Service | Description | Default Port |
|---------|-------------|--------------|
| **Game Haven** | Frontend application | 3000 |
| **PostgreSQL** | Database | 5432 |
| **GoTrue** | Authentication service | - |
| **PostgREST** | REST API | - |
| **Kong** | API Gateway | 8000 |
| **Realtime** | WebSocket subscriptions | - |
| **Studio** | Database admin UI (optional) | 3001 |

---

## Installation Details

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum (v2) / 4GB RAM minimum (v1)
- 10GB disk space (v2) / 20GB disk space (v1)

### Step-by-Step Installation

```bash
# 1. Connect to your server
ssh root@your-server-ip

# 2. Update packages and install prerequisites
apt update && apt upgrade -y
apt install -y curl git wget unzip nginx certbot python3-certbot-nginx

# 3. Install Docker
curl -fsSL https://get.docker.com | sh
systemctl start docker && systemctl enable docker

# 4. (Optional) Create a non-root user
adduser gamehaven
usermod -aG docker gamehaven
usermod -aG sudo gamehaven
su - gamehaven

# 5. Clone and install
git clone https://github.com/ThaneWinters/GameTavern.git
cd GameTavern/deploy/standalone
chmod +x install.sh scripts/*.sh
./install.sh --v2  # or just ./install.sh for v1
```

### Access Your Site

- **Application**: `http://your-server-ip:3000`
- **API Health**: `http://your-server-ip:3001/health` (v2) or `http://your-server-ip:8000/health` (v1)

---

## Administration

### Create Admin User (v2)

```bash
# Interactive
./scripts/create-admin-v2.sh

# Non-interactive
ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="secure123" ./scripts/create-admin-v2.sh
```

### Create Admin User (v1)

```bash
./scripts/create-admin.sh
```

### Backup Database

```bash
./scripts/backup.sh
```

Backups are saved to `./backups/` and compressed automatically.

### Restore Database

```bash
./scripts/restore.sh ./backups/gamehaven_20240101_120000.sql.gz
```

---

## Production Deployment

### SSL Setup with Nginx

```bash
./scripts/setup-nginx.sh
```

This will:
1. Configure Nginx as a reverse proxy
2. Obtain a Let's Encrypt SSL certificate
3. Set up automatic certificate renewal

### Manual Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # API (v2)
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## Commands Reference

### v2 Stack

```bash
# Start
docker compose -f docker-compose-v2.yml up -d

# Stop
docker compose -f docker-compose-v2.yml down

# View logs
docker compose -f docker-compose-v2.yml logs -f

# Restart API
docker compose -f docker-compose-v2.yml restart api

# Rebuild after code changes
docker compose -f docker-compose-v2.yml build --no-cache
docker compose -f docker-compose-v2.yml up -d
```

### v1 Stack

```bash
# Start
docker compose up -d

# Stop
docker compose down

# View logs
docker compose logs -f

# View specific service
docker compose logs -f gamehaven
```

---

## Feature Flags

Toggle features on/off via environment variables:

| Feature | Variable | Default |
|---------|----------|---------|
| Play Logs | `FEATURE_PLAY_LOGS` | true |
| Wishlist | `FEATURE_WISHLIST` | true |
| For Sale | `FEATURE_FOR_SALE` | true |
| Messaging | `FEATURE_MESSAGING` | true |
| Ratings | `FEATURE_RATINGS` | true |
| Demo Mode | `FEATURE_DEMO_MODE` | false |

---

## AI Features (BYOK)

The v2 stack supports "Bring Your Own Key" AI integration for description condensing:

```bash
# .env
AI_PROVIDER=openai   # or 'gemini'
AI_API_KEY=sk-your-openai-key
```

Supported providers:
- **OpenAI**: GPT-4, GPT-3.5-turbo
- **Google Gemini**: gemini-pro

---

## Troubleshooting

### v2: API not responding

```bash
# Check container status
docker compose -f docker-compose-v2.yml ps

# Check API logs
docker compose -f docker-compose-v2.yml logs api

# Test health endpoint
curl http://localhost:3001/health
```

### v2: Database connection issues

```bash
# Verify database is running
docker compose -f docker-compose-v2.yml logs db

# Test connection
docker exec gamehaven-db-v2 psql -U postgres -d gamehaven -c "SELECT 1;"
```

### v1: Services not starting

```bash
./scripts/fix-db-passwords.sh
docker compose restart
```

### SSL / Certbot Issues

```bash
# Re-run SSL setup
./scripts/setup-nginx.sh

# Force certificate renewal
sudo certbot renew --force-renewal

# Test renewal
sudo certbot renew --dry-run
```

### Complete Reset

```bash
# v2
docker compose -f docker-compose-v2.yml down -v
./install.sh --v2

# v1
docker compose down -v
./install.sh
```

### Full Uninstall

```bash
# Stop and remove containers
docker compose -f docker-compose-v2.yml down -v  # or docker compose down -v

# Remove images
docker rmi standalone-gamehaven:latest standalone-api:latest 2>/dev/null

# Remove project files
cd ~ && rm -rf ~/GameTavern

# Remove Nginx config
sudo rm -f /etc/nginx/sites-enabled/gamehaven /etc/nginx/sites-available/gamehaven
sudo systemctl reload nginx

# Clear Docker cache
docker builder prune -af
```

---

## Platform-Specific Guides

### Cloudron

See [deploy/cloudron/README.md](../cloudron/README.md) for Cloudron-specific installation.

### Softaculous

The v2 stack is compatible with Softaculous container deployments. Contact us for the Softaculous package.

### Windows (Docker Desktop)

1. Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. Clone the repository
3. Run `docker compose -f docker-compose-v2.yml up -d`

---

## Migration: v1 to v2

To migrate from v1 (Supabase) to v2 (Express):

1. **Backup your database**:
   ```bash
   ./scripts/backup.sh
   ```

2. **Stop v1 stack**:
   ```bash
   docker compose down
   ```

3. **Start v2 stack**:
   ```bash
   docker compose -f docker-compose-v2.yml up -d
   ```

4. **Restore data** (schema is compatible):
   ```bash
   ./scripts/restore.sh ./backups/latest.sql.gz
   ```

5. **Create admin user** (auth system changed):
   ```bash
   ./scripts/create-admin-v2.sh
   ```

Note: User passwords from v1 are not compatible with v2. Users will need to reset their passwords.

---

## Security Notes

1. **Change default secrets** - Never use example values in production
2. **Use HTTPS** - Configure SSL via Nginx reverse proxy
3. **Backup regularly** - Use the provided backup script
4. **Keep credentials secure** - Protect your `.env` file (chmod 600)
5. **Update regularly** - Pull latest changes and rebuild
