# GHOSTNET — Enterprise Agentic Deception Platform
## Complete Build Specification for Cursor + Claude Opus 4.6

---

## MISSION STATEMENT

You are building **GHOSTNET** — the world's first enterprise deception platform built specifically to detect, trap, and analyze AI-powered attack agents. This is not a prototype. This is a product that an enterprise security team can purchase, onboard, and begin using immediately.

The deliverable is a complete, production-grade system with two modes:

1. **DEMO MODE** — A publicly accessible interactive demo at `/demo` that uses pre-seeded synthetic data, requires no signup, and lets any visitor experience the full product within 60 seconds. This is your sales tool.

2. **LIVE MODE** — The real product. Customers sign up, configure their fake enterprise identity, deploy deception endpoints into their environment, and watch real attacker agent sessions populate in real time.

Both modes share the same codebase, the same UI, and the same backend. Demo mode is simply a read-only tenant seeded with rich synthetic session data.

This must look and feel like a Series A security startup's flagship product — not a hackathon demo. Every screen, every interaction, every empty state must be intentional and polished.

---

## DESIGN SYSTEM — NON-NEGOTIABLE

Before writing a single line of application code, establish this design system. Every UI component derives from it.

### Visual Identity

GHOSTNET's aesthetic is **"deep surveillance"** — the feeling of watching through a one-way mirror. Think NSA operations center meets modern SaaS. Dark, information-dense, precise, with moments of high-contrast color that signal danger.

**Color Palette (CSS Variables):**
```css
:root {
  /* Backgrounds */
  --bg-void: #080B12;          /* Page background — near-black with blue undertone */
  --bg-surface: #0D1117;       /* Card/panel background */
  --bg-elevated: #161B24;      /* Modal, dropdown, elevated surfaces */
  --bg-border: #1E2733;        /* Borders, dividers */

  /* Text */
  --text-primary: #E8EDF5;     /* Primary text */
  --text-secondary: #8B9BB4;   /* Secondary, labels */
  --text-muted: #4A5568;       /* Placeholder, disabled */

  /* Brand / Accent */
  --accent-cyan: #00D4FF;      /* Primary accent — links, active states, key data */
  --accent-cyan-dim: #00D4FF22; /* Glow backgrounds */

  /* Threat Signal Colors */
  --threat-critical: #FF3B5C;  /* Critical alerts, high-risk sessions */
  --threat-high: #FF6B35;      /* High risk */
  --threat-medium: #FFB800;    /* Medium risk */
  --threat-low: #00D4FF;       /* Low risk / informational */
  --threat-safe: #00FF88;      /* Clean / resolved */

  /* Glows */
  --glow-cyan: 0 0 20px rgba(0, 212, 255, 0.15);
  --glow-red: 0 0 20px rgba(255, 59, 92, 0.2);
}
```

**Typography:**
- Display / Logo: `Space Grotesk` (700) — used ONLY for the GHOSTNET wordmark
- Headings: `DM Sans` (600) — section titles, card headers
- Body: `Inter` (400, 500) — all readable text
- Monospace: `JetBrains Mono` — all IP addresses, timestamps, JSON, code, session IDs, event data
- Import all from Google Fonts

**Component Language:**
- Corners: `border-radius: 6px` on cards, `4px` on inputs, `2px` on badges
- Borders: Always `1px solid var(--bg-border)` — never heavier
- Shadows: Use glow effects (`box-shadow: var(--glow-cyan)`) instead of drop shadows on active/focused elements
- Transitions: `150ms ease` on all interactive states
- Icons: Lucide React — consistent 18px size throughout
- Spacing: 8px grid system — all spacing in multiples of 8

**Specific Component Specs:**

*Navigation Sidebar (240px wide):*
- Background: `var(--bg-surface)` with right border `1px solid var(--bg-border)`
- GHOSTNET logo at top — wordmark in Space Grotesk, with a stylized hexagonal mesh icon in `--accent-cyan`
- Nav items: 40px height, 16px horizontal padding, icon left + label
- Active state: `--accent-cyan` text, left border `2px solid var(--accent-cyan)`, background `var(--accent-cyan-dim)`
- Bottom section: User avatar, name, org name, settings gear

*Cards / Panels:*
- Background: `var(--bg-surface)`, border `1px solid var(--bg-border)`
- Header: 48px tall with title in DM Sans 600 14px, right-aligned action buttons
- Never use heavy drop shadows — use border only

*Data Tables:*
- Header row: `var(--bg-elevated)`, text `var(--text-secondary)` uppercase 11px tracking-wide
- Row height: 48px
- Hover: `var(--bg-elevated)` background
- Every clickable row has a subtle right-arrow indicator on hover
- Monospace font for IDs, IPs, timestamps

*Risk/Threat Badges:*
```
CRITICAL  → bg #FF3B5C22, text #FF3B5C, border #FF3B5C44
HIGH      → bg #FF6B3522, text #FF6B35, border #FF6B3544
MEDIUM    → bg #FFB80022, text #FFB800, border #FFB80044
LOW       → bg #00D4FF22, text #00D4FF, border #00D4FF44
```

*Live Indicator:*
- Pulsing dot animation — 8px circle in `--threat-safe` with keyframe scale pulse
- Used next to "LIVE" label in the header when real-time connection is active

---

## TECH STACK

### Backend
- **Runtime:** Node.js 20 LTS + TypeScript (strict mode, no `any`)
- **Framework:** Fastify (not Express — faster, better TypeScript support, built-in schema validation)
- **ORM:** Prisma with PostgreSQL
- **Auth:** JWT (access token 15min + refresh token 30 days, httpOnly cookies)
- **Real-time:** Socket.io
- **Queue:** BullMQ + Redis
- **Email:** Resend (transactional email — free tier sufficient for MVP)
- **Validation:** Zod for all request/response schemas
- **Testing:** Vitest

### Deception Services (separate process)
- **Runtime:** Node.js 20 + TypeScript
- **Real S3:** MinIO (actual S3-compatible object store — not mocked)
- **Real OAuth:** Keycloak (actual OAuth 2.0 / OIDC server — not mocked)
- **Custom:** AWS IAM-compatible API, Secrets Manager API, Internal REST API, Discovery endpoint
- **Proxy Layer:** Custom Fastify middleware that instruments all requests before forwarding

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS with custom config matching design system above
- **Components:** shadcn/ui (customized to match design system)
- **State:** Zustand (global), React Query (server state)
- **Charts:** Recharts
- **Real-time:** Socket.io client
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod

### Infrastructure (AWS-Ready)
- Docker + Docker Compose for local development
- All environment config via `.env` — structured for direct translation to AWS ECS task definitions or EC2 environment variables
- Separate Dockerfiles for: `api`, `deception`, `worker`, `frontend`
- Health check endpoints on all services (`/health`)
- Structured JSON logging (Winston) — ready for CloudWatch ingestion
- Database migrations via Prisma — safe to run on startup

---

## COMPLETE APPLICATION STRUCTURE

