# GHOSTNET Release Checklist

Use this checklist before deploying a beta or release.

## Definition of Done

### Routes (Frontend)

- [ ] `/` — Landing loads
- [ ] `/login` — Login form works
- [ ] `/signup` — Signup (invite-only) works
- [ ] `/forgot-password` — Request reset works
- [ ] `/reset-password` — Reset with token works
- [ ] `/demo` — Demo mode loads
- [ ] `/demo/dashboard` — Demo dashboard
- [ ] `/demo/sessions` — Demo sessions list
- [ ] `/demo/sessions/:id` — Demo session detail
- [ ] `/demo/alerts` — Demo alerts
- [ ] `/onboarding/*` — Onboarding wizard (protected)
- [ ] `/app/dashboard` — Dashboard (protected)
- [ ] `/app/sessions` — Sessions list (protected)
- [ ] `/app/sessions/:id` — Session detail (protected)
- [ ] `/app/alerts` — Alerts (protected)
- [ ] `/app/reports` — Reports (protected)
- [ ] `/app/config/*` — Config tabs (protected)
- [ ] `/app/team` — Team members + invites (protected)
- [ ] 404 / catch-all — Redirects to `/`

### Endpoints (Backend)

- [ ] `GET /health` — Returns 200
- [ ] `GET /ready` — DB + Redis checks
- [ ] `POST /auth/login` — Login
- [ ] `POST /auth/signup` — Signup with invite
- [ ] `POST /auth/refresh` — Token refresh
- [ ] `GET /auth/me` — Current user
- [ ] `GET /auth/reset-password/validate` — Validate reset token
- [ ] `GET /api/sessions` — List sessions
- [ ] `GET /api/sessions/:id` — Session detail
- [ ] `GET /api/events` — List events
- [ ] `GET /api/alerts` — List alerts
- [ ] `GET /api/config` — Config
- [ ] `GET /api/team/members` — Team members
- [ ] `GET /api/team/invites` — Pending invites

### Build & CI

- [ ] `pnpm install` — No errors
- [ ] `pnpm run lint` — Passes
- [ ] `pnpm run typecheck` — Passes
- [ ] `pnpm run build` — All packages build
- [ ] CI pipeline green

### Environment

- [ ] `.env.example` — All required vars documented
- [ ] Env validation at API startup — Fails fast on missing vars
- [ ] Production: `JWT_SECRET` and `JWT_REFRESH_SECRET` ≥ 32 chars

### Health & Readiness

- [ ] `GET /health` — 200, `{ status: 'ok' }`
- [ ] `GET /ready` — 200 when DB + Redis OK, 503 when degraded

### Security

- [ ] Security headers (CSP, X-Frame-Options, etc.)
- [ ] CORS restricted in production
- [ ] Rate limiting on auth + AI endpoints
- [ ] Input validation on all API endpoints
- [ ] No raw stack traces to client in prod
- [ ] Secrets not logged

### Logging

- [ ] Structured server logs
- [ ] Error capture for client-side failures (optional)

---

## Step Progress

| Step | Status | Notes |
|------|--------|-------|
| 0. Discovery | ✅ | docs/ARCHITECTURE_MAP.md |
| 1. Local run | ✅ | Env validation, /health, /ready, Makefile |
| 2. Page QA | ✅ | ErrorBoundary, NotFound, ErrorState, useAlerts fix |
| 3. Tests | ✅ | Vitest unit tests (health, env) |
| 4. CI | ✅ | GitHub Actions: lint, typecheck, build, test |
| 5. Security | ✅ | @fastify/helmet, docs/SECURITY_NOTES.md |
| 6. Deployment | ✅ | docker-compose.prod.yml |
| 7. Docs | ✅ | HOW_TO_DEPLOY, TESTING_GUIDE |
