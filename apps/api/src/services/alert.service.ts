import { prisma } from './auth.service.js';
import type { Prisma, RiskLevel, AlertTrigger } from '@prisma/client';

export interface AlertListParams {
  orgId: string;
  acknowledged?: boolean;
  severity?: RiskLevel;
  page: number;
  limit: number;
}

export interface CreateAlertRuleData {
  orgId: string;
  name: string;
  description: string;
  enabled?: boolean;
  trigger: AlertTrigger;
  threshold?: number;
  services: string[];
  notifyInApp?: boolean;
  notifyEmail?: boolean;
  notifySlack?: boolean;
  slackWebhook?: string;
  webhookUrl?: string;
}

export async function listAlerts(params: AlertListParams) {
  const where: Prisma.AlertWhereInput = { orgId: params.orgId };

  if (params.acknowledged !== undefined) {
    where.acknowledged = params.acknowledged;
  }
  if (params.severity) {
    where.severity = params.severity;
  }

  const skip = (params.page - 1) * params.limit;

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: params.limit,
      include: {
        rule: { select: { name: true } },
        session: { select: { sourceIp: true, riskLevel: true } },
      },
    }),
    prisma.alert.count({ where }),
  ]);

  return { alerts, total, page: params.page, limit: params.limit };
}

export async function acknowledgeAlert(id: string, orgId: string) {
  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert || alert.orgId !== orgId) return null;

  return prisma.alert.update({
    where: { id },
    data: { acknowledged: true, acknowledgedAt: new Date() },
  });
}

export async function listAlertRules(orgId: string) {
  return prisma.alertRule.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { alerts: true } } },
  });
}

export async function createAlertRule(data: CreateAlertRuleData) {
  return prisma.alertRule.create({ data });
}

export async function updateAlertRule(
  id: string,
  orgId: string,
  data: Partial<Omit<CreateAlertRuleData, 'orgId'>>,
) {
  const rule = await prisma.alertRule.findUnique({ where: { id } });
  if (!rule || rule.orgId !== orgId) return null;

  return prisma.alertRule.update({
    where: { id },
    data: data as Prisma.AlertRuleUpdateInput,
  });
}

export async function deleteAlertRule(id: string, orgId: string) {
  const rule = await prisma.alertRule.findUnique({ where: { id } });
  if (!rule || rule.orgId !== orgId) return null;

  await prisma.$transaction([
    prisma.alert.deleteMany({ where: { ruleId: id } }),
    prisma.alertRule.delete({ where: { id } }),
  ]);

  return true;
}