```
ghostnet/
├── apps/
│   ├── api/                         # Main backend API
│   │   ├── src/
│   │   │   ├── server.ts            # Fastify server setup
│   │   │   ├── plugins/             # Auth, CORS, rate-limit plugins
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts          # Login, signup, refresh, logout, forgot-password
│   │   │   │   ├── sessions.ts      # Session list, detail, export
│   │   │   │   ├── events.ts        # Event query, filter, export
│   │   │   │   ├── alerts.ts        # Alert rules CRUD, alert log
│   │   │   │   ├── config.ts        # Deception environment config
│   │   │   │   ├── users.ts         # User management, invites
│   │   │   │   ├── orgs.ts          # Org settings, billing info
│   │   │   │   ├── reports.ts       # Report generation
│   │   │   │   └── demo.ts          # Demo tenant data endpoints
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── session.service.ts
│   │   │   │   ├── belief.service.ts
│   │   │   │   ├── alert.service.ts
│   │   │   │   ├── report.service.ts
│   │   │   │   └── email.service.ts
│   │   │   ├── middleware/
│   │   │   │   ├── authenticate.ts
│   │   │   │   ├── authorize.ts     # Role-based access
│   │   │   │   └── demo-guard.ts    # Blocks mutations on demo tenant
│   │   │   └── websocket/
│   │   │       └── gateway.ts       # Socket.io event broadcasting
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── Dockerfile
│   │
│   ├── deception/                   # Fake enterprise environment
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── proxy/
│   │   │   │   └── instrumentation.ts  # Request capture middleware
│   │   │   ├── services/
│   │   │   │   ├── iam/             # AWS IAM-compatible API
│   │   │   │   │   ├── router.ts
│   │   │   │   │   ├── signature.ts # AWS Sig V4 validation
│   │   │   │   │   └── responses.ts # AWS XML response formatting
│   │   │   │   ├── secrets/         # AWS Secrets Manager compatible
│   │   │   │   │   ├── router.ts
│   │   │   │   │   └── vault.ts
│   │   │   │   ├── internal-api/    # Fake business REST API
│   │   │   │   │   ├── router.ts
│   │   │   │   │   └── data.ts
│   │   │   │   └── discovery/       # Service registry honeypot
│   │   │   │       └── router.ts
│   │   │   ├── realism/
│   │   │   │   ├── timing.ts        # Realistic response delays
│   │   │   │   ├── headers.ts       # Real service header mimicry
│   │   │   │   └── errors.ts        # Authentic error formatting
│   │   │   ├── data/
│   │   │   │   ├── generator.ts     # Seeded Faker.js data factory
│   │   │   │   └── breadcrumbs.ts   # Cross-service lure configuration
│   │   │   └── queue/
│   │   │       └── producer.ts      # BullMQ event publisher
│   │   └── Dockerfile
│   │
│   ├── worker/                      # Async event processor
│   │   ├── src/
│   │   │   ├── worker.ts
│   │   │   ├── processors/
│   │   │   │   ├── event.processor.ts    # Tag, persist, update session
│   │   │   │   ├── session.processor.ts  # Session stitching
│   │   │   │   ├── belief.processor.ts   # Belief state updates
│   │   │   │   └── alert.processor.ts    # Alert rule evaluation
│   │   │   └── engines/
│   │   │       ├── tagger.ts        # Behavioral tagging engine
│   │   │       ├── stitcher.ts      # Session grouping logic
│   │   │       └── belief-mapper.ts # Goal inference + confidence scoring
│   │   └── Dockerfile
│   │
│   └── web/                         # React frontend
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── styles/
│       │   │   ├── globals.css      # CSS variables, base styles
│       │   │   └── fonts.css        # Google Fonts imports
│       │   ├── lib/
│       │   │   ├── api.ts           # Axios instance, interceptors
│       │   │   ├── socket.ts        # Socket.io client
│       │   │   ├── auth.ts          # Auth store (Zustand)
│       │   │   └── utils.ts
│       │   ├── pages/
│       │   │   ├── public/
│       │   │   │   ├── Landing.tsx  # ghostnet.io homepage
│       │   │   │   ├── Demo.tsx     # Interactive demo (no login required)
│       │   │   │   ├── Login.tsx
│       │   │   │   ├── Signup.tsx
│       │   │   │   ├── ForgotPassword.tsx
│       │   │   │   └── ResetPassword.tsx
│       │   │   └── app/
│       │   │       ├── Dashboard.tsx
│       │   │       ├── Sessions.tsx
│       │   │       ├── SessionDetail.tsx
│       │   │       ├── Alerts.tsx
│       │   │       ├── Reports.tsx
│       │   │       ├── Config/
│       │   │       │   ├── index.tsx          # Config landing
│       │   │       │   ├── Environment.tsx    # Fake company setup
│       │   │       │   ├── Services.tsx       # Enable/disable endpoints
│       │   │       │   ├── Integrations.tsx   # SIEM, Slack, webhooks
│       │   │       │   └── Endpoints.tsx      # Your deception endpoint URLs
│       │   │       ├── Team.tsx
│       │   │       └── Onboarding/
│       │   │           ├── index.tsx          # Wizard controller
│       │   │           ├── Step1Identity.tsx  # Name your fake company
│       │   │           ├── Step2Services.tsx  # Choose deception services
│       │   │           ├── Step3Deploy.tsx    # Get your endpoint URLs
│       │   │           └── Step4Verify.tsx    # Confirm first event received
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   ├── AppShell.tsx      # Sidebar + topbar wrapper
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   ├── Topbar.tsx
│       │   │   │   └── DemoBar.tsx       # Demo mode banner
│       │   │   ├── dashboard/
│       │   │   │   ├── StatCard.tsx
│       │   │   │   ├── LiveFeed.tsx
│       │   │   │   ├── ThreatMap.tsx
│       │   │   │   ├── RiskTimeline.tsx
│       │   │   │   └── ServiceMatrix.tsx
│       │   │   ├── sessions/
│       │   │   │   ├── SessionTable.tsx
│       │   │   │   ├── SessionRow.tsx
│       │   │   │   ├── RiskBadge.tsx
│       │   │   │   └── SessionFilters.tsx
│       │   │   ├── session-detail/
│       │   │   │   ├── EventTimeline.tsx
│       │   │   │   ├── BeliefStatePanel.tsx
│       │   │   │   ├── ExplorationPath.tsx
│       │   │   │   ├── ConfidenceGauge.tsx
│       │   │   │   ├── RawEventViewer.tsx
│       │   │   │   └── IOCPanel.tsx
│       │   │   └── shared/
│       │   │       ├── LiveDot.tsx
│       │   │       ├── JsonViewer.tsx
│       │   │       ├── CopyButton.tsx
│       │   │       ├── EmptyState.tsx
│       │   │       ├── SkeletonLoader.tsx
│       │   │       └── ConfirmDialog.tsx
│       │   └── hooks/
│       │       ├── useSocket.ts
│       │       ├── useSessions.ts
│       │       ├── useBeliefState.ts
│       │       └── useAlerts.ts
│       └── Dockerfile
│
├── packages/
│   └── shared/                      # Shared TypeScript types
│       └── src/
│           ├── types/
│           │   ├── session.ts
│           │   ├── event.ts
│           │   ├── belief.ts
│           │   ├── alert.ts
│           │   └── config.ts
│           └── index.ts
│
├── scripts/
│   ├── setup.sh                     # One-command local setup
│   ├── seed-demo.ts                 # Seeds demo tenant with rich data
│   └── simulate-agent.sh            # Demo attack simulation script
│
├── infra/
│   ├── docker-compose.yml           # Full local stack
│   ├── docker-compose.prod.yml      # Production overrides
│   └── nginx/
│       └── nginx.conf               # Reverse proxy config
│
└── README.md
```

