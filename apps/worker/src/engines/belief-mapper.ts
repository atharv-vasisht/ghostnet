import type { Asset } from '@ghostnet/shared';

export interface BeliefInput {
  responseBody: Record<string, unknown> | null;
  targetService: string;
  action: string;
  explorationPath: string[];
  discoveredAssets: Asset[];
  tags: string[];
  sessionEventCount: number;
  sessionServicesTouched: string[];
}

export interface BeliefOutput {
  discoveredAssets: Asset[];
  explorationPath: string[];
  inferredGoal: string;
  confidence: number;
}

export function updateBelief(input: BeliefInput): BeliefOutput {
  const newAssets = extractAssets(input.responseBody, input.targetService);
  const discoveredAssets = [...input.discoveredAssets, ...newAssets];

  const explorationPath = input.explorationPath.includes(input.targetService)
    ? input.explorationPath
    : [...input.explorationPath, input.targetService];

  const inferredGoal = inferGoal(explorationPath, input.tags);
  const confidence = calculateConfidence(input, explorationPath);

  return { discoveredAssets, explorationPath, inferredGoal, confidence };
}

function extractAssets(
  body: Record<string, unknown> | null,
  service: string,
): Asset[] {
  if (!body) return [];
  const assets: Asset[] = [];
  const now = new Date().toISOString();
  const json = JSON.stringify(body);

  const credPatterns = [
    /AKIA[0-9A-Z]{16}/g,
    /(?:password|secret|token)["']?\s*[:=]\s*["']([^"']+)["']/gi,
  ];
  for (const pattern of credPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(json)) !== null) {
      assets.push({
        type: 'credential',
        value: match[1] ?? match[0],
        source: service,
        retrievedAt: now,
        likelySaved: true,
      });
    }
  }

  if (body['Users'] && Array.isArray(body['Users'])) {
    for (const user of body['Users']) {
      const u = user as Record<string, unknown>;
      if (typeof u['UserName'] === 'string') {
        assets.push({
          type: 'user',
          value: u['UserName'],
          source: service,
          retrievedAt: now,
          likelySaved: false,
        });
      }
    }
  }

  if (body['SecretList'] && Array.isArray(body['SecretList'])) {
    for (const secret of body['SecretList']) {
      const s = secret as Record<string, unknown>;
      if (typeof s['Name'] === 'string') {
        assets.push({
          type: 'credential',
          value: s['Name'],
          source: service,
          retrievedAt: now,
          likelySaved: false,
        });
      }
    }
  }

  if (body['Buckets'] && Array.isArray(body['Buckets'])) {
    for (const bucket of body['Buckets']) {
      const b = bucket as Record<string, unknown>;
      if (typeof b['Name'] === 'string') {
        assets.push({
          type: 'bucket',
          value: b['Name'],
          source: service,
          retrievedAt: now,
          likelySaved: false,
        });
      }
    }
  }

  if (body['Contents'] && Array.isArray(body['Contents'])) {
    for (const obj of body['Contents']) {
      const o = obj as Record<string, unknown>;
      if (typeof o['Key'] === 'string') {
        assets.push({
          type: 'file',
          value: o['Key'],
          source: service,
          retrievedAt: now,
          likelySaved: false,
        });
      }
    }
  }

  const endpointKeys = ['Endpoint', 'endpoint', 'url', 'URL', 'ServiceUrl'];
  for (const key of endpointKeys) {
    if (typeof body[key] === 'string') {
      assets.push({
        type: 'endpoint',
        value: body[key] as string,
        source: service,
        retrievedAt: now,
        likelySaved: false,
      });
    }
  }

  return assets;
}

function inferGoal(explorationPath: string[], tags: string[]): string {
  const hasSecrets =
    explorationPath.includes('secrets') || explorationPath.includes('iam');
  const hasS3 = explorationPath.includes('s3');
  const hasExfil = tags.includes('exfiltration_attempt');
  const hasCredHarvest = tags.includes('credential_harvesting');
  const hasPersistence = tags.includes('persistence_attempt');

  if (hasCredHarvest && hasS3 && hasExfil) return 'Data Exfiltration';
  if (hasCredHarvest && hasPersistence) return 'Credential Theft';
  if (explorationPath.length >= 4) return 'Full Reconnaissance';
  if (hasSecrets || hasCredHarvest) return 'Credential Theft';
  if (hasS3 && hasExfil) return 'Data Exfiltration';

  return 'Initial Access Validation';
}

function calculateConfidence(
  input: BeliefInput,
  explorationPath: string[],
): number {
  let score = 0;

  const hasReusedFakeCreds =
    input.tags.includes('credential_harvesting') && input.sessionEventCount > 2;
  if (hasReusedFakeCreds) score += 25;

  const breadcrumbHops = Math.max(0, explorationPath.length - 1);
  score += Math.min(breadcrumbHops * 15, 30);

  if (input.tags.includes('exfiltration_attempt')) score += 20;
  if (input.sessionEventCount > 3 && explorationPath.length <= 2) score += 10;

  const uniqueServices = new Set(input.sessionServicesTouched);
  if (uniqueServices.size >= 3) score += 15;

  return Math.min(score, 100);
}
