import type { RiskLevel } from './session.js';

export type AlertTrigger =
  | 'DEPTH_THRESHOLD'
  | 'CREDENTIAL_ACCESS'
  | 'BULK_EXFILTRATION'
  | 'PERSISTENCE_ATTEMPT'
  | 'DEEP_PROBE'
  | 'FIRST_CONTACT';

export interface AlertRule {
  id: string;
  orgId: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: AlertTrigger;
  threshold: number | null;
  services: string[];
  notifyInApp: boolean;
  notifyEmail: boolean;
  notifySlack: boolean;
  slackWebhook: string | null;
  webhookUrl: string | null;
  createdAt: string;
}

export interface Alert {
  id: string;
  orgId: string;
  ruleId: string;
  sessionId: string;
  title: string;
  description: string;
  severity: RiskLevel;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
}

export interface AlertRuleInput {
  name: string;
  description: string;
  trigger: AlertTrigger;
  threshold?: number;
  services?: string[];
  notifyInApp?: boolean;
  notifyEmail?: boolean;
  notifySlack?: boolean;
  slackWebhook?: string;
  webhookUrl?: string;
}
