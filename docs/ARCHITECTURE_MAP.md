# GHOSTNET Architecture Map

> Enterprise Agentic Deception Platform — detects AI-powered attack agents.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, React Query, Socket.io client, Recharts |
| Backend API | Fastify 5, Prisma, PostgreSQL 16 |
| Deception | Node.js services (IAM, Secrets, Internal API, Discovery), MinIO (S3-compatible) |
| Worker | BullMQ, Redis |
| Infra | Docker Compose, PostgreSQL 16, Redis 7, MinIO |

---

## Frontend Routes

| Path | Component | Auth | Description |
|-----|-----------|------|-------------|
| `/` | Landing | Public | Marketing landing page |
| `/login` | Login | Public | Sign in |
| `/signup` | Signup | Public | Invite-only registration |
| `/forgot-password` | ForgotPassword | Public | Request password reset |
| `/reset-password` | ResetPassword | Public | Set new password (token in query) |
| `/demo` | Demo wrapper | Public | Demo mode (no auth) |
| `/demo/dashboard` | Dashboard | Public | Demo dashboard |
| `/demo/sessions` | Sessions | Public | Demo sessions list |
| `/demo/sessions/:id` | SessionDetail | Public | Demo session detail |
| `/demo/alerts` | Alerts | Public | Demo alerts |
| `/onboarding/*` | Onboarding | Protected | Setup wizard for new orgs |
| `/app` | AppShell | Protected | Main app layout |
| `/app/dashboard` | Dashboard | Protected | Overview, charts |
| `/app/sessions` | Sessions | Protected | Agent sessions list |
| `/app/sessions/:id` | SessionDetail | Protected | Session timeline, events |
| `/app/alerts` | Alerts | Protected | Alerts + rules |
| `/app/reports` | Reports | Protected | Reports |
| `/app/config/*` | Config | Protected | Environment, Services, Endpoints, Integrations |
| `/app/team` | Team | Protected | Members + invites |
| `*` | Redirect to `/` | — | Catch-all |

---

## Backend Endpoints

### Auth (`/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/signup` | No | Register with invite token |
| POST | `/auth/login` | No | Sign in |
| POST | `/auth/refresh` | Cookie | Refresh access token |
| POST | `/auth/logout` | Cookie | Logout |
| POST | `/auth/forgot-password` | No | Request reset email |
| GET | `/auth/reset-password/validate` | No | Validate reset token (query: token) |
| POST | `/auth/reset-password` | No | Reset password with token |
| GET | `/auth/me` | Yes | Current user |

### API (`/api`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/sessions` | Yes | List sessions |
| GET | `/api/sessions/:id` | Yes | Session detail |
| GET | `/api/sessions/:id/export` | Yes | Export session |
| GET | `/api/events` | Yes | List events (filter by session) |
| GET | `/api/events/export` | Yes | Export events |
| GET | `/api/alerts` | Yes | List alerts |
| PATCH | `/api/alerts/:id/acknowledge` | Yes | Acknowledge alert |
| GET | `/api/alert-rules` | Yes | List alert rules |
| POST | `/api/alert-rules` | Yes (Admin) | Create rule |
| PATCH | `/api/alert-rules/:id` | Yes (Admin) | Update rule |
| DELETE | `/api/alert-rules/:id` | Yes (Admin) | Delete rule |
| GET | `/api/config` | Yes | Deception config + endpoints |
| PATCH | `/api/config` | Yes (Admin) | Update config |
| GET | `/api/config/endpoints` | Yes | Active endpoints |
| GET | `/api/users` | Yes | List org users |
| POST | `/api/users/invite` | Yes (Admin) | Create invite |
| PATCH | `/api/users/:id/role` | Yes (Admin) | Change user role |
| DELETE | `/api/users/:id` | Yes (Admin) | Remove user |
| GET | `/api/team/members` | Yes | List members (alias for users) |
| GET | `/api/team/invites` | Yes | List pending invites |
| POST | `/api/team/invites` | Yes (Admin) | Create invite |
| PATCH | `/api/team/members/:id` | Yes (Admin) | Change role |
| DELETE | `/api/team/members/:id` | Yes (Admin) | Remove member |
| DELETE | `/api/team/invites/:id` | Yes (Admin) | Revoke invite |
| GET | `/api/org` | Yes | Current org |
| PATCH | `/api/org` | Yes (Admin) | Update org |
| GET | `/api/reports/sessions/:id` | Yes | Session report |
| GET | `/api/demo/sessions` | No | Demo sessions |
| GET | `/api/demo/sessions/:id` | No | Demo session detail |
| GET | `/api/demo/events` | No | Demo events |
| GET | `/api/demo/alerts` | No | Demo alerts |
| GET | `/api/demo/alerts/rules` | No | Demo alert rules |
| GET | `/api/demo/stats` | No | Demo stats |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Basic liveness |
| GET | `/ready` | No | DB + critical deps readiness |

