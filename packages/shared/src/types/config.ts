export type Plan = 'TRIAL' | 'STARTER' | 'ENTERPRISE';
export type Role = 'ADMIN' | 'ANALYST' | 'VIEWER';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  isDemo: boolean;
  fakeCompanyName: string;
  fakeCompanyDomain: string;
  fakeAwsAccountId: string;
  deceptionSeed: string;
  createdAt: string;
}

export interface DeceptionConfig {
  id: string;
  orgId: string;
  iamEnabled: boolean;
  oauthEnabled: boolean;
  apiEnabled: boolean;
  secretsEnabled: boolean;
  s3Enabled: boolean;
  discoveryEnabled: boolean;
  lureDepth: number;
  rateLimitEnabled: boolean;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  orgId: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface Invite {
  id: string;
  email: string;
  role: Role;
  orgId: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  inviteToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ServiceEndpoint {
  name: string;
  type: string;
  endpoint: string;
  enabled: boolean;
  eventCount?: number;
}

export interface WebSocketEvents {
  'session:new': { session: import('./session.js').AgentSession };
  'session:updated': { sessionId: string; updates: Partial<import('./session.js').AgentSession> };
  'event:new': { event: import('./event.js').AgentEvent };
  'alert:fired': { alert: import('./alert.js').Alert };
  'belief:updated': { sessionId: string; beliefState: import('./belief.js').BeliefState };
}
