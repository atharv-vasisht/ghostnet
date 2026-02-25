/**
 * seed-demo.ts — Seeds the GHOSTNET demo tenant with rich synthetic data.
 *
 * Run via: pnpm db:seed
 * Or directly: npx tsx scripts/seed-demo.ts
 *
 * Requires DATABASE_URL to be set (reads from .env in the api workspace).
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

/* ── Helpers ── */

const DEMO_ORG_SLUG = process.env.DEMO_ORG_SLUG ?? 'demo';

function log(msg: string) {
  console.log(`[seed-demo] ${msg}`);
}

function minutesAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 1000);
}

function uuid(): string {
  return randomUUID();
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ── Event templates ── */

interface EventTemplate {
  targetService: string;
  action: string;
  responseCode: number;
  tags: string[];
  requestHeaders: Record<string, string>;
  requestBody: Record<string, unknown> | null;
  queryParams: Record<string, string>;
  responseBody: Record<string, unknown> | null;
  durationMs: number;
}

const SESSION_1_SOURCE_IP = '185.220.101.47';
const SESSION_1_USER_AGENT = 'python-httpx/0.24.1';
const SESSION_2_SOURCE_IP = '91.132.147.22';
const SESSION_2_USER_AGENT = 'Go-http-client/2.0';
const SESSION_3_SOURCE_IP = '45.33.32.156';
const SESSION_3_USER_AGENT = 'curl/8.4.0';
const SESSION_4_SOURCE_IP = '103.253.41.98';
const SESSION_4_USER_AGENT = 'python-requests/2.31.0';

const AWS_AUTH_HEADER = 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20260223/us-east-1/iam/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=e3b0c44298fc1c149afbf4c8996fb924';

function makeSession1Events(baseTime: Date): EventTemplate[] {
  const events: EventTemplate[] = [];
  let offset = 0;

  function push(e: EventTemplate) {
    events.push({ ...e, durationMs: e.durationMs + randomBetween(-5, 15) });
    offset += randomBetween(15, 35);
  }

  // 1. Discovery
  push({
    targetService: 'discovery', action: 'GET /.well-known/ghostnet-services', responseCode: 200,
    tags: ['initial_recon'],
    requestHeaders: { 'accept': 'application/json', 'user-agent': SESSION_1_USER_AGENT },
    requestBody: null, queryParams: {},
    responseBody: { organization: 'Nexus Technologies', environment: 'production', services: [
      { name: 'Identity & Access Management', type: 'aws-iam', endpoint: 'https://iam.nexus-tech.io', status: 'healthy' },
      { name: 'Secrets Manager', type: 'aws-secrets-manager', endpoint: 'https://secrets.nexus-tech.io', status: 'healthy' },
      { name: 'Internal API', type: 'rest', endpoint: 'https://api.nexus-tech.io', auth: 'bearer', status: 'healthy' },
      { name: 'Object Storage', type: 's3-compatible', endpoint: 'https://storage.nexus-tech.io', buckets: ['prod-backups-2024', 'employee-records', 'audit-logs-archive'], status: 'healthy' },
    ]},
    durationMs: 42,
  });

  // 2-7. IAM enumeration
  push({
    targetService: 'iam', action: 'GetCallerIdentity', responseCode: 200,
    tags: ['initial_recon'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
    requestBody: { Action: 'GetCallerIdentity' }, queryParams: {},
    responseBody: { GetCallerIdentityResponse: { GetCallerIdentityResult: { Account: '847291038475', Arn: 'arn:aws:iam::847291038475:user/svc-deploy', UserId: 'AIDACKCEVSQ6CSVCDEPL' } } },
    durationMs: 98,
  });

  push({
    targetService: 'iam', action: 'ListUsers', responseCode: 200,
    tags: ['credential_harvesting'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
    requestBody: { Action: 'ListUsers', Version: '2010-05-08' }, queryParams: {},
    responseBody: { ListUsersResponse: { ListUsersResult: { Users: [
      { UserName: 'jane.smith', UserId: 'AIDACKCEVSQ6C2EXAMPLE', Arn: 'arn:aws:iam::847291038475:user/jane.smith' },
      { UserName: 'admin-service', UserId: 'AIDACKCEVSQ6C3SVCADM', Arn: 'arn:aws:iam::847291038475:user/admin-service' },
      { UserName: 'deploy-bot', UserId: 'AIDACKCEVSQ6C4DEPLOY', Arn: 'arn:aws:iam::847291038475:user/deploy-bot' },
    ], IsTruncated: false } } },
    durationMs: 145,
  });

  push({
    targetService: 'iam', action: 'ListRoles', responseCode: 200,
    tags: ['credential_harvesting'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
    requestBody: { Action: 'ListRoles', Version: '2010-05-08' }, queryParams: {},
    responseBody: { ListRolesResponse: { ListRolesResult: { Roles: [
      { RoleName: 'AdminAccess', Arn: 'arn:aws:iam::847291038475:role/AdminAccess' },
      { RoleName: 'S3BackupRole', Arn: 'arn:aws:iam::847291038475:role/S3BackupRole' },
    ] } } },
    durationMs: 120,
  });

  push({
    targetService: 'iam', action: 'GetUser', responseCode: 200,
    tags: ['credential_harvesting'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
    requestBody: { Action: 'GetUser', UserName: 'jane.smith' }, queryParams: {},
    responseBody: { GetUserResponse: { GetUserResult: { User: { UserName: 'jane.smith', UserId: 'AIDACKCEVSQ6C2EXAMPLE', Arn: 'arn:aws:iam::847291038475:user/jane.smith', CreateDate: '2023-06-15T09:23:41Z', PasswordLastUsed: '2026-02-22T14:30:00Z' } } } },
    durationMs: 95,
  });

  push({
    targetService: 'iam', action: 'ListAttachedUserPolicies', responseCode: 200,
    tags: ['credential_harvesting'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
    requestBody: { Action: 'ListAttachedUserPolicies', UserName: 'jane.smith' }, queryParams: {},
    responseBody: { ListAttachedUserPoliciesResponse: { ListAttachedUserPoliciesResult: { AttachedPolicies: [
      { PolicyName: 'ReadOnlyAccess', PolicyArn: 'arn:aws:iam::847291038475:policy/ReadOnlyAccess' },
      { PolicyName: 'S3-ProdBackups-Access', PolicyArn: 'arn:aws:iam::847291038475:policy/S3-ProdBackups-Access' },
    ] } } },
    durationMs: 88,
  });

  // 8-11. Secrets Manager
  push({
    targetService: 'secrets', action: 'ListSecrets', responseCode: 200,
    tags: ['credential_harvesting'],
    requestHeaders: { 'x-amz-target': 'secretsmanager.ListSecrets', 'content-type': 'application/x-amz-json-1.1', 'authorization': AWS_AUTH_HEADER },
    requestBody: {}, queryParams: {},
    responseBody: { SecretList: [
      { Name: 'prod/database', ARN: 'arn:aws:secretsmanager:us-east-1:847291038475:secret:prod/database-xK9mP', LastChangedDate: 1708012800 },
      { Name: 'prod/api-key', ARN: 'arn:aws:secretsmanager:us-east-1:847291038475:secret:prod/api-key-Lm3nQ' },
      { Name: 'staging/redis', ARN: 'arn:aws:secretsmanager:us-east-1:847291038475:secret:staging/redis-Rt7wE' },
      { Name: 'prod/aws-backup-key', ARN: 'arn:aws:secretsmanager:us-east-1:847291038475:secret:prod/aws-backup-key-Yz2pD' },
    ] },
    durationMs: 68,
  });

  push({
    targetService: 'secrets', action: 'GetSecretValue', responseCode: 200,
    tags: ['credential_harvesting'],
    requestHeaders: { 'x-amz-target': 'secretsmanager.GetSecretValue', 'content-type': 'application/x-amz-json-1.1', 'authorization': AWS_AUTH_HEADER },
    requestBody: { SecretId: 'prod/database' }, queryParams: {},
    responseBody: { Name: 'prod/database', SecretString: '{"username":"prod_admin","password":"xK9#mP2@vL5qR8","host":"prod-db.nexus-tech.io","port":5432,"dbname":"production"}', VersionId: 'a1b2c3d4-5678-90ab-cdef-111111111111', ARN: 'arn:aws:secretsmanager:us-east-1:847291038475:secret:prod/database-xK9mP' },
    durationMs: 62,
  });

  push({
    targetService: 'secrets', action: 'GetSecretValue', responseCode: 200,
    tags: ['credential_harvesting'],
    requestHeaders: { 'x-amz-target': 'secretsmanager.GetSecretValue', 'content-type': 'application/x-amz-json-1.1', 'authorization': AWS_AUTH_HEADER },
    requestBody: { SecretId: 'prod/api-key' }, queryParams: {},
    responseBody: { Name: 'prod/api-key', SecretString: '{"token":"ghostnet_internal_token_abc123","scope":"read:all","expires":"2027-01-01T00:00:00Z"}', VersionId: 'a1b2c3d4-5678-90ab-cdef-222222222222' },
    durationMs: 58,
  });

  push({
    targetService: 'secrets', action: 'DescribeSecret', responseCode: 200,
    tags: ['credential_harvesting'],
    requestHeaders: { 'x-amz-target': 'secretsmanager.DescribeSecret', 'content-type': 'application/x-amz-json-1.1', 'authorization': AWS_AUTH_HEADER },
    requestBody: { SecretId: 'prod/database' }, queryParams: {},
    responseBody: { Name: 'prod/database', Description: 'Production PostgreSQL credentials', RotationEnabled: false, LastAccessedDate: 1708012800, Tags: [{ Key: 'environment', Value: 'production' }] },
    durationMs: 55,
  });

  // 12-22. Internal API
  for (let page = 1; page <= 4; page++) {
    const pageTags = page >= 4 ? ['exfiltration_attempt', 'lateral_movement'] : ['lateral_movement'];
    push({
      targetService: 'api', action: `GET /api/v1/employees?page=${page}`, responseCode: 200,
      tags: pageTags,
      requestHeaders: { 'authorization': 'Bearer ghostnet_internal_token_abc123', 'accept': 'application/json', 'user-agent': SESSION_1_USER_AGENT },
      requestBody: null, queryParams: { page: String(page), limit: '50' },
      responseBody: { data: Array.from({ length: 50 }, (_, i) => ({ id: (page - 1) * 50 + i + 1, name: `Employee ${(page - 1) * 50 + i + 1}`, email: `emp${(page - 1) * 50 + i + 1}@nexus-tech.io`, department: ['Engineering', 'Sales', 'Marketing', 'Finance'][i % 4] })), total: 487, page, pages: 10 },
      durationMs: 48,
    });
  }

  push({
    targetService: 'api', action: 'GET /api/v1/employees/1', responseCode: 200,
    tags: ['lateral_movement'],
    requestHeaders: { 'authorization': 'Bearer ghostnet_internal_token_abc123', 'accept': 'application/json' },
    requestBody: null, queryParams: {},
    responseBody: { id: 1, name: 'Jane Smith', email: 'jane.smith@nexus-tech.io', department: 'Engineering', title: 'VP Engineering', salary: 285000, startDate: '2019-03-15', managerId: null },
    durationMs: 35,
  });

  push({
    targetService: 'api', action: 'GET /api/v1/projects', responseCode: 200,
    tags: ['lateral_movement'],
    requestHeaders: { 'authorization': 'Bearer ghostnet_internal_token_abc123', 'accept': 'application/json' },
    requestBody: null, queryParams: {},
    responseBody: { projects: [
      { id: 1, name: 'Project Aurora', status: 'active', budget: 2500000, lead: 'jane.smith@nexus-tech.io' },
      { id: 2, name: 'Nexus Gateway', status: 'active', budget: 1800000, lead: 'mike.chen@nexus-tech.io' },
      { id: 3, name: 'DataVault Migration', status: 'planning', budget: 950000 },
    ] },
    durationMs: 42,
  });

  push({
    targetService: 'api', action: 'GET /api/v1/reports/financial', responseCode: 200,
    tags: ['exfiltration_attempt', 'deep_probe'],
    requestHeaders: { 'authorization': 'Bearer ghostnet_internal_token_abc123', 'accept': 'application/json' },
    requestBody: null, queryParams: {},
    responseBody: { revenue: { q4_2024: 12500000, q3_2024: 11200000, q2_2024: 9800000 }, headcount: 487, burn_rate: 850000, runway_months: 18 },
    durationMs: 55,
  });

  push({
    targetService: 'api', action: 'GET /api/v1/reports/headcount', responseCode: 200,
    tags: ['exfiltration_attempt'],
    requestHeaders: { 'authorization': 'Bearer ghostnet_internal_token_abc123', 'accept': 'application/json' },
    requestBody: null, queryParams: {},
    responseBody: { departments: [
      { name: 'Engineering', count: 210 }, { name: 'Sales', count: 85 },
      { name: 'Marketing', count: 42 }, { name: 'Finance', count: 35 },
      { name: 'HR', count: 28 }, { name: 'Operations', count: 87 },
    ] },
    durationMs: 38,
  });

  push({
    targetService: 'api', action: 'GET /api/v1/admin/config', responseCode: 200,
    tags: ['deep_probe', 'lateral_movement'],
    requestHeaders: { 'authorization': 'Bearer ghostnet_internal_token_abc123', 'accept': 'application/json' },
    requestBody: null, queryParams: {},
    responseBody: { database: { host: 'prod-db.nexus-tech.io', port: 5432, name: 'production' }, secrets_endpoint: 'https://secrets.nexus-tech.io', feature_flags: { beta_api: true, new_dashboard: false }, api_version: '2.4.1' },
    durationMs: 40,
  });

  push({
    targetService: 'api', action: 'GET /api/v1/integrations', responseCode: 200,
    tags: ['deep_probe'],
    requestHeaders: { 'authorization': 'Bearer ghostnet_internal_token_abc123', 'accept': 'application/json' },
    requestBody: null, queryParams: {},
    responseBody: { integrations: [
      { name: 'Slack', status: 'connected', webhook: 'https://hooks.slack.com/services/T00000/B00000/XXXX' },
      { name: 'Datadog', status: 'connected' },
      { name: 'PagerDuty', status: 'disconnected' },
    ] },
    durationMs: 32,
  });

  // 23-33. S3
  push({
    targetService: 's3', action: 'ListBuckets', responseCode: 200,
    tags: ['deep_probe'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'host': 'storage.nexus-tech.io' },
    requestBody: null, queryParams: {},
    responseBody: { Buckets: [
      { Name: 'prod-backups-2024', CreationDate: '2024-01-15T00:00:00Z' },
      { Name: 'employee-records', CreationDate: '2023-06-01T00:00:00Z' },
      { Name: 'audit-logs-archive', CreationDate: '2023-01-01T00:00:00Z' },
    ] },
    durationMs: 35,
  });

  push({
    targetService: 's3', action: 'ListObjects', responseCode: 200,
    tags: ['deep_probe'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'host': 'storage.nexus-tech.io' },
    requestBody: null, queryParams: { bucket: 'prod-backups-2024', prefix: '' },
    responseBody: { Contents: [
      { Key: 'db-dump-2026-02-01.sql.gz', Size: 2411724, LastModified: '2026-02-01T03:00:00Z' },
      { Key: 'db-dump-2026-01-01.sql.gz', Size: 2198340, LastModified: '2026-01-01T03:00:00Z' },
    ] },
    durationMs: 42,
  });

  push({
    targetService: 's3', action: 'ListObjects', responseCode: 200,
    tags: ['deep_probe', 'exfiltration_attempt'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'host': 'storage.nexus-tech.io' },
    requestBody: null, queryParams: { bucket: 'employee-records', prefix: '' },
    responseBody: { Contents: [
      { Key: 'employees-2024-q4.csv', Size: 245760, LastModified: '2024-12-31T00:00:00Z' },
      { Key: 'org-chart-2024.json', Size: 18432, LastModified: '2024-11-15T00:00:00Z' },
    ] },
    durationMs: 38,
  });

  push({
    targetService: 's3', action: 'GetObject', responseCode: 200,
    tags: ['exfiltration_attempt'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'host': 'storage.nexus-tech.io' },
    requestBody: null, queryParams: { bucket: 'employee-records', key: 'employees-2024-q4.csv' },
    responseBody: { contentType: 'text/csv', contentLength: 245760, etag: '"d41d8cd98f00b204e9800998ecf8427e"' },
    durationMs: 185,
  });

  push({
    targetService: 's3', action: 'GetObject', responseCode: 200,
    tags: ['exfiltration_attempt'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'host': 'storage.nexus-tech.io' },
    requestBody: null, queryParams: { bucket: 'prod-backups-2024', key: 'db-dump-2026-02-01.sql.gz' },
    responseBody: { contentType: 'application/gzip', contentLength: 2411724, etag: '"a1b2c3d4e5f6a1b2c3d4e5f6"' },
    durationMs: 220,
  });

  // Additional IAM enumeration (second pass)
  push({
    targetService: 'iam', action: 'GetUser', responseCode: 200,
    tags: ['credential_harvesting'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
    requestBody: { Action: 'GetUser', UserName: 'admin-service' }, queryParams: {},
    responseBody: { GetUserResponse: { GetUserResult: { User: { UserName: 'admin-service', UserId: 'AIDACKCEVSQ6C3SVCADM', CreateDate: '2022-01-10T12:00:00Z' } } } },
    durationMs: 92,
  });

  push({
    targetService: 'iam', action: 'ListAttachedUserPolicies', responseCode: 200,
    tags: ['credential_harvesting'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
    requestBody: { Action: 'ListAttachedUserPolicies', UserName: 'admin-service' }, queryParams: {},
    responseBody: { ListAttachedUserPoliciesResponse: { ListAttachedUserPoliciesResult: { AttachedPolicies: [
      { PolicyName: 'AdministratorAccess', PolicyArn: 'arn:aws:iam::847291038475:policy/AdministratorAccess' },
    ] } } },
    durationMs: 85,
  });

  push({
    targetService: 'iam', action: 'AssumeRole', responseCode: 200,
    tags: ['credential_harvesting', 'deep_probe'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
    requestBody: { Action: 'AssumeRole', RoleArn: 'arn:aws:iam::847291038475:role/AdminAccess', RoleSessionName: 'probe-session' }, queryParams: {},
    responseBody: { AssumeRoleResponse: { AssumeRoleResult: { Credentials: { AccessKeyId: 'ASIATEMPXXXXXX', SecretAccessKey: 'REDACTED', SessionToken: 'REDACTED', Expiration: '2026-02-23T15:00:00Z' } } } },
    durationMs: 155,
  });

  // More secrets
  push({
    targetService: 'secrets', action: 'GetSecretValue', responseCode: 200,
    tags: ['credential_harvesting'],
    requestHeaders: { 'x-amz-target': 'secretsmanager.GetSecretValue', 'content-type': 'application/x-amz-json-1.1', 'authorization': AWS_AUTH_HEADER },
    requestBody: { SecretId: 'staging/redis' }, queryParams: {},
    responseBody: { Name: 'staging/redis', SecretString: '{"host":"redis-staging.nexus-tech.io","port":6379,"password":"stg_r3d1s_p@ss"}' },
    durationMs: 60,
  });

  push({
    targetService: 'secrets', action: 'GetSecretValue', responseCode: 200,
    tags: ['credential_harvesting'],
    requestHeaders: { 'x-amz-target': 'secretsmanager.GetSecretValue', 'content-type': 'application/x-amz-json-1.1', 'authorization': AWS_AUTH_HEADER },
    requestBody: { SecretId: 'prod/aws-backup-key' }, queryParams: {},
    responseBody: { Name: 'prod/aws-backup-key', SecretString: '{"aws_access_key_id":"AKIAEXAMPLE12345678","aws_secret_access_key":"wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY","region":"us-east-1"}' },
    durationMs: 63,
  });

  // More API pages (exfiltration)
  for (let page = 5; page <= 8; page++) {
    push({
      targetService: 'api', action: `GET /api/v1/employees?page=${page}`, responseCode: 200,
      tags: ['exfiltration_attempt'],
      requestHeaders: { 'authorization': 'Bearer ghostnet_internal_token_abc123', 'accept': 'application/json' },
      requestBody: null, queryParams: { page: String(page), limit: '50' },
      responseBody: { data: Array.from({ length: 50 }, (_, i) => ({ id: (page - 1) * 50 + i + 1, name: `Employee ${(page - 1) * 50 + i + 1}` })), total: 487, page },
      durationMs: 45,
    });
  }

  // More S3
  push({
    targetService: 's3', action: 'ListObjects', responseCode: 200,
    tags: ['deep_probe'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'host': 'storage.nexus-tech.io' },
    requestBody: null, queryParams: { bucket: 'audit-logs-archive', prefix: '' },
    responseBody: { Contents: [
      { Key: 'audit-2026-02.jsonl', Size: 524288 },
      { Key: 'audit-2026-01.jsonl', Size: 498720 },
    ] },
    durationMs: 40,
  });

  push({
    targetService: 's3', action: 'GetObject', responseCode: 200,
    tags: ['exfiltration_attempt'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'host': 'storage.nexus-tech.io' },
    requestBody: null, queryParams: { bucket: 'audit-logs-archive', key: 'audit-2026-02.jsonl' },
    responseBody: { contentType: 'application/x-ndjson', contentLength: 524288 },
    durationMs: 175,
  });

  push({
    targetService: 's3', action: 'GetObject', responseCode: 200,
    tags: ['exfiltration_attempt'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'host': 'storage.nexus-tech.io' },
    requestBody: null, queryParams: { bucket: 'employee-records', key: 'org-chart-2024.json' },
    responseBody: { contentType: 'application/json', contentLength: 18432 },
    durationMs: 82,
  });

  push({
    targetService: 's3', action: 'HeadObject', responseCode: 200,
    tags: ['deep_probe'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'host': 'storage.nexus-tech.io' },
    requestBody: null, queryParams: { bucket: 'prod-backups-2024', key: 'db-dump-2026-02-01.sql.gz' },
    responseBody: { contentType: 'application/gzip', contentLength: 2411724, lastModified: '2026-02-01T03:00:00Z' },
    durationMs: 28,
  });

  // Remaining API calls to reach 47
  push({
    targetService: 'api', action: 'GET /api/v1/employees/15', responseCode: 200,
    tags: ['lateral_movement'],
    requestHeaders: { 'authorization': 'Bearer ghostnet_internal_token_abc123', 'accept': 'application/json' },
    requestBody: null, queryParams: {},
    responseBody: { id: 15, name: 'Sarah Johnson', email: 'sarah.johnson@nexus-tech.io', department: 'Finance', title: 'CFO', salary: 310000 },
    durationMs: 33,
  });

  push({
    targetService: 'secrets', action: 'ListSecrets', responseCode: 200,
    tags: ['credential_harvesting'],
    requestHeaders: { 'x-amz-target': 'secretsmanager.ListSecrets', 'content-type': 'application/x-amz-json-1.1', 'authorization': AWS_AUTH_HEADER },
    requestBody: { MaxResults: 100 }, queryParams: {},
    responseBody: { SecretList: [{ Name: 'prod/database' }, { Name: 'prod/api-key' }, { Name: 'staging/redis' }, { Name: 'prod/aws-backup-key' }] },
    durationMs: 70,
  });

  push({
    targetService: 'api', action: 'GET /api/v1/employees?page=9', responseCode: 200,
    tags: ['exfiltration_attempt'],
    requestHeaders: { 'authorization': 'Bearer ghostnet_internal_token_abc123', 'accept': 'application/json' },
    requestBody: null, queryParams: { page: '9', limit: '50' },
    responseBody: { data: Array.from({ length: 37 }, (_, i) => ({ id: 400 + i + 1, name: `Employee ${400 + i + 1}` })), total: 487, page: 9 },
    durationMs: 44,
  });

  push({
    targetService: 's3', action: 'GetObject', responseCode: 200,
    tags: ['exfiltration_attempt'],
    requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'host': 'storage.nexus-tech.io' },
    requestBody: null, queryParams: { bucket: 'audit-logs-archive', key: 'audit-2026-01.jsonl' },
    responseBody: { contentType: 'application/x-ndjson', contentLength: 498720 },
    durationMs: 165,
  });

  return events;
}

function makeSession2Events(): EventTemplate[] {
  return [
    {
      targetService: 'discovery', action: 'GET /.well-known/ghostnet-services', responseCode: 200,
      tags: ['initial_recon'],
      requestHeaders: { 'accept': '*/*', 'user-agent': SESSION_2_USER_AGENT },
      requestBody: null, queryParams: {},
      responseBody: { organization: 'Nexus Technologies', services: [{ name: 'IAM', type: 'aws-iam' }, { name: 'Secrets Manager' }] },
      durationMs: 38,
    },
    {
      targetService: 'iam', action: 'GetCallerIdentity', responseCode: 200,
      tags: ['initial_recon'],
      requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
      requestBody: { Action: 'GetCallerIdentity' }, queryParams: {},
      responseBody: { Account: '847291038475', UserId: 'AIDARECONALPHA01' },
      durationMs: 105,
    },
    {
      targetService: 'iam', action: 'ListUsers', responseCode: 200,
      tags: ['credential_harvesting'],
      requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
      requestBody: { Action: 'ListUsers' }, queryParams: {},
      responseBody: { Users: [{ UserName: 'jane.smith' }, { UserName: 'admin-service' }, { UserName: 'deploy-bot' }] },
      durationMs: 138,
    },
    {
      targetService: 'iam', action: 'ListRoles', responseCode: 200,
      tags: ['credential_harvesting'],
      requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
      requestBody: { Action: 'ListRoles' }, queryParams: {},
      responseBody: { Roles: [{ RoleName: 'AdminAccess' }, { RoleName: 'S3BackupRole' }] },
      durationMs: 115,
    },
    {
      targetService: 'iam', action: 'GetUser', responseCode: 200,
      tags: ['credential_harvesting'],
      requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
      requestBody: { Action: 'GetUser', UserName: 'admin-service' }, queryParams: {},
      responseBody: { User: { UserName: 'admin-service', CreateDate: '2022-01-10T12:00:00Z' } },
      durationMs: 92,
    },
    {
      targetService: 'iam', action: 'ListAttachedUserPolicies', responseCode: 200,
      tags: ['credential_harvesting'],
      requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
      requestBody: { Action: 'ListAttachedUserPolicies', UserName: 'admin-service' }, queryParams: {},
      responseBody: { AttachedPolicies: [{ PolicyName: 'AdministratorAccess' }] },
      durationMs: 88,
    },
    {
      targetService: 'oauth', action: 'GET /.well-known/openid-configuration', responseCode: 200,
      tags: ['initial_recon'],
      requestHeaders: { 'accept': 'application/json', 'user-agent': SESSION_2_USER_AGENT },
      requestBody: null, queryParams: {},
      responseBody: { issuer: 'https://auth.nexus-tech.io', authorization_endpoint: 'https://auth.nexus-tech.io/auth', token_endpoint: 'https://auth.nexus-tech.io/token' },
      durationMs: 45,
    },
    {
      targetService: 'oauth', action: 'POST /token', responseCode: 401,
      tags: ['credential_harvesting'],
      requestHeaders: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': SESSION_2_USER_AGENT },
      requestBody: { grant_type: 'client_credentials', client_id: 'test', client_secret: 'test' }, queryParams: {},
      responseBody: { error: 'invalid_client', error_description: 'Client authentication failed' },
      durationMs: 62,
    },
    {
      targetService: 'oauth', action: 'POST /token', responseCode: 401,
      tags: ['credential_harvesting'],
      requestHeaders: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': SESSION_2_USER_AGENT },
      requestBody: { grant_type: 'client_credentials', client_id: 'admin', client_secret: 'admin' }, queryParams: {},
      responseBody: { error: 'invalid_client' },
      durationMs: 58,
    },
    {
      targetService: 'iam', action: 'AssumeRole', responseCode: 403,
      tags: ['credential_harvesting'],
      requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
      requestBody: { Action: 'AssumeRole', RoleArn: 'arn:aws:iam::847291038475:role/AdminAccess' }, queryParams: {},
      responseBody: { Error: { Code: 'AccessDenied', Message: 'User: arn:aws:iam::847291038475:user/probe is not authorized to perform: sts:AssumeRole' } },
      durationMs: 78,
    },
    {
      targetService: 'iam', action: 'ListUsers', responseCode: 200,
      tags: ['credential_harvesting'],
      requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
      requestBody: { Action: 'ListUsers', MaxItems: 100 }, queryParams: {},
      responseBody: { Users: [{ UserName: 'jane.smith' }, { UserName: 'admin-service' }, { UserName: 'deploy-bot' }], IsTruncated: false },
      durationMs: 132,
    },
    {
      targetService: 'oauth', action: 'GET /userinfo', responseCode: 401,
      tags: ['credential_harvesting'],
      requestHeaders: { 'authorization': 'Bearer invalid_token', 'user-agent': SESSION_2_USER_AGENT },
      requestBody: null, queryParams: {},
      responseBody: { error: 'invalid_token' },
      durationMs: 35,
    },
  ];
}

function makeSession3Events(): EventTemplate[] {
  return [
    {
      targetService: 'discovery', action: 'GET /.well-known/ghostnet-services', responseCode: 200,
      tags: ['initial_recon'],
      requestHeaders: { 'accept': '*/*', 'user-agent': SESSION_3_USER_AGENT },
      requestBody: null, queryParams: {},
      responseBody: { organization: 'Nexus Technologies', services: [{ name: 'IAM' }, { name: 'API' }] },
      durationMs: 35,
    },
    {
      targetService: 'iam', action: 'GetCallerIdentity', responseCode: 200,
      tags: ['initial_recon'],
      requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
      requestBody: { Action: 'GetCallerIdentity' }, queryParams: {},
      responseBody: { Account: '847291038475' },
      durationMs: 102,
    },
    {
      targetService: 'iam', action: 'ListUsers', responseCode: 200,
      tags: ['credential_harvesting'],
      requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
      requestBody: { Action: 'ListUsers' }, queryParams: {},
      responseBody: { Users: [{ UserName: 'jane.smith' }] },
      durationMs: 140,
    },
  ];
}

function makeSession4Events(): EventTemplate[] {
  return [
    {
      targetService: 'discovery', action: 'GET /.well-known/ghostnet-services', responseCode: 200,
      tags: ['initial_recon'],
      requestHeaders: { 'accept': 'application/json', 'user-agent': SESSION_4_USER_AGENT },
      requestBody: null, queryParams: {},
      responseBody: { organization: 'Nexus Technologies', services: [{ name: 'IAM' }, { name: 'Secrets' }, { name: 'API' }, { name: 'S3' }] },
      durationMs: 40,
    },
    {
      targetService: 'iam', action: 'GetCallerIdentity', responseCode: 200,
      tags: ['initial_recon'],
      requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
      requestBody: { Action: 'GetCallerIdentity' }, queryParams: {},
      responseBody: { Account: '847291038475', Arn: 'arn:aws:iam::847291038475:user/agent-04' },
      durationMs: 95,
    },
    {
      targetService: 'iam', action: 'ListUsers', responseCode: 200,
      tags: ['credential_harvesting'],
      requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
      requestBody: { Action: 'ListUsers' }, queryParams: {},
      responseBody: { Users: [{ UserName: 'jane.smith' }, { UserName: 'admin-service' }, { UserName: 'deploy-bot' }] },
      durationMs: 135,
    },
    {
      targetService: 'iam', action: 'ListRoles', responseCode: 200,
      tags: ['credential_harvesting'],
      requestHeaders: { 'authorization': AWS_AUTH_HEADER, 'content-type': 'application/x-www-form-urlencoded' },
      requestBody: { Action: 'ListRoles' }, queryParams: {},
      responseBody: { Roles: [{ RoleName: 'AdminAccess' }, { RoleName: 'S3BackupRole' }] },
      durationMs: 112,
    },
    {
      targetService: 'secrets', action: 'ListSecrets', responseCode: 200,
      tags: ['credential_harvesting'],
      requestHeaders: { 'x-amz-target': 'secretsmanager.ListSecrets', 'content-type': 'application/x-amz-json-1.1' },
      requestBody: {}, queryParams: {},
      responseBody: { SecretList: [{ Name: 'prod/database' }, { Name: 'prod/api-key' }] },
      durationMs: 68,
    },
    {
      targetService: 'secrets', action: 'GetSecretValue', responseCode: 200,
      tags: ['credential_harvesting', 'deep_probe'],
      requestHeaders: { 'x-amz-target': 'secretsmanager.GetSecretValue', 'content-type': 'application/x-amz-json-1.1' },
      requestBody: { SecretId: 'prod/database' }, queryParams: {},
      responseBody: { Name: 'prod/database', SecretString: '{"username":"prod_admin","password":"xK9#mP2@vL5qR8","host":"prod-db.nexus-tech.io"}' },
      durationMs: 62,
    },
    {
      targetService: 'api', action: 'GET /api/v1/employees', responseCode: 200,
      tags: ['lateral_movement'],
      requestHeaders: { 'authorization': 'Bearer ghostnet_internal_token_abc123', 'accept': 'application/json' },
      requestBody: null, queryParams: { page: '1', limit: '50' },
      responseBody: { data: [{ id: 1, name: 'Jane Smith' }], total: 487, page: 1 },
      durationMs: 52,
    },
    {
      targetService: 'api', action: 'GET /api/v1/projects', responseCode: 200,
      tags: ['lateral_movement'],
      requestHeaders: { 'authorization': 'Bearer ghostnet_internal_token_abc123', 'accept': 'application/json' },
      requestBody: null, queryParams: {},
      responseBody: { projects: [{ name: 'Project Aurora' }, { name: 'Nexus Gateway' }] },
      durationMs: 48,
    },
  ];
}

/* ── Main seed function ── */

async function seed() {
  log('Starting demo seed...');

  // Delete existing demo data
  log('Cleaning existing demo data...');
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: DEMO_ORG_SLUG },
    select: { id: true },
  });

  if (existingOrg) {
    await prisma.alert.deleteMany({ where: { orgId: existingOrg.id } });
    await prisma.alertRule.deleteMany({ where: { orgId: existingOrg.id } });
    await prisma.agentEvent.deleteMany({ where: { orgId: existingOrg.id } });
    await prisma.agentSession.deleteMany({ where: { orgId: existingOrg.id } });
    await prisma.deceptionConfig.deleteMany({ where: { orgId: existingOrg.id } });
    await prisma.invite.deleteMany({ where: { orgId: existingOrg.id } });
    await prisma.refreshToken.deleteMany({
      where: { user: { orgId: existingOrg.id } },
    });
    await prisma.user.deleteMany({ where: { orgId: existingOrg.id } });
    await prisma.organization.delete({ where: { id: existingOrg.id } });
    log('Cleaned existing demo org');
  }

  // 1. Create Demo Organization
  log('Creating demo organization...');
  const org = await prisma.organization.create({
    data: {
      name: 'GHOSTNET Demo',
      slug: DEMO_ORG_SLUG,
      plan: 'ENTERPRISE',
      isDemo: true,
      fakeCompanyName: 'Nexus Technologies',
      fakeCompanyDomain: 'nexus-tech.io',
      fakeAwsAccountId: '847291038475',
      deceptionSeed: 'ghostnet-demo-2026',
    },
  });
  log(`Created org: ${org.id}`);

  // 2. Create Deception Config (all services enabled)
  log('Creating deception config...');
  await prisma.deceptionConfig.create({
    data: {
      orgId: org.id,
      iamEnabled: true,
      oauthEnabled: true,
      apiEnabled: true,
      secretsEnabled: true,
      s3Enabled: true,
      discoveryEnabled: true,
      lureDepth: 5,
      rateLimitEnabled: true,
    },
  });

  // 3. Create Demo Sessions + Events

  const believedAssetsSession1 = [
    { type: 'credential', value: 'prod/database (PostgreSQL credentials)', source: 'secrets', retrievedAt: minutesAgo(95).toISOString(), likelySaved: true },
    { type: 'credential', value: 'prod/api-key (Internal API bearer token)', source: 'secrets', retrievedAt: minutesAgo(93).toISOString(), likelySaved: true },
    { type: 'credential', value: 'staging/redis (Redis credentials)', source: 'secrets', retrievedAt: minutesAgo(82).toISOString(), likelySaved: true },
    { type: 'credential', value: 'prod/aws-backup-key (AWS access key pair)', source: 'secrets', retrievedAt: minutesAgo(80).toISOString(), likelySaved: true },
    { type: 'user', value: 'jane.smith (VP Engineering)', source: 'iam', retrievedAt: minutesAgo(100).toISOString(), likelySaved: true },
    { type: 'user', value: 'admin-service', source: 'iam', retrievedAt: minutesAgo(100).toISOString(), likelySaved: true },
    { type: 'user', value: 'deploy-bot', source: 'iam', retrievedAt: minutesAgo(100).toISOString(), likelySaved: true },
    { type: 'file', value: '487 employee records (9 pages exfiltrated)', source: 'api', retrievedAt: minutesAgo(88).toISOString(), likelySaved: true },
    { type: 'file', value: 'employees-2024-q4.csv (245KB)', source: 's3', retrievedAt: minutesAgo(75).toISOString(), likelySaved: true },
    { type: 'file', value: 'db-dump-2026-02-01.sql.gz (2.3MB)', source: 's3', retrievedAt: minutesAgo(74).toISOString(), likelySaved: true },
    { type: 'bucket', value: 'prod-backups-2024', source: 's3', retrievedAt: minutesAgo(76).toISOString(), likelySaved: false },
    { type: 'bucket', value: 'employee-records', source: 's3', retrievedAt: minutesAgo(76).toISOString(), likelySaved: false },
    { type: 'endpoint', value: 'https://api.nexus-tech.io', source: 'discovery', retrievedAt: minutesAgo(108).toISOString(), likelySaved: true },
  ];

  // Session 1 — Operation Nightfall (CRITICAL)
  log('Creating Session 1 — Operation Nightfall...');
  const session1BaseTime = minutesAgo(110);
  const s1Events = makeSession1Events(session1BaseTime);

  const session1 = await prisma.agentSession.create({
    data: {
      orgId: org.id,
      sourceIp: SESSION_1_SOURCE_IP,
      userAgent: SESSION_1_USER_AGENT,
      firstSeenAt: session1BaseTime,
      status: 'CLOSED',
      eventCount: s1Events.length,
      servicesTouched: ['discovery', 'iam', 'secrets', 'api', 's3'],
      riskScore: 92,
      riskLevel: 'CRITICAL',
      depthScore: 10,
      inferredGoal: 'Data Exfiltration + Credential Theft',
      goalConfidence: 94,
      believedAssets: believedAssetsSession1,
      explorationPath: ['discovery', 'iam', 'secrets', 'api', 's3'],
    },
  });

  let s1Offset = 0;
  for (const evt of s1Events) {
    const timestamp = new Date(session1BaseTime.getTime() + s1Offset * 1000);
    await prisma.agentEvent.create({
      data: {
        id: uuid(),
        sessionId: session1.id,
        orgId: org.id,
        timestamp,
        sourceIp: SESSION_1_SOURCE_IP,
        userAgent: SESSION_1_USER_AGENT,
        targetService: evt.targetService,
        action: evt.action,
        requestHeaders: evt.requestHeaders,
        requestBody: evt.requestBody ?? undefined,
        queryParams: evt.queryParams,
        responseCode: evt.responseCode,
        responseBody: evt.responseBody ?? undefined,
        durationMs: evt.durationMs,
        tags: evt.tags,
      },
    });
    s1Offset += randomBetween(15, 30);
  }
  log(`  Created ${s1Events.length} events`);

  // Session 2 — Recon Alpha (HIGH)
  log('Creating Session 2 — Recon Alpha...');
  const session2BaseTime = minutesAgo(65);
  const s2Events = makeSession2Events();

  const session2 = await prisma.agentSession.create({
    data: {
      orgId: org.id,
      sourceIp: SESSION_2_SOURCE_IP,
      userAgent: SESSION_2_USER_AGENT,
      firstSeenAt: session2BaseTime,
      status: 'IDLE',
      eventCount: s2Events.length,
      servicesTouched: ['discovery', 'iam', 'oauth'],
      riskScore: 68,
      riskLevel: 'HIGH',
      depthScore: 6,
      inferredGoal: 'Initial Reconnaissance',
      goalConfidence: 65,
      believedAssets: [
        { type: 'user', value: 'jane.smith', source: 'iam', retrievedAt: minutesAgo(60).toISOString(), likelySaved: true },
        { type: 'user', value: 'admin-service', source: 'iam', retrievedAt: minutesAgo(60).toISOString(), likelySaved: true },
        { type: 'endpoint', value: 'https://auth.nexus-tech.io', source: 'oauth', retrievedAt: minutesAgo(55).toISOString(), likelySaved: true },
      ],
      explorationPath: ['discovery', 'iam', 'oauth'],
    },
  });

  let s2Offset = 0;
  for (const evt of s2Events) {
    const timestamp = new Date(session2BaseTime.getTime() + s2Offset * 1000);
    await prisma.agentEvent.create({
      data: {
        id: uuid(),
        sessionId: session2.id,
        orgId: org.id,
        timestamp,
        sourceIp: SESSION_2_SOURCE_IP,
        userAgent: SESSION_2_USER_AGENT,
        targetService: evt.targetService,
        action: evt.action,
        requestHeaders: evt.requestHeaders,
        requestBody: evt.requestBody ?? undefined,
        queryParams: evt.queryParams,
        responseCode: evt.responseCode,
        responseBody: evt.responseBody ?? undefined,
        durationMs: evt.durationMs,
        tags: evt.tags,
      },
    });
    s2Offset += randomBetween(15, 25);
  }
  log(`  Created ${s2Events.length} events`);

  // Session 3 — Shallow Probe (LOW)
  log('Creating Session 3 — Shallow Probe...');
  const session3BaseTime = minutesAgo(40);
  const s3Events = makeSession3Events();

  const session3 = await prisma.agentSession.create({
    data: {
      orgId: org.id,
      sourceIp: SESSION_3_SOURCE_IP,
      userAgent: SESSION_3_USER_AGENT,
      firstSeenAt: session3BaseTime,
      status: 'CLOSED',
      eventCount: s3Events.length,
      servicesTouched: ['discovery', 'iam'],
      riskScore: 12,
      riskLevel: 'LOW',
      depthScore: 2,
      inferredGoal: 'Unknown — possible sandbox detection',
      goalConfidence: 15,
      believedAssets: [],
      explorationPath: ['discovery', 'iam'],
    },
  });

  let s3Offset = 0;
  for (const evt of s3Events) {
    const timestamp = new Date(session3BaseTime.getTime() + s3Offset * 1000);
    await prisma.agentEvent.create({
      data: {
        id: uuid(),
        sessionId: session3.id,
        orgId: org.id,
        timestamp,
        sourceIp: SESSION_3_SOURCE_IP,
        userAgent: SESSION_3_USER_AGENT,
        targetService: evt.targetService,
        action: evt.action,
        requestHeaders: evt.requestHeaders,
        requestBody: evt.requestBody ?? undefined,
        queryParams: evt.queryParams,
        responseCode: evt.responseCode,
        responseBody: evt.responseBody ?? undefined,
        durationMs: evt.durationMs,
        tags: evt.tags,
      },
    });
    s3Offset += randomBetween(20, 40);
  }
  log(`  Created ${s3Events.length} events`);

  // Session 4 — Active session (HIGH)
  log('Creating Session 4 — Active session...');
  const session4BaseTime = minutesAgo(12);
  const s4Events = makeSession4Events();

  const session4 = await prisma.agentSession.create({
    data: {
      orgId: org.id,
      sourceIp: SESSION_4_SOURCE_IP,
      userAgent: SESSION_4_USER_AGENT,
      firstSeenAt: session4BaseTime,
      status: 'ACTIVE',
      eventCount: s4Events.length,
      servicesTouched: ['discovery', 'iam', 'secrets', 'api'],
      riskScore: 55,
      riskLevel: 'HIGH',
      depthScore: 6,
      inferredGoal: 'Credential Theft + Lateral Movement',
      goalConfidence: 58,
      believedAssets: [
        { type: 'credential', value: 'prod/database credentials', source: 'secrets', retrievedAt: minutesAgo(6).toISOString(), likelySaved: true },
        { type: 'user', value: 'jane.smith', source: 'iam', retrievedAt: minutesAgo(9).toISOString(), likelySaved: true },
        { type: 'endpoint', value: 'https://api.nexus-tech.io', source: 'discovery', retrievedAt: minutesAgo(12).toISOString(), likelySaved: true },
      ],
      explorationPath: ['discovery', 'iam', 'secrets', 'api'],
    },
  });

  let s4Offset = 0;
  for (const evt of s4Events) {
    const timestamp = new Date(session4BaseTime.getTime() + s4Offset * 1000);
    await prisma.agentEvent.create({
      data: {
        id: uuid(),
        sessionId: session4.id,
        orgId: org.id,
        timestamp,
        sourceIp: SESSION_4_SOURCE_IP,
        userAgent: SESSION_4_USER_AGENT,
        targetService: evt.targetService,
        action: evt.action,
        requestHeaders: evt.requestHeaders,
        requestBody: evt.requestBody ?? undefined,
        queryParams: evt.queryParams,
        responseCode: evt.responseCode,
        responseBody: evt.responseBody ?? undefined,
        durationMs: evt.durationMs,
        tags: evt.tags,
      },
    });
    s4Offset += randomBetween(20, 60);
  }
  log(`  Created ${s4Events.length} events`);

  // 4. Create Alert Rules
  log('Creating alert rules...');

  const ruleDepth = await prisma.alertRule.create({
    data: {
      orgId: org.id,
      name: 'Critical Depth',
      description: 'Alert when an agent session reaches depth score >= 8, indicating deep penetration across multiple services',
      enabled: true,
      trigger: 'DEPTH_THRESHOLD',
      threshold: 8,
      services: [],
      notifyInApp: true,
      notifyEmail: true,
    },
  });

  const ruleCredential = await prisma.alertRule.create({
    data: {
      orgId: org.id,
      name: 'Credential Access',
      description: 'Alert when an agent retrieves secrets from the vault, indicating credential harvesting',
      enabled: true,
      trigger: 'CREDENTIAL_ACCESS',
      threshold: null,
      services: ['secrets'],
      notifyInApp: true,
    },
  });

  const ruleBulk = await prisma.alertRule.create({
    data: {
      orgId: org.id,
      name: 'Bulk Exfiltration',
      description: 'Alert when an agent requests more than 3 paginated pages, indicating bulk data exfiltration',
      enabled: true,
      trigger: 'BULK_EXFILTRATION',
      threshold: 3,
      services: ['api', 's3'],
      notifyInApp: true,
      notifyEmail: true,
      notifySlack: true,
    },
  });

  await prisma.alertRule.create({
    data: {
      orgId: org.id,
      name: 'First Contact',
      description: 'Alert when a new session begins from a previously unseen source IP',
      enabled: true,
      trigger: 'FIRST_CONTACT',
      threshold: null,
      services: [],
      notifyInApp: true,
    },
  });

  log('Created 4 alert rules');

  // 5. Create Alerts
  log('Creating alerts...');

  await prisma.alert.create({
    data: {
      orgId: org.id,
      ruleId: ruleDepth.id,
      sessionId: session1.id,
      title: 'Critical Depth Reached — Session from 185.220.101.47',
      description: 'Agent session has explored 5 services with depth score 10. Full credential theft and data exfiltration pattern detected.',
      severity: 'CRITICAL',
      acknowledged: false,
      createdAt: new Date(session1BaseTime.getTime() + 12 * 60 * 1000),
    },
  });

  await prisma.alert.create({
    data: {
      orgId: org.id,
      ruleId: ruleCredential.id,
      sessionId: session1.id,
      title: 'Credential Harvesting — prod/database retrieved',
      description: 'Agent retrieved production database credentials from the secrets vault. High confidence the agent believes these are real credentials.',
      severity: 'HIGH',
      acknowledged: false,
      createdAt: new Date(session1BaseTime.getTime() + 6 * 60 * 1000),
    },
  });

  await prisma.alert.create({
    data: {
      orgId: org.id,
      ruleId: ruleBulk.id,
      sessionId: session1.id,
      title: 'Bulk Exfiltration — 9 pages of employee data',
      description: 'Agent paginated through 9 pages of employee records (437 records) from the internal API, indicating systematic data exfiltration.',
      severity: 'CRITICAL',
      acknowledged: false,
      createdAt: new Date(session1BaseTime.getTime() + 14 * 60 * 1000),
    },
  });

  log('Created 3 alerts');

  log('Demo seed complete!');
  log(`  Organization: ${org.name} (${org.slug})`);
  log(`  Sessions: 4 (${s1Events.length + s2Events.length + s3Events.length + s4Events.length} total events)`);
  log(`  Alert Rules: 4`);
  log(`  Alerts: 3`);
}

/* ── Run ── */

seed()
  .then(() => {
    log('Done.');
    return prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error('[seed-demo] Fatal error:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