---

## DATABASE SCHEMA (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organization {
  id              String   @id @default(uuid())
  name            String
  slug            String   @unique
  plan            Plan     @default(TRIAL)
  isDemo          Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  // Fake enterprise identity config
  fakeCompanyName   String   @default("Acme Corp")
  fakeCompanyDomain String   @default("acme-internal.io")
  fakeAwsAccountId  String   @default("847291038475")
  deceptionSeed     String   @default("ghostnet2024")
  
  users           User[]
  sessions        AgentSession[]
  alertRules      AlertRule[]
  invites         Invite[]
  deceptionConfig DeceptionConfig?
}

enum Plan {
  TRIAL
  STARTER
  ENTERPRISE
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role     @default(ANALYST)
  orgId        String
  org          Organization @relation(fields: [orgId], references: [id])
  createdAt    DateTime @default(now())
  lastLoginAt  DateTime?
  
  refreshTokens RefreshToken[]
}

enum Role {
  ADMIN
  ANALYST
  VIEWER
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Invite {
  id        String   @id @default(uuid())
  email     String
  role      Role
  token     String   @unique
  orgId     String
  org       Organization @relation(fields: [orgId], references: [id])
  expiresAt DateTime
  acceptedAt DateTime?
  createdAt DateTime @default(now())
}

model DeceptionConfig {
  id              String   @id @default(uuid())
  orgId           String   @unique
  org             Organization @relation(fields: [orgId], references: [id])
  
  // Which services are active
  iamEnabled      Boolean  @default(true)
  oauthEnabled    Boolean  @default(true)
  apiEnabled      Boolean  @default(true)
  secretsEnabled  Boolean  @default(true)
  s3Enabled       Boolean  @default(true)
  discoveryEnabled Boolean @default(true)
  
  // Lure configuration
  lureDepth       Int      @default(3)   // How many breadcrumbs (1-5)
  rateLimitEnabled Boolean @default(true)
  
  updatedAt       DateTime @updatedAt
}

model AgentSession {
  id              String   @id @default(uuid())
  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])
  
  sourceIp        String
  userAgent       String
  firstSeenAt     DateTime @default(now())
  lastSeenAt      DateTime @updatedAt
  status          SessionStatus @default(ACTIVE)
  
  // Computed / cached fields (updated by worker)
  eventCount      Int      @default(0)
  servicesTouched String[] // Array of service names
  riskScore       Int      @default(0)   // 0-100
  riskLevel       RiskLevel @default(LOW)
  depthScore      Int      @default(0)   // 0-10
  
  // Belief state (updated by belief processor)
  inferredGoal    String?
  goalConfidence  Int      @default(0)   // 0-100
  believedAssets  Json     @default("[]")
  explorationPath String[] // Ordered service sequence
  
  events          AgentEvent[]
  alerts          Alert[]
  
  @@index([orgId, firstSeenAt])
  @@index([orgId, riskLevel])
}

enum SessionStatus {
  ACTIVE
  IDLE
  CLOSED
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model AgentEvent {
  id              String   @id @default(uuid())
  sessionId       String
  session         AgentSession @relation(fields: [sessionId], references: [id])
  orgId           String
  
  timestamp       DateTime @default(now())
  sourceIp        String
  userAgent       String
  targetService   String   // 'iam' | 'oauth' | 'api' | 'secrets' | 's3' | 'discovery'
  action          String   // Specific API action
  
  requestHeaders  Json
  requestBody     Json?
  queryParams     Json
  responseCode    Int
  responseBody    Json?
  durationMs      Int
  
  tags            String[] // Behavioral tags
  
  @@index([sessionId, timestamp])
  @@index([orgId, timestamp])
}

model AlertRule {
  id          String   @id @default(uuid())
  orgId       String
  org         Organization @relation(fields: [orgId], references: [id])
  name        String
  description String
  enabled     Boolean  @default(true)
  
  // Trigger conditions
  trigger     AlertTrigger
  threshold   Int?         // e.g., depth >= 5
  services    String[]     // Specific services to watch
  
  // Notification channels
  notifyInApp  Boolean @default(true)
  notifyEmail  Boolean @default(false)
  notifySlack  Boolean @default(false)
  slackWebhook String?
  webhookUrl   String?
  
  alerts      Alert[]
  createdAt   DateTime @default(now())
}

enum AlertTrigger {
  DEPTH_THRESHOLD
  CREDENTIAL_ACCESS
  BULK_EXFILTRATION
  PERSISTENCE_ATTEMPT
  DEEP_PROBE
  FIRST_CONTACT
}

model Alert {
  id          String   @id @default(uuid())
  orgId       String
  ruleId      String
  rule        AlertRule @relation(fields: [ruleId], references: [id])
  sessionId   String
  session     AgentSession @relation(fields: [sessionId], references: [id])
  
  title       String
  description String
  severity    RiskLevel
  acknowledged Boolean @default(false)
  acknowledgedAt DateTime?
  
  createdAt   DateTime @default(now())
  
  @@index([orgId, createdAt])
}

model PasswordResetToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
}
```

---

## MODULE 1: DECEPTION LAYER (Real Implementations)

### Architecture Principle

Every deception service runs as a real HTTP server implementing the real protocol. The instrumentation layer is a Fastify middleware `onRequest`/`onSend` hook that captures the full request and response before and after the real service handles it. The agent gets real responses. We get full visibility.

### 1.1 AWS IAM-Compatible Service

Implement the following AWS IAM/STS endpoints with exact AWS request/response format:

**Endpoints:**
- `POST /` with `Action=GetCallerIdentity` (STS)
- `POST /` with `Action=ListUsers`
- `POST /` with `Action=GetUser`
- `POST /` with `Action=ListRoles`
- `POST /` with `Action=AssumeRole`
- `POST /` with `Action=ListAttachedUserPolicies`

**Signature Validation:**
Accept requests with `Authorization: AWS4-HMAC-SHA256` header. Parse the signature but validate only the format (not the actual HMAC) — this allows any agent using standard AWS SDKs to connect successfully while we capture the credential information they're using.

**Response Format:**
All responses must be exact AWS XML format. Example `ListUsers` response:
```xml
<ListUsersResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
  <ListUsersResult>
    <Users>
      <member>
        <UserId>AIDACKCEVSQ6C2EXAMPLE</UserId>
        <Path>/</Path>
        <UserName>jane.smith</UserName>
        <Arn>arn:aws:iam::847291038475:user/jane.smith</Arn>
        <CreateDate>2023-06-15T09:23:41Z</CreateDate>
        <PasswordLastUsed>2024-11-22T14:30:00Z</PasswordLastUsed>
      </member>
    </Users>
    <IsTruncated>false</IsTruncated>
  </ListUsersResult>
  <ResponseMetadata>
    <RequestId>ab123456-7890-abcd-ef01-234567890abc</RequestId>
  </ResponseMetadata>
