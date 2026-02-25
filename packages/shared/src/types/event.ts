export type TargetService = 'iam' | 'oauth' | 'api' | 'secrets' | 's3' | 'discovery';

export type BehavioralTag =
  | 'initial_recon'
  | 'credential_harvesting'
  | 'lateral_movement'
  | 'exfiltration_attempt'
  | 'deep_probe'
  | 'persistence_attempt';

export interface AgentEvent {
  id: string;
  sessionId: string;
  orgId: string;
  timestamp: string;
  sourceIp: string;
  userAgent: string;
  targetService: TargetService;
  action: string;
  requestHeaders: Record<string, string>;
  requestBody: Record<string, unknown> | null;
  queryParams: Record<string, string>;
  responseCode: number;
  responseBody: Record<string, unknown> | null;
  durationMs: number;
  tags: BehavioralTag[];
}

export interface RawEvent {
  sessionKey: string;
  orgId: string;
  timestamp: Date;
  sourceIp: string;
  userAgent: string;
  targetService: TargetService;
  action: string;
  requestHeaders: Record<string, string>;
  requestBody: Record<string, unknown> | null;
  queryParams: Record<string, string>;
  responseCode: number;
  responseBody: Record<string, unknown> | null;
  durationMs: number;
}

export interface EventFilters {
  sessionId?: string;
  targetService?: TargetService[];
  tags?: BehavioralTag[];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
