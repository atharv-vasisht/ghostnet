# GHOSTNET

**Enterprise Agentic Deception Platform**

GHOSTNET detects, traps, and analyzes AI-powered attack agents by deploying authentic-looking enterprise environments that capture every interaction, map attacker beliefs in real time, and generate actionable threat intelligence.

---

## Quick Start

```bash
# One-command setup (requires Docker)
./scripts/setup.sh

# Or manually:
cp .env.example .env
docker compose -f infra/docker-compose.yml up --build -d
docker compose -f infra/docker-compose.yml exec api npx prisma migrate deploy
docker compose -f infra/docker-compose.yml exec api npx tsx ../../scripts/seed-demo.ts
```

**Access Points:**

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:5173 |
| Live Demo | http://localhost:5173/demo |
| API | http://localhost:3000 |
| Deception Layer | http://localhost:4000 |
| MinIO Console | http://localhost:9001 |

Run the attack simulation to see GHOSTNET in action:

```bash
./scripts/simulate-agent.sh
```

**Beta deployment:** See [docs/HOW_TO_DEPLOY.md](docs/HOW_TO_DEPLOY.md) for production deployment, [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) for release verification, and [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md) for running tests.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Attack Surface                        │
│  ┌──────┐ ┌────────┐ ┌─────┐ ┌────┐ ┌──────────┐      │
│  │ IAM  │ │Secrets │ │ API │ │ S3 │ │Discovery │      │
│  └──┬───┘ └───┬────┘ └──┬──┘ └─┬──┘ └────┬─────┘      │
│     └────┬─────┴────┬────┴──────┴─────────┘             │
│          │          │                                    │
│    ┌─────▼──────────▼──────┐                             │
│    │  Instrumentation      │   ← Captures every request  │
│    │  Middleware            │                             │
│    └───────────┬───────────┘                             │
│                │ BullMQ                                  │
│    ┌───────────▼───────────┐                             │
│    │  Event Worker         │                             │
│    │  ├─ Session Stitcher  │   ← Groups events by agent  │
│    │  ├─ Behavioral Tagger │   ← Classifies actions      │
│    │  ├─ Belief Mapper     │   ← Infers attacker intent  │
│    │  └─ Alert Evaluator   │   ← Triggers notifications  │
│    └───────────┬───────────┘                             │
│                │ Redis Pub/Sub                            │
│    ┌───────────▼───────────┐                             │
│    │  API + WebSocket GW   │   ← Real-time dashboard     │
│    └───────────┬───────────┘                             │
│                │                                         │
│    ┌───────────▼───────────┐                             │
│    │  React Dashboard      │   ← Analyst workstation     │
│    └───────────────────────┘                             │
└─────────────────────────────────────────────────────────┘
```

### Service Overview

| Service | Purpose | Port |
|---------|---------|------|
| **API** | REST API, auth, WebSocket gateway | 3000 |
| **Deception** | Fake enterprise services (IAM, Secrets, S3, API) | 4000 |
| **Worker** | Async event processing, session stitching, belief mapping | — |
| **Web** | React dashboard and marketing site | 5173 |
| **PostgreSQL** | Primary data store | 5432 |
| **Redis** | Session cache, job queue, pub/sub | 6379 |
| **MinIO** | S3-compatible object storage for deception | 9000/9001 |

---

## Project Structure

```
ghostnet/
├── apps/
│   ├── api/                # Fastify REST API + WebSocket gateway
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── plugins/    # Auth, CORS, rate-limit
│   │   │   ├── routes/     # Auth, sessions, events, alerts, config, users, orgs, reports, demo
│   │   │   ├── services/   # Auth, email, session, alert, report, demo-simulator
│   │   │   ├── middleware/  # Authenticate, authorize, demo-guard
│   │   │   └── websocket/  # Socket.io gateway
│   │   └── prisma/         # Schema + migrations
│   │
│   ├── deception/          # Fake enterprise environment
│   │   └── src/
│   │       ├── services/   # IAM, Secrets Manager, Internal API, Discovery
│   │       ├── realism/    # Response timing, headers, error formatting
│   │       ├── proxy/      # Instrumentation middleware
│   │       ├── data/       # Faker.js data generators, breadcrumb config
│   │       └── queue/      # BullMQ event producer
│   │
│   ├── worker/             # Async event processor
│   │   └── src/
│   │       ├── processors/ # Event, session, belief, alert processors
│   │       └── engines/    # Tagger, stitcher, belief-mapper
│   │
│   └── web/                # React frontend
│       └── src/
│           ├── pages/      # Landing, demo, auth, onboarding, app pages
│           ├── components/ # Layout, dashboard, sessions, session-detail, shared
│           ├── hooks/      # React Query + Socket.io hooks
│           └── lib/        # API client, auth store, socket, utilities
│
├── packages/
│   └── shared/             # Shared TypeScript types
│
├── scripts/
│   ├── setup.sh            # One-command local setup
│   ├── seed-demo.ts        # Seeds demo tenant with rich data
│   ├── create-admin.ts     # Creates admin user
│   └── simulate-agent.sh   # Demo attack simulation
│
└── infra/
    ├── docker-compose.yml
    ├── docker-compose.dev.yml
    ├── docker-compose.prod.yml
    └── nginx/nginx.conf
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Runtime | Node.js 20 LTS + TypeScript (strict) |
| API Framework | Fastify 5 |
| ORM | Prisma + PostgreSQL 16 |
| Auth | JWT (15min access) + Refresh tokens (30 day, httpOnly) |
| Real-time | Socket.io |
| Job Queue | BullMQ + Redis |
| Email | Resend |
| Validation | Zod |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| State | Zustand (client) + React Query (server) |
| Charts | Recharts |
| Icons | Lucide React |