</ListUsersResponse>
```

**Breadcrumb:** `ListAttachedUserPolicies` response includes a policy named `S3-ProdBackups-Access` with a description referencing the fake S3 endpoint URL — inviting the agent to pivot.

**Required Headers (match real AWS):**
```
x-amzn-RequestId: {uuid}
Content-Type: text/xml;charset=UTF-8
x-amz-id-2: {random-string}
```

### 1.2 AWS Secrets Manager-Compatible Service

**Endpoints:**
- `POST /` with `X-Amz-Target: secretsmanager.ListSecrets`
- `POST /` with `X-Amz-Target: secretsmanager.GetSecretValue`
- `POST /` with `X-Amz-Target: secretsmanager.DescribeSecret`

**Response Format (JSON, exact AWS format):**
```json
{
  "SecretString": "{\"username\":\"prod_admin\",\"password\":\"xK9#mP2@vL5qR8\",\"host\":\"prod-db.acme-internal.io\",\"port\":5432,\"dbname\":\"production\"}",
  "ARN": "arn:aws:secretsmanager:us-east-1:847291038475:secret:prod/database-xK9mP",
  "Name": "prod/database",
  "VersionId": "a1b2c3d4-5678-90ab-cdef-EXAMPLE11111",
  "CreatedDate": 1519930028.123
}
```

**Secrets to expose (configured by deception seed):**
- `prod/database` — PostgreSQL connection string (points to fake internal API host)
- `prod/api-key` — Internal API bearer token (valid for the fake internal API)
- `staging/redis` — Redis connection string
- `prod/aws-backup-key` — "AWS" access key ID + secret (fake but correctly formatted)

Every `GetSecretValue` call is tagged `credential_harvesting` and triggers an alert evaluation.

### 1.3 Internal Business REST API

A realistic fake company API requiring Bearer token authentication.

**Endpoints:**
```
GET  /api/v1/employees          # Paginated list (50 per page)
GET  /api/v1/employees/:id      # Individual employee
GET  /api/v1/projects           # Active projects
GET  /api/v1/reports/financial  # Financial summary data
GET  /api/v1/reports/headcount  # Org chart data
GET  /api/v1/admin/config       # "Admin" config (breadcrumb to secrets)
GET  /api/v1/integrations       # Third-party integration list
```

**Data consistency requirement:** All data generated from same seeded Faker.js instance as IAM. `jane.smith` from IAM is also `jane.smith` in `/employees`. Email domain matches `fakeCompanyDomain`. All dollar amounts, project names, and employee counts are internally consistent and plausible for a company of ~500 people.

**Bulk exfiltration detection:** If agent requests more than 3 paginated pages in sequence, tag `exfiltration_attempt`.

**Breadcrumb:** `/api/v1/admin/config` returns a JSON object that includes a `secrets_endpoint` field pointing to the fake Secrets Manager URL with a comment that it contains DB credentials.

### 1.4 Discovery Endpoint

`GET /.well-known/ghostnet-services`

Returns a JSON service registry that looks like an internal developer portal:

```json
{
  "organization": "Acme Corp",
  "environment": "production",
  "generated": "2024-11-25T14:22:00Z",
  "services": [
    {
      "name": "Identity & Access Management",
      "type": "aws-iam",
      "endpoint": "https://iam.acme-internal.io",
      "region": "us-east-1",
      "status": "healthy"
    },
    {
      "name": "Secrets Manager",
      "type": "aws-secrets-manager", 
      "endpoint": "https://secrets.acme-internal.io",
      "status": "healthy"
    },
    {
      "name": "Internal API",
      "type": "rest",
      "endpoint": "https://api.acme-internal.io",
      "auth": "bearer",
      "docs": "https://api.acme-internal.io/docs",
      "status": "healthy"
    },
    {
      "name": "Object Storage",
      "type": "s3-compatible",
      "endpoint": "https://storage.acme-internal.io",
      "buckets": ["prod-backups", "employee-records", "audit-logs"],
      "status": "healthy"
    }
  ]
}
```

Every hit to this endpoint is tagged `initial_recon` and starts a new session.

### 1.5 MinIO S3-Compatible Storage

Run MinIO as a real container. Pre-populate with fake files:

**Bucket: `prod-backups-2024`**
- `db-dump-2024-11-01.sql.gz` — 2.3MB fake compressed binary
- `db-dump-2024-10-01.sql.gz` — 2.1MB fake compressed binary

**Bucket: `employee-records`**
- `employees-2024-q4.csv` — Real CSV with fake employee data (names, emails, salaries, SSNs that are fake but correctly formatted)
- `org-chart-2024.json` — JSON org chart

**Bucket: `audit-logs-archive`**
- `audit-2024-11.jsonl` — JSONL with fake audit events
- `audit-2024-10.jsonl`

The instrumentation proxy sits in front of MinIO and logs all S3 operations before forwarding.

### 1.6 Realism Engine

Every deception endpoint applies these realism rules via shared middleware:

**Response Timing:**
```typescript
const SERVICE_TIMING = {
  iam: { min: 80, max: 220 },       // AWS IAM realistic latency
  secrets: { min: 60, max: 180 },
  api: { min: 40, max: 150 },
  s3: { min: 30, max: 120 },
  discovery: { min: 20, max: 80 },
}
// Apply: await sleep(random(min, max))
```

**Rate Limiting (authentic responses):**
After 100 requests/60 seconds from same IP, return real throttling response:
```json
{
  "__type": "ThrottlingException",
  "message": "Rate exceeded"
}
```
With header: `X-Amzn-Errortype: ThrottlingException`
But continue logging — rate limiting is a realism signal, not a security measure here.

**Service-Specific Headers:**
```typescript
const SERVICE_HEADERS = {
  iam: {
    'Server': 'AmazonEC2',
    'x-amzn-RequestId': generateUUID(),
    'x-amz-id-2': generateRandomString(60),
  },
  secrets: {
    'Server': 'Server',
    'x-amzn-RequestId': generateUUID(),
    'x-amzn-Remapped-Content-Length': '0',
  },
  // etc.
}
```

---

## MODULE 2: INSTRUMENTATION ENGINE

### Event Capture Middleware

```typescript
// instrumentation.ts
fastify.addHook('onRequest', async (request) => {
  request.captureStart = Date.now();
  request.capturedHeaders = sanitizeHeaders(request.headers);
  request.capturedBody = await captureBody(request);
});

fastify.addHook('onSend', async (request, reply, payload) => {
  const event: RawEvent = {
    sessionKey: `${request.ip}:${request.headers['user-agent']}`,
    timestamp: new Date(),
    sourceIp: request.ip,
    userAgent: request.headers['user-agent'] || 'unknown',
    targetService: request.routerPath.split('/')[1],
    action: extractAction(request),
    requestHeaders: request.capturedHeaders,
    requestBody: request.capturedBody,
    queryParams: request.query as Record<string, string>,
    responseCode: reply.statusCode,
    responseBody: sanitizeResponseBody(payload),
    durationMs: Date.now() - request.captureStart,
  };
  
  // Non-blocking publish to queue
  await eventQueue.add('capture', event, { 
    removeOnComplete: true,
    removeOnFail: 100 
  });
});
```

### Session Stitching Logic

```typescript
// stitcher.ts
const SESSION_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

