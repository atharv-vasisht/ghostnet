import type { BehavioralTag, TargetService } from '@ghostnet/shared';

export interface TagContext {
  targetService: TargetService;
  action: string;
  sessionServicesTouched: string[];
  sessionEventCount: number;
  requestHeaders: Record<string, string>;
  existingTags: string[];
}

export function computeTags(ctx: TagContext): BehavioralTag[] {
  const tags: BehavioralTag[] = [];

  if (ctx.targetService === 'discovery') {
    tags.push('initial_recon');
  }

  if (
    ctx.targetService === 'secrets' ||
    (ctx.targetService === 'iam' && ctx.action === 'ListUsers')
  ) {
    tags.push('credential_harvesting');
  }

  if (
    ctx.sessionServicesTouched.includes('secrets') &&
    ctx.targetService !== 'secrets' &&
    typeof ctx.requestHeaders['authorization'] === 'string' &&
    ctx.requestHeaders['authorization'].startsWith('Bearer ')
  ) {
    tags.push('lateral_movement');
  }

  const s3EventCount =
    ctx.sessionServicesTouched.filter((s) => s === 's3').length +
    (ctx.targetService === 's3' ? 1 : 0);
  const hasBulkPagination =
    ctx.action.includes('List') && ctx.sessionEventCount > 5;
  if (s3EventCount > 3 || hasBulkPagination) {
    tags.push('exfiltration_attempt');
  }

  const uniqueServices = new Set([
    ...ctx.sessionServicesTouched,
    ctx.targetService,
  ]);
  if (uniqueServices.size >= 3) {
    tags.push('deep_probe');
  }

  const persistenceActions = [
    'PutObject',
    'CreateUser',
    'CreateRole',
    'PutSecretValue',
  ];
  if (persistenceActions.includes(ctx.action)) {
    tags.push('persistence_attempt');
  }

  for (const existing of ctx.existingTags) {
    if (!tags.includes(existing as BehavioralTag)) {
      tags.push(existing as BehavioralTag);
    }
  }

  return tags;
}