---

## Deception Services

### AWS IAM (STS)
Full AWS IAM/STS endpoint compatibility with XML responses:
- `GetCallerIdentity`, `ListUsers`, `GetUser`, `ListRoles`, `AssumeRole`, `ListAttachedUserPolicies`
- AWS Signature V4 format validation (accepts any properly formatted signature)
- Breadcrumb: policies reference S3 bucket names and Secrets Manager

### AWS Secrets Manager
JSON API matching AWS protocol:
- `ListSecrets`, `GetSecretValue`, `DescribeSecret`
- Pre-populated secrets: database credentials, API keys, AWS keys
- Every `GetSecretValue` triggers `credential_harvesting` alert evaluation

### Internal Business API
REST API with Bearer token auth:
- Employee directory (paginated), projects, financials, org chart
- Bulk pagination detection (3+ pages triggers `exfiltration_attempt`)
- Admin config endpoint contains breadcrumb to Secrets Manager

### S3-Compatible Storage (MinIO)
Real S3 protocol via MinIO:
- Buckets: `prod-backups-2024`, `employee-records`, `audit-logs-archive`
- Pre-populated with realistic files (database dumps, CSVs, audit logs)

### Discovery Endpoint
Service registry at `/.well-known/ghostnet-services`:
- Lists all available deception services with endpoints
- Every hit tagged `initial_recon` and starts a new session

---

## Belief Mapping

GHOSTNET's signature feature — real-time inference of attacker intent:

- **Asset Extraction**: Parses response bodies to identify credentials, usernames, endpoints, buckets, and files the attacker has obtained
- **Goal Inference**: Pattern matching on exploration paths to classify attacker objectives (Credential Theft, Data Exfiltration, Full Reconnaissance, Initial Access Validation)
- **Confidence Scoring**: Composite score (0-100) based on:
  - Reused fake credentials (+25)
  - Followed breadcrumb links (+15 per hop, max 30)
  - Attempted exfiltration (+20)
  - Retry patterns suggesting real engagement (+10)
  - Multi-service exploration (+15)

---

## Behavioral Tags

| Tag | Trigger |
|-----|---------|
| `initial_recon` | Discovery endpoint accessed |
| `credential_harvesting` | Secrets Manager or IAM user enumeration |
| `lateral_movement` | Using retrieved credentials on a different service |
| `exfiltration_attempt` | Bulk S3 downloads or 3+ paginated API requests |
| `deep_probe` | 3+ distinct services accessed in one session |
| `persistence_attempt` | Write operations (PutObject, CreateUser, etc.) |

---

## Demo Mode

The demo at `/demo` is always alive — a background simulator generates events every 3-8 seconds for an "active" session. Pre-seeded with 4 sessions ranging from a full CRITICAL attack chain to a shallow probe, including alerts and belief state data.