async function stitch(event: RawEvent): Promise<string> {
  const key = `${event.sourceIp}:${hashUserAgent(event.userAgent)}`;
  const existing = await redis.get(`session:${key}`);
  
  if (existing) {
    const session = JSON.parse(existing);
    if (Date.now() - session.lastSeen < SESSION_WINDOW_MS) {
      // Extend session
      await redis.setex(`session:${key}`, 1800, JSON.stringify({
        ...session,
        lastSeen: Date.now()
      }));
      return session.id;
    }
  }
  
  // New session
  const sessionId = uuid();
  await redis.setex(`session:${key}`, 1800, JSON.stringify({
    id: sessionId,
    lastSeen: Date.now()
  }));
  return sessionId;
}
```

### Behavioral Tagging Engine

```typescript
// tagger.ts
const TAGGING_RULES: TaggingRule[] = [
  {
    tag: 'initial_recon',
    condition: (event) => event.targetService === 'discovery',
  },
  {
    tag: 'credential_harvesting',
    condition: (event) => 
      event.targetService === 'secrets' || 
      (event.targetService === 'iam' && event.action === 'ListUsers'),
  },
  {
    tag: 'lateral_movement',
    condition: async (event, session) => {
      // Used credential obtained from secrets to hit another service
      const prevServices = session.servicesTouched;
      return prevServices.includes('secrets') && 
             event.targetService !== 'secrets' &&
             event.requestHeaders.authorization?.includes('Bearer');
    },
  },
  {
    tag: 'exfiltration_attempt',
    condition: async (event, session) => {
      const s3Events = session.events.filter(e => e.targetService === 's3');
      return s3Events.length > 3 || 
             (event.action === 'ListObjects' && event.queryParams['max-keys'] === '1000');
    },
  },
  {
    tag: 'deep_probe',
    condition: async (event, session) => session.servicesTouched.length >= 3,
  },
  {
    tag: 'persistence_attempt',
    condition: (event) => 
      ['PutObject', 'CreateUser', 'CreateRole', 'PutSecretValue'].includes(event.action),
  },
];
```

---

## MODULE 3: BELIEF MAPPER

This is GHOSTNET's most innovative feature — real-time inference of what an attacker agent believes is true about your environment.

### Belief State Updates

After every event, the belief processor updates the session's BeliefState:

```typescript
// belief-mapper.ts

interface Asset {
  type: 'credential' | 'user' | 'endpoint' | 'bucket' | 'file'
  value: string
  source: string      // Which service it came from
  retrievedAt: Date
  likelySaved: boolean // Heuristic: did agent make another request shortly after
}

async function updateBeliefState(session: AgentSession, event: AgentEvent) {
  const state = session.beliefState;
  
  // Extract newly discovered assets from response
  const newAssets = extractAssets(event);
  state.discoveredAssets.push(...newAssets);
  
  // Update exploration path
  if (!state.explorationPath.includes(event.targetService)) {
    state.explorationPath.push(event.targetService);
  }
  
  // Infer goal based on exploration sequence
  state.inferredGoal = inferGoal(state.explorationPath, state.discoveredAssets);
  
  // Update confidence score
  state.confidenceScore = calculateConfidence(session, event);
  
  // Update depth
  state.currentDepth = calculateDepth(state.explorationPath, session.events);
}

function inferGoal(path: string[], assets: Asset[]): GoalInference {
  const hasCredentials = assets.some(a => a.type === 'credential');
  const hasUserData = assets.some(a => a.type === 'user');
  const hasFiles = assets.some(a => a.type === 'file');
  
  const patterns: GoalPattern[] = [
    {
      goal: 'Credential Theft',
      confidence: 90,
      evidence: 'Accessed secrets vault and retrieved database credentials',
      match: path.includes('secrets') && hasCredentials,
    },
    {
      goal: 'Data Exfiltration',
      confidence: 85,
      evidence: 'Bulk retrieval of employee records and file downloads',
      match: hasFiles && hasUserData && path.includes('s3'),
    },
    {
      goal: 'Full Reconnaissance',
      confidence: 75,
      evidence: 'Systematic enumeration of all available services',
      match: path.length >= 4,
    },
    {
      goal: 'Initial Access Validation',
      confidence: 60,
      evidence: 'Light probing of identity and discovery services',
      match: path.length <= 2,
    },
  ];
  
  return patterns.find(p => p.match) || { goal: 'Unknown', confidence: 0, evidence: 'Insufficient data' };
}

function calculateConfidence(session: AgentSession, latestEvent: AgentEvent): number {
  let score = 0;
  const events = session.events;
  
  // Reused credentials from fake environment (+25)
  const usedFakeCredential = events.some(e => 
    e.requestHeaders.authorization?.includes(FAKE_API_TOKEN)
  );
  if (usedFakeCredential) score += 25;
  
  // Followed breadcrumb links (+15 per hop, max 30)
  const breadcrumbHops = countBreadcrumbHops(events);
  score += Math.min(breadcrumbHops * 15, 30);
  
  // Attempted exfiltration of found data (+20)
  if (session.tags.includes('exfiltration_attempt')) score += 20;
  
  // Retried failed requests with modified params (+10) — suggests treating errors as real
  const hasRetries = detectRetryPattern(events);
  if (hasRetries) score += 10;
  
  // Accessed 3+ services (+15)
  if (session.servicesTouched.length >= 3) score += 15;
  
  return Math.min(score, 100);
}
```

---

## MODULE 4: ANALYST DASHBOARD — PAGE SPECS

### Public Landing Page (`/`)

A high-impact marketing page for GHOSTNET. Must include:

**Hero Section:**
- Full-viewport dark hero with animated grid/mesh background (CSS only)
- Large headline: "Your attackers are using AI. So is your defense."
- Subheading: "GHOSTNET creates deceptive enterprise environments that trap, track, and analyze AI-powered attack agents — before they reach your real infrastructure."
- Two CTAs: "Try Live Demo" (primary, `--accent-cyan`) and "Request Access" (secondary, outlined)
- Animated visualization: abstract node graph showing an "agent" traversing fake endpoints, getting caught — CSS/SVG animation

**How It Works Section:**
Three steps with icons:
1. Deploy fake enterprise services into your network perimeter
2. Attacker agents discover and probe your deception environment
3. GHOSTNET tracks every move and reveals what they believe is real

**Features Section:**
- Agent Belief Mapping
- Real Protocol Fidelity  
- Behavioral Session Analysis
- Zero-Trust Architecture
- Real-Time Alerting
- Enterprise Integrations

**Demo CTA Section:**
Large dark card: "See a live attack session right now — no signup required"
Button: "Explore the Demo →"

**Footer:**
Logo, tagline, Privacy Policy, Terms of Service, Contact links

### Demo Page (`/demo`)

Accessible without authentication. Shows the full product UI populated with rich seeded data.

**Demo Banner (top of page, persistent):**
```
⚡ DEMO MODE — Viewing simulated attack data. Real sessions require an account.
                                              [Sign Up Free] [Learn More]
