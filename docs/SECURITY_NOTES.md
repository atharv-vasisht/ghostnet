# GHOSTNET Security Notes

## Threat Model (Beta)

GHOSTNET is an enterprise deception platform. Primary threats:

1. **External attackers** — AI agents probing deception surface; mitigated by isolation, rate limiting, and monitoring.
2. **Credential theft** — Mitigated by bcrypt, JWT with short expiry, httpOnly refresh cookies.
3. **Data exfiltration** — Org-scoped data; RBAC limits access.
4. **Injection** — Zod validation on all API inputs; parameterized queries via Prisma.

## Implemented Controls

### Authentication & Authorization

- JWT access tokens (15 min expiry)
- Refresh tokens in httpOnly cookies (30 days)
- Bcrypt password hashing (12 rounds)
- Invite-only signup
- Role-based access (ADMIN, ANALYST, VIEWER)

### API Security

- **Rate limiting**: 100 req/min global (configurable)
- **CORS**: Restricted to `APP_URL` in production
- **Security headers** (via @fastify/helmet):
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY (or SAMEORIGIN)
  - Referrer-Policy
  - Content-Security-Policy (in production)
- **Input validation**: Zod schemas on all request bodies/params
- **Error handling**: No stack traces to client in production

### Secrets Management

- `JWT_SECRET` and `JWT_REFRESH_SECRET` must be ≥32 chars in production
- Secrets never logged (ensure logger redaction for `password`, `token`, etc.)
- `.env` excluded from version control

### Deployment

- Use HTTPS in production
- Set `NODE_ENV=production`
- Restrict database and Redis network access
- Run dependency audit: `pnpm audit`

## Recommendations

1. **Rate limit auth endpoints** — Consider stricter limits on `/auth/login`, `/auth/signup`.
2. **Audit logging** — Log auth events (login, logout, role changes) for compliance.
3. **CSP tuning** — Adjust Content-Security-Policy for embedded dashboards if needed.
4. **Secrets rotation** — Plan for JWT secret rotation; invalidates all sessions.

## Reporting

Report security issues privately to the maintainers. Do not open public issues for vulnerabilities.