No authentication required. All mutation actions show a "sign up to unlock" modal.

---

## Local Development

```bash
# Install dependencies
pnpm install

# Generate Prisma client
cd apps/api && npx prisma generate && cd ../..

# Start infrastructure (Postgres, Redis, MinIO)
docker compose -f infra/docker-compose.yml up postgres redis minio -d

# Run migrations
cd apps/api && npx prisma migrate dev && cd ../..

# Seed demo data
pnpm run db:seed

# Start all services (hot reload)
pnpm run dev
```

Or use Docker for everything:

```bash
docker compose -f infra/docker-compose.yml -f infra/docker-compose.dev.yml up
```

---

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://ghostnet:ghostnet_dev@localhost:5432/ghostnet` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Access token signing key | (change in production) |
| `JWT_REFRESH_SECRET` | Refresh token signing key | (change in production) |
| `RESEND_API_KEY` | Email service API key | (optional, logs to console if unset) |
| `DECEPTION_BASE_URL` | Base URL for deception endpoints | `http://localhost:4000` |
| `DEMO_ENABLED` | Enable demo simulator | `true` |

---

## AWS Migration Guide

Each service maps directly to AWS infrastructure:

| Local Service | AWS Equivalent |
|--------------|----------------|
| PostgreSQL | Amazon RDS (PostgreSQL) |
| Redis | Amazon ElastiCache (Redis) |
| MinIO | Keep on EC2 or use real S3 for deception |
| API / Deception / Worker | ECS Fargate tasks |
| Web (React) | S3 + CloudFront static hosting |
| Load Balancing | Application Load Balancer |
| DNS | Route 53 with wildcard cert (`*.{orgSlug}.ghostnet.io`) |
| Logging | CloudWatch (structured JSON logs are ready) |
| Secrets | AWS Secrets Manager (for GHOSTNET's own secrets) |

### Deployment Steps

1. **Database**: Create RDS PostgreSQL 16 instance. Run `prisma migrate deploy`.
2. **Cache/Queue**: Create ElastiCache Redis 7 cluster.
3. **Storage**: Deploy MinIO on EC2 or use S3 for deception bucket hosting.
4. **Containers**: Push Docker images to ECR. Create ECS Fargate task definitions for `api`, `deception`, `worker`.
5. **Frontend**: Build React app (`pnpm --filter @ghostnet/web run build`), deploy to S3 + CloudFront.
6. **Load Balancer**: ALB with HTTPS listener, route `/api/*` and `/auth/*` to API target group, `/socket.io/*` with WebSocket support.
7. **DNS**: Route 53 hosted zone for `ghostnet.io`, wildcard cert via ACM for `*.ghostnet.io`.
8. **Environment**: Set all env vars in ECS task definitions / Parameter Store.

---

## API Reference

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/signup` | — | Register with invite token |
| POST | `/auth/login` | — | Email/password login |
| POST | `/auth/refresh` | Cookie | Rotate refresh token |
| POST | `/auth/logout` | Cookie | Sign out |
| POST | `/auth/forgot-password` | — | Request password reset |
| POST | `/auth/reset-password` | — | Reset with token |
| GET | `/auth/me` | Bearer | Current user + org |

### Sessions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/sessions` | Bearer | List sessions (paginated, filtered) |
| GET | `/api/sessions/:id` | Bearer | Session detail with events |
| GET | `/api/sessions/:id/export` | Bearer | CSV export |

### Alerts
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/alerts` | Bearer | List alerts |
| PATCH | `/api/alerts/:id/acknowledge` | Bearer | Acknowledge alert |
| GET | `/api/alert-rules` | Bearer | List alert rules |
| POST | `/api/alert-rules` | Admin | Create rule |
| PATCH | `/api/alert-rules/:id` | Admin | Update rule |
| DELETE | `/api/alert-rules/:id` | Admin | Delete rule |

### Configuration
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/config` | Bearer | Deception config |
| PATCH | `/api/config` | Admin | Update config |
| GET | `/api/config/endpoints` | Bearer | Endpoint URLs |

### Demo (no auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/demo/sessions` | Demo sessions |
| GET | `/api/demo/sessions/:id` | Demo session detail |
| GET | `/api/demo/stats` | Dashboard stats |

---

## License

Proprietary. All rights reserved.