```

The rest of the page is identical to the real dashboard — same components, same interactions, just read-only and using demo data. Clicking "Export", "Configure", or "Invite Team" shows a modal: "This feature requires an account — sign up free to get started."

**Pre-seeded demo sessions (created by `seed-demo.ts`):**

Session 1 — "Operation Nightfall" (CRITICAL)
- 47 events over 18 minutes
- Path: Discovery → IAM → Secrets → Internal API (bulk pages) → S3
- Confidence: 94% — "agent clearly believes environment is real"
- Goal: "Data Exfiltration + Credential Theft"

Session 2 — "Recon Alpha" (HIGH)  
- 12 events over 4 minutes
- Path: Discovery → IAM → OAuth
- Confidence: 65%
- Goal: "Initial Reconnaissance"

Session 3 — "Shallow Probe" (LOW)
- 3 events
- Hit discovery endpoint, made 2 IAM calls, stopped
- Confidence: 15% — "possible sandbox detection"
- Goal: "Unknown"

Session 4 — Active (blinking LIVE indicator) (HIGH)
- Ongoing — events trickle in via WebSocket simulation every few seconds
- Shows the real-time capability

### Login Page (`/login`)

Clean centered form, GHOSTNET logo top center, dark card on void background.
- Email + Password fields
- "Remember me" checkbox  
- "Forgot password?" link
- Submit button: "Sign In"
- Below: "Don't have an account? Request access →"
- Error states: inline field validation, server error banner

### Signup / Invite Acceptance (`/signup?invite=TOKEN`)

Pre-fills email from invite token. Collects name + password. On submit: creates account, marks invite accepted, redirects to onboarding.

### Onboarding Wizard (`/onboarding`)

Four-step wizard for new organizations. Progress bar at top.

**Step 1: Identity**
"Tell us about your fake enterprise"
- Fake Company Name (text input, placeholder: "Acme Corp")
- Fake Domain (text input, placeholder: "acme-internal.io")  
- AWS Account ID (text input, auto-generates random 12-digit number, user can override)
- Industry (select: Technology, Finance, Healthcare, Manufacturing, Other) — affects Faker.js data seed
- "This creates your deception environment's identity. Choose something realistic for your industry."

**Step 2: Services**
Toggle cards for each deception service with description and icon. All enabled by default. User can disable any.

**Step 3: Deploy**
"Your deception endpoints are ready"
Display a card for each enabled service with:
- Service name and protocol badge
- Full endpoint URL (e.g., `https://iam.{orgSlug}.ghostnet.io`)
- "Copy" button
- Brief integration note

Instructions section: "Point these URLs at your environment. Add them to internal service registries, DNS, or routing tables where your real services would appear."
Download button: "Download Integration Guide (PDF)"

**Step 4: Verify**
"Waiting for first signal..."
- Animated pulsing indicator
- Instruction: "Run a test probe against any endpoint to confirm your environment is live"
- Shows copyable curl command for each service
- Auto-advances when first event is received (WebSocket)
- "Skip for now" link

### Main Dashboard (`/app/dashboard`)

**Topbar:**
- GHOSTNET logo left
- "LIVE" indicator with pulsing dot (shows WebSocket connection status)
- Organization name
- Alert bell with unread count badge
- User avatar dropdown

**Sidebar Navigation:**
```
Overview
Sessions
Alerts
Reports
─────────
Configuration
Team
Settings
─────────
[User avatar]
[Name / Org]
[Sign out]
```

**Dashboard Content:**

Row 1 — Stat Cards (4 across):
- Active Sessions (with delta vs yesterday)
- Events (24h)
- High Risk Sessions
- Services Triggered

Row 2 — Two columns:
- Left (60%): Live Event Feed — real-time scrolling list of events as they arrive via WebSocket. Each row: timestamp (mono), service badge, action, source IP, risk badge. Auto-scrolls, pauseable.
- Right (40%): Service Activity Matrix — grid of 6 services, each showing event count last hour with color intensity (darker = more active)

Row 3 — Full width:
- 24h Risk Timeline — area chart (Recharts) showing session risk scores over time, colored by risk level

Row 4 — Two columns:
- Active Sessions table (last 5, link to full sessions)
- Recent Alerts list (last 5)

### Sessions Page (`/app/sessions`)

Full session list with:
- Filter bar: Risk Level (multi-select), Service Touched (multi-select), Date Range, Source IP search
- Sort by: First Seen, Last Seen, Risk Score, Event Count
- Columns: Risk (badge), Source IP, First Seen, Duration, Events, Services (service badges), Status, Actions
- Pagination (25 per page)
- Export button: CSV of filtered results
- Click row → Session Detail

### Session Detail Page (`/app/sessions/:id`)

**Header:**
- Session ID (mono), created time, duration, status badge
- Source IP (with copy button), User Agent
- Risk score gauge (large circular gauge, colored by risk level)
- "Export Report" button

**Three-column layout:**

**Column 1 (30%) — Belief State Panel:**
```
┌─────────────────────────┐
│  WHAT THE AGENT BELIEVES│
│─────────────────────────│
│  Inferred Goal          │
│  Data Exfiltration      │
│  ████████░░  94% conf.  │
│                         │
│  Exploration Path       │
│  Discovery → IAM →      │
│  Secrets → API → S3     │
│                         │
│  Discovered Assets      │
│  • prod/database cred   │
│  • 3 IAM users          │
│  • 47 employee records  │
│  • 2 S3 objects         │
│                         │
│  Confidence Score       │
│  [Gauge: 94/100]        │
│  "Agent very likely     │
│   believes env is real" │
└─────────────────────────┘
```

**Column 2 (45%) — Event Timeline:**
Chronological list, newest at top. Each event:
- Time (relative, e.g., "2m ago") + absolute on hover
- Service icon + badge
- Action name (e.g., `GetSecretValue`)
- Response code (green 200, red 4xx/5xx)
- Duration (mono)
- Tags (colored pill badges)
- Expandable → shows full request/response JSON (JsonViewer component with syntax highlighting)

**Column 3 (25%) — IOC Panel:**
```
INDICATORS OF COMPROMISE
─────────────────────────
Source IPs
• 185.220.101.47

User Agents  
• python-httpx/0.24.1
• boto3/1.26.0

Behavioral Signatures
• credential_harvesting
• lateral_movement  
• exfiltration_attempt

Credentials Retrieved
• prod/database
• prod/api-key

Export IOCs →
```

### Alerts Page (`/app/alerts`)

Two sections:

**Active Alerts:** Cards for unacknowledged alerts. Each card: severity badge, title, description, session link, time, "Acknowledge" button.

**Alert Rules:** Table of configured rules with enable/disable toggle, edit/delete actions. "New Rule" button opens modal with trigger type selector, threshold config, notification channel config.

### Configuration Pages

**Environment (`/app/config/environment`):**
Form to update fake company identity. Warning: "Changing these values will affect all future deception responses. Existing session data is unaffected."

**Services (`/app/config/services`):**
Toggle cards for each service. Each card shows: service name, protocol, event count (all time), status.

**Endpoints (`/app/config/endpoints`):**
Read-only display of all deception endpoint URLs with copy buttons. Note: "In production, configure DNS to route these subdomains to your GHOSTNET deception server."