### Deception Service (port 4000)

| Path | Description |
|------|-------------|
| `/health` | Liveness |
| `/iam/:orgSlug/*` | Fake IAM |
| `/oauth/:orgSlug/*` | Fake OAuth |
| `/api/:orgSlug/*` | Fake internal API |
| `/secrets/:orgSlug/*` | Fake secrets manager |
| `/s3/:orgSlug/*` | Fake S3 (MinIO) |
| `/:orgSlug/.well-known/ghostnet-services` | Discovery |

---

## Database (Prisma)

### Tables

| Table | Purpose |
|-------|---------|
| Organization | Tenant, plan, deception config |
| User | Auth, role, org membership |
| RefreshToken | JWT refresh tokens |
| Invite | Pending invites (email, role, token) |
| DeceptionConfig | Per-org deception toggles |
| AgentSession | Detected agent sessions |
| AgentEvent | Individual events per session |
| AlertRule | Alert definitions |
| Alert | Fired alerts |
| PasswordResetToken | Password reset flow |

### Migrations

- `20260303051939_init` — Initial schema

---

## Auth Flows

1. **Login**: POST `/auth/login` → access token (JSON) + refresh token (httpOnly cookie)
2. **Refresh**: POST `/auth/refresh` (cookie) → new access token
3. **Protected routes**: `Authorization: Bearer <accessToken>` or cookie
4. **Signup**: Invite-only; requires `inviteToken` from invite link
5. **Password reset**: Forgot → email link → validate token → POST reset

---

## External Integrations

| Service | Purpose |
|---------|---------|
| Resend | Password reset + invite emails |
| MinIO | S3-compatible storage for deception files |
| Redis | BullMQ queues, session cache |
| PostgreSQL | Primary data store |

---

## Required Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | Yes | — | PostgreSQL connection string |
| REDIS_URL | Yes | — | Redis connection string |
| JWT_SECRET | Yes | — | Min 32 chars for access tokens |
| JWT_REFRESH_SECRET | Yes | — | Min 32 chars for refresh tokens |
| BCRYPT_ROUNDS | No | 12 | Password hashing rounds |
| API_PORT | No | 3000 | API server port |
| DECEPTION_PORT | No | 4000 | Deception server port |
| APP_URL | No | http://localhost:5173 | Frontend URL (CORS, emails) |
| API_URL | No | http://localhost:3000 | API URL for frontend |
| DECEPTION_BASE_URL | No | http://localhost:4000 | Deception service URL |
| RESEND_API_KEY | No | — | Email (optional, invites/reset) |
| EMAIL_FROM | No | noreply@ghostnet.io | From address |
| MINIO_ROOT_USER | No | ghostnet | MinIO user |
| MINIO_ROOT_PASSWORD | No | ghostnet_dev | MinIO password |
| MINIO_ENDPOINT | No | localhost | MinIO host |
| MINIO_PORT | No | 9000 | MinIO port |
| DEMO_ORG_SLUG | No | demo | Demo org slug |
| DEMO_ENABLED | No | true | Enable demo mode |
| LOG_LEVEL | No | info | Log level |
| NODE_ENV | No | development | Environment |

---

## WebSocket

- **Path**: `/socket.io`
- **Purpose**: Real-time event broadcast per org
- **Rooms**: `org:{orgId}` — sessions, events, alerts pushed to subscribed clients
