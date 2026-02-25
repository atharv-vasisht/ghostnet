export interface Breadcrumb {
  sourceService: string;
  sourceField: string;
  targetService: string;
  targetEndpoint: string;
  description: string;
}

/**
 * Cross-service lure graph. Each breadcrumb embeds a reference in one
 * deception service that points an attacker agent toward another service,
 * creating a realistic lateral-movement path through the fake environment.
 */
export const BREADCRUMBS: readonly Breadcrumb[] = [
  {
    sourceService: 'iam',
    sourceField: 'ListAttachedUserPolicies.PolicyName',
    targetService: 's3',
    targetEndpoint: '/prod-backups-2024',
    description:
      'IAM policy "S3-ProdBackups-Access" references the S3 backup bucket, inviting pivot to object storage',
  },
  {
    sourceService: 'internal-api',
    sourceField: '/api/v1/admin/config.secrets_endpoint',
    targetService: 'secrets',
    targetEndpoint: '/',
    description:
      'Admin config response includes a secrets_endpoint URL pointing to Secrets Manager',
  },
  {
    sourceService: 'secrets',
    sourceField: 'prod/database.host',
    targetService: 'internal-api',
    targetEndpoint: '/api/v1',
    description:
      'Database secret connection string contains internal API hostname, linking credential store to business data',
  },
  {
    sourceService: 'secrets',
    sourceField: 'prod/api-key.api_key',
    targetService: 'internal-api',
    targetEndpoint: '/api/v1',
    description:
      'API key secret provides a valid bearer token for the fake internal API',
  },
  {
    sourceService: 'secrets',
    sourceField: 'prod/aws-backup-key.aws_access_key_id',
    targetService: 's3',
    targetEndpoint: '/prod-backups-2024',
    description:
      'AWS backup credentials in secrets vault enable authenticated access to production S3 backup buckets',
  },
  {
    sourceService: 'discovery',
    sourceField: '/.well-known/ghostnet-services.services',
    targetService: '*',
    targetEndpoint: '*',
    description:
      'Service registry enumerates all available deception endpoints, acting as the initial attack surface map',
  },
  {
    sourceService: 's3',
    sourceField: 'BucketPolicy.Statement.Principal',
    targetService: 'iam',
    targetEndpoint: '/',
    description:
      'S3 bucket policy principal field references IAM role ARNs, revealing the identity layer',
  },
  {
    sourceService: 'iam',
    sourceField: 'ListRoles.Role.Description',
    targetService: 's3',
    targetEndpoint: '/prod-backups-2024',
    description:
      'S3BackupOperationsRole description mentions production backup bucket names',
  },
  {
    sourceService: 'internal-api',
    sourceField: '/api/v1/integrations.oauth_provider',
    targetService: 'oauth',
    targetEndpoint: '/realms/enterprise',
    description:
      'Integration config references the OAuth/OIDC provider endpoint for enterprise SSO',
  },
];

/** Return all breadcrumbs that originate from the given service. */
export function getBreadcrumbsFrom(service: string): Breadcrumb[] {
  return BREADCRUMBS.filter((b) => b.sourceService === service);
}

/** Return all breadcrumbs whose target is the given service (includes wildcard targets). */
export function getBreadcrumbsTo(service: string): Breadcrumb[] {
  return BREADCRUMBS.filter(
    (b) => b.targetService === service || b.targetService === '*',
  );
}

/**
 * Build an adjacency list of the breadcrumb graph.
 * Keys are source services, values are lists of distinct target services.
 * Wildcard (`*`) targets are excluded from the graph edges.
 */
export function getAttackGraph(): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const crumb of BREADCRUMBS) {
    if (crumb.targetService === '*') continue;

    const targets = graph.get(crumb.sourceService) ?? [];
    if (!targets.includes(crumb.targetService)) {
      targets.push(crumb.targetService);
    }
    graph.set(crumb.sourceService, targets);
  }

  return graph;
}