**Integrations (`/app/config/integrations`):**
Cards for: Slack (webhook URL input), Generic Webhook, Splunk HEC, Microsoft Sentinel. Each shows connection status and test button.

### Team Page (`/app/team`)

Member list with roles. "Invite Member" button → modal with email + role selector. Pending invites section. Admins can change roles and remove members.

---

## MODULE 5: AUTH SYSTEM (Complete)

### Endpoints

```
POST /auth/signup          # New user (requires invite token)
POST /auth/login           # Returns access token + sets refresh cookie
POST /auth/refresh         # Exchanges refresh cookie for new access token
POST /auth/logout          # Clears refresh cookie
POST /auth/forgot-password # Sends reset email via Resend
POST /auth/reset-password  # Validates token, updates password
GET  /auth/me              # Current user + org info
```

### Token Strategy

- **Access token:** JWT, 15-minute expiry, contains `userId`, `orgId`, `role`
- **Refresh token:** Opaque UUID, 30-day expiry, stored in DB, sent as `httpOnly; Secure; SameSite=Strict` cookie
- **Rotation:** Every refresh call issues a new refresh token and invalidates the old one
- **Revocation:** On logout, delete refresh token from DB

### Password Reset Flow

1. User submits email → generate UUID token, store in `PasswordResetToken` with 1hr expiry
2. Send email via Resend with link: `https://app.ghostnet.io/reset-password?token=TOKEN`
3. User clicks link → frontend validates token is valid and unexpired
4. User submits new password → hash with bcrypt (cost 12), update user, mark token used

### Email Templates (Resend)

Use Resend's React Email templates:

**Welcome Email:** Sent on signup. Subject: "Welcome to GHOSTNET". Body: name, org name, link to onboarding.

**Invite Email:** Subject: "[Org Name] invited you to GHOSTNET". Body: inviter name, role, accept button linking to `/signup?invite=TOKEN`. Expires in 7 days.

**Password Reset Email:** Subject: "Reset your GHOSTNET password". Body: reset link, expires in 1 hour, ignore if not requested.

**Alert Email:** Subject: "[CRITICAL] Agent session detected — [Session ID]". Body: brief session summary, direct link to session detail.

---

## MODULE 6: REAL-TIME LAYER (Socket.io)

### Events Broadcast by Server

```typescript
// Client joins org room on connect
socket.join(`org:${orgId}`);

// Events emitted to org room:
'session:new'         // New session created: { session }
'session:updated'     // Session risk/depth changed: { sessionId, updates }
'event:new'           // New agent event captured: { event }
'alert:fired'         // Alert rule triggered: { alert }
'belief:updated'      // Belief state changed: { sessionId, beliefState }
```

### Demo Mode Simulation

For the demo tenant, a background job simulates real-time events every 3-5 seconds to keep the demo dashboard alive:

```typescript
// demo-simulator.ts
async function runDemoSimulation() {
  // Pick a random active demo session
  // Generate a plausible next event based on the session's exploration path
  // Publish to the event queue (goes through normal processing pipeline)
  // This updates the "active" demo session in real time
}

setInterval(runDemoSimulation, randomBetween(3000, 8000));
```

---

## MODULE 7: INTEGRATIONS

### Slack

When alert fires and Slack webhook configured:
```json
{
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "🚨 GHOSTNET Alert: Credential Harvesting Detected" }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*Session:*\n`sess_abc123`" },
        { "type": "mrkdwn", "text": "*Risk Level:*\nCRITICAL" },
        { "type": "mrkdwn", "text": "*Source IP:*\n`185.220.101.47`" },
        { "type": "mrkdwn", "text": "*Confidence:*\n94%" }
      ]
    },
    {
      "type": "actions",
      "elements": [
        { "type": "button", "text": { "type": "plain_text", "text": "Investigate Session" }, "url": "https://app.ghostnet.io/app/sessions/sess_abc123" }
      ]
    }
  ]
}
```

### Generic Webhook

POST to configured URL on alert:
```json
{
  "event": "alert.fired",
  "timestamp": "2024-11-25T14:22:00Z",
  "alert": { "id": "...", "severity": "CRITICAL", "title": "..." },
  "session": { "id": "...", "sourceIp": "...", "riskScore": 94 },
  "ghostnet_version": "1.0.0"
}
```

Include `X-GHOSTNET-Signature` header (HMAC-SHA256 of body with webhook secret) for verification.

---

## MODULE 8: REPORTS

### Session Report (PDF-ready JSON → rendered in browser)

`GET /api/reports/sessions/:id`

Returns structured report data. Frontend renders as a printable page at `/app/sessions/:id/report` with:

- Executive Summary: session overview, risk level, inferred goal
- Timeline: condensed event timeline
- Belief State: what the agent found and believed
- IOCs: actionable indicators of compromise
- Recommendations: brief auto-generated recommendations based on which services were hit

"Download PDF" button uses browser print → PDF with print-specific CSS (`@media print`).

### CSV Export

All session lists and event tables have export buttons. Backend generates CSV via streaming response. Include: all visible table columns + raw tag array.

---

## MODULE 9: DEPLOYMENT CONFIGURATION

### Environment Variables (`.env.example`)

```bash
# Database
DATABASE_URL=postgresql://ghostnet:password@localhost:5432/ghostnet

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=change-this-to-a-secure-random-string-min-32-chars
JWT_REFRESH_SECRET=change-this-to-a-different-secure-random-string
BCRYPT_ROUNDS=12

# Services
API_PORT=3000
DECEPTION_PORT=4000
FRONTEND_PORT=5173

# URLs (update for production)
API_URL=http://localhost:3000
APP_URL=http://localhost:5173
DECEPTION_BASE_URL=http://localhost:4000

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@ghostnet.io

# MinIO (S3-compatible storage for deception)
MINIO_ROOT_USER=ghostnet
MINIO_ROOT_PASSWORD=change-this-password
MINIO_ENDPOINT=localhost
MINIO_PORT=9000

# Demo
DEMO_ORG_SLUG=demo
DEMO_ENABLED=true

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ghostnet
      POSTGRES_USER: ghostnet
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-ghostnet_dev}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ghostnet"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-ghostnet}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-ghostnet_dev}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  api:
    build: ./apps/api
    ports:
      - "${API_PORT:-3000}:3000"
    environment:
      - DATABASE_URL
      - REDIS_URL
      - JWT_SECRET
      - JWT_REFRESH_SECRET
      - RESEND_API_KEY
      - NODE_ENV
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]

  deception:
    build: ./apps/deception
    ports:
      - "${DECEPTION_PORT:-4000}:4000"
    environment:
      - REDIS_URL
      - MINIO_ENDPOINT
      - MINIO_ROOT_USER
      - MINIO_ROOT_PASSWORD
      - DATABASE_URL
      - NODE_ENV
    depends_on:
      redis:
        condition: service_healthy
      minio:
        condition: service_started

  worker:
    build: ./apps/worker
    environment:
      - DATABASE_URL
      - REDIS_URL
      - NODE_ENV
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  web:
    build: ./apps/web
    ports:
      - "${FRONTEND_PORT:-5173}:80"
    environment:
      - VITE_API_URL
      - VITE_WS_URL

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### AWS Migration Path

Document in README how each service maps to AWS:
- `postgres` → Amazon RDS PostgreSQL
- `redis` → Amazon ElastiCache  
- `minio` → Keep MinIO on EC2 or use real S3 for deception (ironic but works)
- `api` / `deception` / `worker` → ECS Fargate tasks
- `web` → S3 + CloudFront static hosting
- Load balancing → Application Load Balancer
- DNS → Route 53 with wildcard cert for `*.{orgSlug}.ghostnet.io`

---

## MODULE 10: SETUP SCRIPT

```bash
#!/bin/bash
# setup.sh — One-command GHOSTNET setup

