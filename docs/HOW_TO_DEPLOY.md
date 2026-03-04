# How to Deploy GHOSTNET

## Prerequisites

- Docker & Docker Compose
- Node 20+ and pnpm (for local dev)
- PostgreSQL 16 or compatible (for managed DB)
- Redis 7 or compatible

---

## Option A: Docker Compose (Recommended for Beta)

### 1. Clone and configure

```bash
git clone <repo-url> ghostnet
cd ghostnet
cp .env.example .env
```

### 2. Edit `.env` for production

```bash
# Required
DATABASE_URL=postgresql://user:password@host:5432/ghostnet
REDIS_URL=redis://host:6379
JWT_SECRET=<generate-32-char-random-string>
JWT_REFRESH_SECRET=<generate-different-32-char-string>

# Production URLs
APP_URL=https://your-domain.com
API_URL=https://api.your-domain.com
DECEPTION_BASE_URL=https://deception.your-domain.com

# Optional
POSTGRES_USER=ghostnet
POSTGRES_PASSWORD=<strong-password>
MINIO_ROOT_PASSWORD=<strong-password>
NODE_ENV=production
```

### 3. Build and start

```bash
docker compose -f infra/docker-compose.prod.yml build
docker compose -f infra/docker-compose.prod.yml up -d
```

### 4. Run migrations

```bash
docker compose -f infra/docker-compose.prod.yml exec api npx prisma migrate deploy
```

### 5. Seed demo data (optional)

```bash
docker compose -f infra/docker-compose.prod.yml exec api npx tsx ../../scripts/seed-demo.ts
```

### 6. Create admin user

```bash
docker compose -f infra/docker-compose.prod.yml exec api npx tsx ../../scripts/create-admin.ts \
  --email admin@yourdomain.com \
  --password <secure-password> \
  --org "Your Organization"
```

### 7. Reverse proxy (nginx / Caddy / Traefik)

Place the web container behind HTTPS. Example nginx config:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;  # web container
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Option B: Local development

```bash
# 1. Start infra
make infra-up
# or: docker compose -f infra/docker-compose.yml up -d postgres redis minio

# 2. Migrate
make migrate

# 3. Seed
make seed

# 4. Create admin
npx pnpm --filter @ghostnet/api exec tsx ../../scripts/create-admin.ts --email admin@example.com --password admin123 --org "My Org"

# 5. Start all apps
make dev
```

---

## Beta Smoke Test

After deployment, verify:

| URL | Expected |
|-----|----------|
| `https://your-domain.com` | Landing page loads |
| `https://your-domain.com/login` | Login form |
| `https://your-domain.com/demo` | Demo dashboard (no auth) |
| `https://api.your-domain.com/health` | `{"status":"ok"}` |
| `https://api.your-domain.com/ready` | `{"status":"ready","checks":{"database":"ok","redis":"ok"}}` |

### Manual checks

1. Sign in with admin credentials
2. Complete onboarding (if first org)
3. Go to Dashboard — stats and charts load
4. Go to Sessions — list loads (may be empty)
5. Go to Alerts — list loads
6. Go to Config — tabs load
7. Go to Team — members list loads

---

## Rollback

1. **Revert deploy**: `docker compose -f infra/docker-compose.prod.yml down`
2. **DB migrations**: Prisma migrations are forward-only. To rollback schema changes, restore from backup or create a new migration that reverses the change.
3. **Data backup**: `pg_dump` before major migrations.

---

## Environment Variables Reference

See `docs/ARCHITECTURE_MAP.md` for the full list.
