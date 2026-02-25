export type SessionStatus = 'ACTIVE' | 'IDLE' | 'CLOSED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AgentSession {
  id: string;
  orgId: string;
  sourceIp: string;
  userAgent: string;
  firstSeenAt: string;
  lastSeenAt: string;
  status: SessionStatus;
  eventCount: number;
  servicesTouched: string[];
  riskScore: number;
  riskLevel: RiskLevel;
  depthScore: number;
  inferredGoal: string | null;
  goalConfidence: number;
  believedAssets: Asset[];
  explorationPath: string[];
}

export interface Asset {
  type: 'credential' | 'user' | 'endpoint' | 'bucket' | 'file';
  value: string;
  source: string;
  retrievedAt: string;
  likelySaved: boolean;
}

export interface SessionFilters {
  riskLevels?: RiskLevel[];
  services?: string[];
  dateFrom?: string;
  dateTo?: string;
  sourceIp?: string;
  status?: SessionStatus[];
  sortBy?: 'firstSeenAt' | 'lastSeenAt' | 'riskScore' | 'eventCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SessionListResponse {
  sessions: AgentSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