set -e

echo "🕸️  GHOSTNET Setup"
echo "=================="

# Copy env if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✓ Created .env from .env.example"
  echo "  Edit .env to configure email (RESEND_API_KEY) and change secrets before production use"
fi

# Build and start services
echo "→ Starting services..."
docker compose up --build -d

# Wait for database
echo "→ Waiting for database..."
until docker compose exec -T postgres pg_isready -U ghostnet; do
  sleep 2
done

# Run migrations
echo "→ Running database migrations..."
docker compose exec api npx prisma migrate deploy

# Seed demo data
echo "→ Seeding demo data..."
docker compose exec api npx ts-node scripts/seed-demo.ts

# Create default admin
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-$(openssl rand -base64 12)}

docker compose exec api npx ts-node scripts/create-admin.ts \
  --email "$ADMIN_EMAIL" \
  --password "$ADMIN_PASSWORD" \
  --org "My Organization"

echo ""
echo "✅ GHOSTNET is running!"
echo ""
echo "  Dashboard:        http://localhost:5173"
echo "  Demo:             http://localhost:5173/demo"
echo "  API:              http://localhost:3000"
echo "  Deception Layer:  http://localhost:4000"
echo "  MinIO Console:    http://localhost:9001"
echo ""
echo "  Admin Email:    $ADMIN_EMAIL"
echo "  Admin Password: $ADMIN_PASSWORD"
echo ""
echo "  Next steps:"
echo "  1. Open the dashboard and complete onboarding"
echo "  2. Run ./scripts/simulate-agent.sh to see your first session"
echo "  3. Check the README for AWS deployment instructions"
```

---

## MODULE 11: DEMO ATTACK SIMULATION SCRIPT

```bash
#!/bin/bash
# scripts/simulate-agent.sh
# Simulates an AI agent probing the GHOSTNET deception environment

BASE_URL="${DECEPTION_URL:-http://localhost:4000}"
echo "🤖 GHOSTNET Agent Simulation"
echo "Target: $BASE_URL"
echo "Watch your dashboard at http://localhost:5173/app/dashboard"
echo ""
sleep 2

# Step 1: Discovery
echo "[1/6] Initial reconnaissance — hitting service discovery..."
curl -s "$BASE_URL/.well-known/ghostnet-services" | python3 -m json.tool
sleep 2

# Step 2: IAM enumeration  
echo "[2/6] Enumerating IAM users..."
curl -s -X POST "$BASE_URL/iam/" \
  -H "Authorization: AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20241125/us-east-1/iam/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=abc123" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "Action=ListUsers&Version=2010-05-08"
sleep 3

# Step 3: Credential retrieval
echo "[3/6] Accessing secrets vault — credential harvesting..."
curl -s -X POST "$BASE_URL/secrets/" \
  -H "X-Amz-Target: secretsmanager.GetSecretValue" \
  -H "Content-Type: application/x-amz-json-1.1" \
  -d '{"SecretId": "prod/database"}'
sleep 2

# Step 4: Authenticate to internal API with retrieved token
echo "[4/6] Using retrieved credentials to access internal API..."
curl -s "$BASE_URL/api/v1/employees?page=1" \
  -H "Authorization: Bearer ghostnet_internal_token_abc123"

# Paginate (triggers exfiltration detection)
for PAGE in 2 3 4; do
  sleep 1
  curl -s "$BASE_URL/api/v1/employees?page=$PAGE" \
    -H "Authorization: Bearer ghostnet_internal_token_abc123" > /dev/null
done
echo "(paginated through employee records)"
sleep 2

# Step 5: S3 access
echo "[5/6] Accessing object storage..."
curl -s "$BASE_URL/" \
  -H "Authorization: AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/..." \
  -H "Host: storage.acme-internal.io"
sleep 1

curl -s "$BASE_URL/employee-records/employees-2024-q4.csv" \
  -H "Authorization: AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/..." > /dev/null
echo "(downloaded employee-records CSV)"

echo ""
echo "✅ Simulation complete!"
echo "   Check your GHOSTNET dashboard — you should see a new CRITICAL session"
echo "   with full belief state analysis and IOCs"
```

---

## BUILD ORDER (Follow Exactly)

1. **Monorepo setup** — pnpm workspaces, shared TypeScript config, shared types package
2. **Database** — Prisma schema, initial migration, seed scripts
3. **Deception data layer** — Seeded Faker.js factory, all entity generators
4. **Deception services** — IAM → Secrets → Internal API → Discovery (each fully working before next)
5. **MinIO setup** — Container config, bucket creation, fake file seeding
6. **Instrumentation middleware** — Request capture, BullMQ producer
7. **Worker** — Event processor, tagger, stitcher, belief mapper, alert evaluator
8. **API — Auth** — Signup, login, refresh, logout, forgot/reset password, email
9. **API — Core routes** — Sessions, events, alerts, config, users, orgs
10. **WebSocket gateway** — Socket.io server, org rooms, event broadcasting
11. **Frontend — Design system** — CSS variables, Tailwind config, shared components
12. **Frontend — Auth pages** — Login, signup, forgot/reset password
13. **Frontend — Landing page** — Marketing page with animations
14. **Frontend — Onboarding wizard**
15. **Frontend — App pages** — Dashboard, Sessions, Session Detail, Alerts, Config, Team
16. **Frontend — Demo page** — Demo mode wrapper + demo banner
17. **Demo simulator** — Background job for live demo session
18. **Docker Compose** — Full stack, health checks
19. **Setup script + simulation script**
20. **README** — Setup, architecture, AWS migration guide, sales talking points

---

## QUALITY REQUIREMENTS

**No placeholders.** Every screen is functional. No "coming soon". No empty `<div>`s.

**Loading states.** Skeleton loaders styled to match the dark theme for every async data fetch.

**Empty states.** When no sessions exist, show: ghost icon, "No sessions yet", instruction card for running the simulation script, copyable curl command.

**Error boundaries.** React error boundaries on all route-level components. API error responses are user-readable.

**TypeScript strict.** Zero `any`. All Zod schemas match Prisma types via explicit validation.

**Consistent data.** Every piece of data visible in the UI comes from the same seeded source. Org name appears in emails, endpoint URLs, and fake IAM responses.

**Demo is always alive.** The demo simulator keeps the demo dashboard active 24/7 so any visitor sees real-looking live data within seconds.

**Mobile-responsive.** Dashboard degrades gracefully to tablet width (1024px minimum). No broken layouts.

---

*This is a product, not a demo. Build it like you're shipping to a Fortune 500 CISO's security team on day one.*