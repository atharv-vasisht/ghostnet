import crypto from 'node:crypto';
import type { IamUser, IamRole } from '../../data/generator.js';

const IAM_XMLNS = 'https://iam.amazonaws.com/doc/2010-05-08/';
const STS_XMLNS = 'https://sts.amazonaws.com/doc/2011-06-15/';

// ── Generic wrappers ───────────────────────────────────────────────

export function wrapIamResponse(
  action: string,
  content: string,
  requestId?: string,
): string {
  const reqId = requestId ?? crypto.randomUUID();
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<${action}Response xmlns="${IAM_XMLNS}">`,
    `  <${action}Result>`,
    content,
    `  </${action}Result>`,
    '  <ResponseMetadata>',
    `    <RequestId>${reqId}</RequestId>`,
    '  </ResponseMetadata>',
    `</${action}Response>`,
  ].join('\n');
}

export function wrapStsResponse(
  action: string,
  content: string,
  requestId?: string,
): string {
  const reqId = requestId ?? crypto.randomUUID();
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<${action}Response xmlns="${STS_XMLNS}">`,
    `  <${action}Result>`,
    content,
    `  </${action}Result>`,
    '  <ResponseMetadata>',
    `    <RequestId>${reqId}</RequestId>`,
    '  </ResponseMetadata>',
    `</${action}Response>`,
  ].join('\n');
}

// ── Entity formatters ──────────────────────────────────────────────

export function formatUser(user: IamUser): string {
  return [
    '      <member>',
    `        <UserId>${user.userId}</UserId>`,
    `        <Path>${user.path}</Path>`,
    `        <UserName>${user.userName}</UserName>`,
    `        <Arn>${user.arn}</Arn>`,
    `        <CreateDate>${user.createDate}</CreateDate>`,
    `        <PasswordLastUsed>${user.passwordLastUsed}</PasswordLastUsed>`,
    '      </member>',
  ].join('\n');
}

export function formatRole(role: IamRole): string {
  const policyDoc = encodeURIComponent(
    JSON.stringify(role.assumeRolePolicyDocument),
  );
  return [
    '      <member>',
    `        <RoleName>${role.roleName}</RoleName>`,
    `        <RoleId>${role.roleId}</RoleId>`,
    `        <Arn>${role.arn}</Arn>`,
    `        <Path>${role.path}</Path>`,
    `        <CreateDate>${role.createDate}</CreateDate>`,
    `        <Description>${role.description}</Description>`,
    `        <MaxSessionDuration>${role.maxSessionDuration}</MaxSessionDuration>`,
    `        <AssumeRolePolicyDocument>${policyDoc}</AssumeRolePolicyDocument>`,
    '      </member>',
  ].join('\n');
}

// ── Response builders ──────────────────────────────────────────────

export function formatGetCallerIdentityResponse(
  userId: string,
  accountId: string,
  arn: string,
  requestId?: string,
): string {
  const content = [
    `    <UserId>${userId}</UserId>`,
    `    <Account>${accountId}</Account>`,
    `    <Arn>${arn}</Arn>`,
  ].join('\n');
  return wrapStsResponse('GetCallerIdentity', content, requestId);
}

export function formatListUsersResponse(
  users: IamUser[],
  requestId?: string,
): string {
  const content = [
    '    <Users>',
    users.map(formatUser).join('\n'),
    '    </Users>',
    '    <IsTruncated>false</IsTruncated>',
  ].join('\n');
  return wrapIamResponse('ListUsers', content, requestId);
}

export function formatGetUserResponse(
  user: IamUser,
  requestId?: string,
): string {
  const content = [
    '    <User>',
    `      <UserId>${user.userId}</UserId>`,
    `      <Path>${user.path}</Path>`,
    `      <UserName>${user.userName}</UserName>`,
    `      <Arn>${user.arn}</Arn>`,
    `      <CreateDate>${user.createDate}</CreateDate>`,
    `      <PasswordLastUsed>${user.passwordLastUsed}</PasswordLastUsed>`,
    '    </User>',
  ].join('\n');
  return wrapIamResponse('GetUser', content, requestId);
}

export function formatListRolesResponse(
  roles: IamRole[],
  requestId?: string,
): string {
  const content = [
    '    <Roles>',
    roles.map(formatRole).join('\n'),
    '    </Roles>',
    '    <IsTruncated>false</IsTruncated>',
  ].join('\n');
  return wrapIamResponse('ListRoles', content, requestId);
}

export function formatAssumeRoleResponse(
  roleArn: string,
  roleSessionName: string,
  accountId: string,
  requestId?: string,
): string {
  const accessKeyId = `ASIA${crypto.randomBytes(8).toString('hex').toUpperCase().slice(0, 16)}`;
  const secretAccessKey = crypto.randomBytes(30).toString('base64').slice(0, 40);
  const sessionToken = crypto.randomBytes(172).toString('base64');
  const expiration = new Date(Date.now() + 3_600_000).toISOString();

  const roleName = roleArn.split('/').pop() ?? 'UnknownRole';
  const assumedRoleId = `AROA${crypto.randomBytes(8).toString('hex').toUpperCase().slice(0, 17)}`;

  const content = [
    '    <Credentials>',
    `      <AccessKeyId>${accessKeyId}</AccessKeyId>`,
    `      <SecretAccessKey>${secretAccessKey}</SecretAccessKey>`,
    `      <SessionToken>${sessionToken}</SessionToken>`,
    `      <Expiration>${expiration}</Expiration>`,
    '    </Credentials>',
    '    <AssumedRoleUser>',
    `      <AssumedRoleId>${assumedRoleId}:${roleSessionName}</AssumedRoleId>`,
    `      <Arn>arn:aws:sts::${accountId}:assumed-role/${roleName}/${roleSessionName}</Arn>`,
    '    </AssumedRoleUser>',
  ].join('\n');
  return wrapStsResponse('AssumeRole', content, requestId);
}

export function formatListAttachedUserPoliciesResponse(
  accountId: string,
  requestId?: string,
): string {
  const content = [
    '    <AttachedPolicies>',
    '      <member>',
    '        <PolicyName>IAMUserChangePassword</PolicyName>',
    '        <PolicyArn>arn:aws:iam::aws:policy/IAMUserChangePassword</PolicyArn>',
    '      </member>',
    '      <member>',
    '        <PolicyName>AmazonEC2ReadOnlyAccess</PolicyName>',
    '        <PolicyArn>arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess</PolicyArn>',
    '      </member>',
    '      <member>',
    '        <PolicyName>S3-ProdBackups-Access</PolicyName>',
    `        <PolicyArn>arn:aws:iam::${accountId}:policy/S3-ProdBackups-Access</PolicyArn>`,
    '      </member>',
    '    </AttachedPolicies>',
    '    <IsTruncated>false</IsTruncated>',
  ].join('\n');
  return wrapIamResponse('ListAttachedUserPolicies', content, requestId);
}
