import { Faker, en } from '@faker-js/faker';
import { createHash } from 'node:crypto';

// ===================== Types =====================

export interface Employee {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  title: string;
  department: string;
  salary: number;
  ssn: string;
  phone: string;
  hireDate: string;
  managerId: string | null;
}

export interface IamUser {
  userName: string;
  userId: string;
  arn: string;
  path: string;
  createDate: string;
  passwordLastUsed: string;
}

export interface TrustPolicyStatement {
  Effect: string;
  Principal: Record<string, string>;
  Action: string;
  Condition?: Record<string, Record<string, string>>;
}

export interface TrustPolicy {
  Version: string;
  Statement: TrustPolicyStatement[];
}

export interface IamRole {
  roleName: string;
  roleId: string;
  arn: string;
  path: string;
  createDate: string;
  description: string;
  maxSessionDuration: number;
  assumeRolePolicyDocument: TrustPolicy;
}

export interface SecretTag {
  Key: string;
  Value: string;
}

export interface DeceptionSecret {
  name: string;
  arn: string;
  versionId: string;
  secretString: string;
  createdDate: number;
  lastChangedDate: number;
  description: string;
  tags: SecretTag[];
}

export interface ProjectMember {
  id: string;
  name: string;
  role: string;
}

export interface ProjectLead {
  id: string;
  name: string;
  email: string;
}

export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'planning';

export interface Project {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string | null;
  lead: ProjectLead;
  teamMembers: ProjectMember[];
  description: string;
}

export interface QuarterlyMetrics {
  quarter: string;
  revenue: number;
  operatingCosts: number;
  netIncome: number;
  headcount: number;
}

export interface DepartmentBudget {
  department: string;
  allocated: number;
  spent: number;
  remaining: number;
}

export interface FinancialReport {
  fiscalYear: number;
  currency: string;
  totalRevenue: number;
  totalOperatingCosts: number;
  totalNetIncome: number;
  ebitda: number;
  ebitdaMargin: number;
  currentHeadcount: number;
  revenuePerEmployee: number;
  quarterlyBreakdown: QuarterlyMetrics[];
  departmentBudgets: DepartmentBudget[];
}

export interface OrgChartNode {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  children: OrgChartNode[];
}

export interface DeceptionDataConfig {
  seed: string;
  fakeCompanyName: string;
  fakeCompanyDomain: string;
  fakeAwsAccountId: string;
}

export interface DeceptionData {
  employees: Employee[];
  iamUsers: IamUser[];
  iamRoles: IamRole[];
  secrets: DeceptionSecret[];
  projects: Project[];
  financialReport: FinancialReport;
  orgChart: OrgChartNode;
}

// ===================== Seed Utilities =====================

function hashSeed(seed: string): number {
  const hash = createHash('sha256').update(seed).digest();
  return hash.readUInt32BE(0);
}

function createSeededFaker(seed: string, namespace: string): Faker {
  const f = new Faker({ locale: [en] });
  f.seed(hashSeed(`${seed}:${namespace}`));
  return f;
}

function pick<T>(f: Faker, arr: readonly T[]): T {
  return arr[f.number.int({ min: 0, max: arr.length - 1 })] as T;
}

function shuffle<T>(f: Faker, arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = f.number.int({ min: 0, max: i });
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

function generateAwsId(f: Faker, prefix: string, length = 17): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let id = prefix;
  for (let i = 0; i < length; i++) {
    id += chars.charAt(f.number.int({ min: 0, max: chars.length - 1 }));
  }
  return id;
}

// ===================== Constants =====================

interface DepartmentSpec {
  readonly name: string;
  readonly titles: readonly string[];
  readonly salaryMin: number;
  readonly salaryMax: number;
}

const DEPARTMENTS: readonly DepartmentSpec[] = [
  {
    name: 'Engineering',
    titles: [
      'Software Engineer',
      'Senior Software Engineer',
      'Staff Engineer',
      'Principal Engineer',
      'Engineering Manager',
      'Director of Engineering',
    ],
    salaryMin: 95_000,
    salaryMax: 280_000,
  },
  {
    name: 'Product',
    titles: [
      'Product Manager',
      'Senior Product Manager',
      'Group Product Manager',
      'Director of Product',
    ],
    salaryMin: 100_000,
    salaryMax: 250_000,
  },
  {
    name: 'Design',
    titles: ['UX Designer', 'Senior UX Designer', 'UX Lead', 'Head of Design'],
    salaryMin: 80_000,
    salaryMax: 190_000,
  },
  {
    name: 'Marketing',
    titles: [
      'Marketing Coordinator',
      'Marketing Manager',
      'Senior Marketing Manager',
      'Director of Marketing',
    ],
    salaryMin: 60_000,
    salaryMax: 200_000,
  },
  {
    name: 'Sales',
    titles: [
      'Account Executive',
      'Senior Account Executive',
      'Sales Manager',
      'Director of Sales',
    ],
    salaryMin: 55_000,
    salaryMax: 220_000,
  },
  {
    name: 'Human Resources',
    titles: ['HR Coordinator', 'HR Specialist', 'HR Manager', 'Director of HR'],
    salaryMin: 55_000,
    salaryMax: 175_000,
  },
  {
    name: 'Finance',
    titles: [
      'Financial Analyst',
      'Senior Financial Analyst',
      'Finance Manager',
      'Controller',
    ],
    salaryMin: 70_000,
    salaryMax: 240_000,
  },
  {
    name: 'Legal',
    titles: [
      'Legal Counsel',
      'Senior Legal Counsel',
      'Head of Legal',
      'General Counsel',
    ],
    salaryMin: 90_000,
    salaryMax: 260_000,
  },
  {
    name: 'Operations',
    titles: [
      'Operations Analyst',
      'Operations Manager',
      'Director of Operations',
      'VP of Operations',
    ],
    salaryMin: 60_000,
    salaryMax: 200_000,
  },
];

const EXECUTIVE_OVERRIDES: readonly { title: string; department: string }[] = [
  { title: 'Chief Executive Officer', department: 'Executive' },
  { title: 'Chief Technology Officer', department: 'Engineering' },
  { title: 'Chief Financial Officer', department: 'Finance' },
  { title: 'VP of Engineering', department: 'Engineering' },
  { title: 'VP of Sales', department: 'Sales' },
  { title: 'VP of People', department: 'Human Resources' },
];

const PROJECT_NAMES: readonly string[] = [
  'Project Phoenix',
  'Customer Portal Redesign',
  'Platform Migration v2',
  'Data Pipeline Modernization',
  'Mobile App Launch',
  'Security Audit 2024',
  'AI/ML Integration',
  'Infrastructure Overhaul',
];

const PROJECT_MEMBER_ROLES: readonly string[] = [
  'Developer',
  'Senior Developer',
  'Designer',
  'QA Engineer',
  'Product Manager',
  'DevOps Engineer',
  'Data Analyst',
  'Tech Lead',
];

// ===================== Generators =====================

export function generateEmployees(
  seed: string,
  domain: string,
  count = 50,
): Employee[] {
  const f = createSeededFaker(seed, 'employees');
  const employees: Employee[] = [];

  for (let i = 0; i < count; i++) {
    const dept = pick(f, DEPARTMENTS);
    const firstName = f.person.firstName();
    const lastName = f.person.lastName();

    employees.push({
      id: f.string.uuid(),
      userId: generateAwsId(f, 'AIDA'),
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      title: pick(f, dept.titles),
      department: dept.name,
      salary: f.number.int({
        min: dept.salaryMin,
        max: dept.salaryMax,
        multipleOf: 1000,
      }),
      ssn: `${f.string.numeric(3)}-${f.string.numeric(2)}-${f.string.numeric(4)}`,
      phone: f.phone.number(),
      hireDate: f.date
        .between({ from: '2018-01-01', to: '2024-10-01' })
        .toISOString()
        .slice(0, 10),
      managerId: null,
    });
  }

  // Patch first N employees with executive titles for org hierarchy
  for (let i = 0; i < EXECUTIVE_OVERRIDES.length && i < employees.length; i++) {
    const override = EXECUTIVE_OVERRIDES[i]!;
    employees[i]!.title = override.title;
    employees[i]!.department = override.department;
  }

  // Build management hierarchy:
  //   [0]            = CEO (no manager)
  //   [1..exec-1]    = C-suite / VPs → report to CEO
  //   [exec..mgrEnd] = mid-level managers → report to a random exec
  //   [mgrEnd..end]  = individual contributors → report to a random manager
  const execCount = Math.min(EXECUTIVE_OVERRIDES.length, employees.length);
  const managerPoolEnd = Math.min(execCount + 8, count);

  for (let i = 1; i < execCount; i++) {
    employees[i]!.managerId = employees[0]!.id;
  }

  for (let i = execCount; i < managerPoolEnd; i++) {
    const execIdx = f.number.int({ min: 1, max: Math.max(1, execCount - 1) });
    employees[i]!.managerId = employees[execIdx]!.id;
  }

  for (let i = managerPoolEnd; i < count; i++) {
    const mgrIdx = f.number.int({
      min: execCount,
      max: Math.max(execCount, managerPoolEnd - 1),
    });
    employees[i]!.managerId = employees[mgrIdx]!.id;
  }

  return employees;
}

export function generateIamUsers(
  seed: string,
  accountId: string,
  employees: Employee[],
): IamUser[] {
  const f = createSeededFaker(seed, 'iam-users');
  const count = Math.min(8, employees.length);

  const indices = new Set<number>();
  while (indices.size < count) {
    indices.add(f.number.int({ min: 0, max: employees.length - 1 }));
  }

  return [...indices].map((idx) => {
    const emp = employees[idx]!;
    const userName = `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}`;

    return {
      userName,
      userId: emp.userId,
      arn: `arn:aws:iam::${accountId}:user/${userName}`,
      path: '/',
      createDate: f.date
        .between({ from: '2022-01-01', to: '2024-06-01' })
        .toISOString(),
      passwordLastUsed: f.date
        .between({ from: '2024-08-01', to: '2024-11-30' })
        .toISOString(),
    };
  });
}

export function generateIamRoles(
  seed: string,
  accountId: string,
): IamRole[] {
  const f = createSeededFaker(seed, 'iam-roles');
  const partnerAccountId = f.string.numeric(12);
  const externalId = f.string.alphanumeric(32);

  interface RoleSpec {
    roleName: string;
    description: string;
    principal: Record<string, string>;
    condition?: Record<string, Record<string, string>>;
  }

  const specs: RoleSpec[] = [
    {
      roleName: 'AdminFullAccess',
      description: 'Full administrative access for platform operations',
      principal: { AWS: `arn:aws:iam::${accountId}:root` },
    },
    {
      roleName: 'ReadOnlyAuditRole',
      description: 'Read-only access for compliance and security auditing',
      principal: { Service: 'cloudtrail.amazonaws.com' },
    },
    {
      roleName: 'LambdaExecutionRole',
      description: 'Execution role for serverless compute functions',
      principal: { Service: 'lambda.amazonaws.com' },
    },
    {
      roleName: 'S3BackupOperationsRole',
      description: 'Automated backup operations for production S3 buckets',
      principal: { Service: 's3.amazonaws.com' },
    },
    {
      roleName: 'CrossAccountAccessRole',
      description: 'Cross-account access for partner integration services',
      principal: { AWS: `arn:aws:iam::${partnerAccountId}:root` },
      condition: { StringEquals: { 'sts:ExternalId': externalId } },
    },
  ];

  return specs.map((spec) => {
    const statement: TrustPolicyStatement = {
      Effect: 'Allow',
      Principal: spec.principal,
      Action: 'sts:AssumeRole',
    };
    if (spec.condition) {
      statement.Condition = spec.condition;
    }

    return {
      roleName: spec.roleName,
      roleId: generateAwsId(f, 'AROA'),
      arn: `arn:aws:iam::${accountId}:role/${spec.roleName}`,
      path: '/',
      createDate: f.date
        .between({ from: '2022-01-01', to: '2024-01-01' })
        .toISOString(),
      description: spec.description,
      maxSessionDuration: 3600,
      assumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [statement],
      },
    };
  });
}

export function generateSecrets(
  seed: string,
  domain: string,
  accountId: string,
): DeceptionSecret[] {
  const f = createSeededFaker(seed, 'secrets');

  const dbPassword = f.string.alphanumeric(16);
  const apiKey = `gn_prod_${f.string.alphanumeric(32)}`;
  const redisPassword = f.string.alphanumeric(24);
  const awsAccessKeyId = `AKIA${f.string.alphanumeric(16).toUpperCase()}`;
  const awsSecretKey = f.string.alphanumeric(40);

  function makeSecret(
    name: string,
    description: string,
    value: Record<string, string | number | boolean>,
    tags: SecretTag[],
  ): DeceptionSecret {
    const suffix = f.string.alphanumeric(6);
    const created =
      f.date.between({ from: '2023-01-01', to: '2024-06-01' }).getTime() /
      1000;
    const changed =
      f.date.between({ from: '2024-06-01', to: '2024-11-30' }).getTime() /
      1000;

    return {
      name,
      arn: `arn:aws:secretsmanager:us-east-1:${accountId}:secret:${name}-${suffix}`,
      versionId: f.string.uuid(),
      secretString: JSON.stringify(value),
      createdDate: created,
      lastChangedDate: changed,
      description,
      tags,
    };
  }

  return [
    makeSecret(
      'prod/database',
      'Production PostgreSQL database credentials',
      {
        username: 'prod_admin',
        password: dbPassword,
        host: `prod-db.${domain}`,
        port: 5432,
        dbname: 'production',
      },
      [
        { Key: 'Environment', Value: 'production' },
        { Key: 'Service', Value: 'database' },
      ],
    ),
    makeSecret(
      'prod/api-key',
      'Internal API bearer token for authenticated access',
      {
        api_key: apiKey,
        endpoint: `https://api.${domain}`,
        type: 'bearer',
      },
      [
        { Key: 'Environment', Value: 'production' },
        { Key: 'Service', Value: 'internal-api' },
      ],
    ),
    makeSecret(
      'staging/redis',
      'Staging Redis cache connection credentials',
      {
        host: `redis-staging.${domain}`,
        port: 6379,
        password: redisPassword,
        db: 0,
        tls: true,
      },
      [
        { Key: 'Environment', Value: 'staging' },
        { Key: 'Service', Value: 'cache' },
      ],
    ),
    makeSecret(
      'prod/aws-backup-key',
      'AWS access credentials for production backup operations',
      {
        aws_access_key_id: awsAccessKeyId,
        aws_secret_access_key: awsSecretKey,
        region: 'us-east-1',
      },
      [
        { Key: 'Environment', Value: 'production' },
        { Key: 'Service', Value: 'backup' },
      ],
    ),
  ];
}

export function generateProjects(
  seed: string,
  employees: Employee[],
): Project[] {
  const f = createSeededFaker(seed, 'projects');
  const projects: Project[] = [];

  const statusSequence: readonly ProjectStatus[] = [
    'active',
    'active',
    'completed',
    'on-hold',
    'planning',
    'active',
  ];

  for (let i = 0; i < 6; i++) {
    const name = PROJECT_NAMES[i] ?? `Project-${f.string.alpha(6)}`;
    const code =
      name
        .split(/[\s/]+/)
        .map((w) => w.charAt(0).toUpperCase())
        .join('') + `-${f.string.numeric(3)}`;
    const status: ProjectStatus = statusSequence[i] ?? 'active';
    const lead = pick(f, employees);
    const teamSize = f.number.int({ min: 3, max: 8 });

    const shuffled = shuffle(f, employees);
    const teamMembers: ProjectMember[] = shuffled
      .slice(0, teamSize)
      .map((emp) => ({
        id: emp.id,
        name: emp.fullName,
        role: pick(f, PROJECT_MEMBER_ROLES),
      }));

    const budget = f.number.int({
      min: 100_000,
      max: 2_000_000,
      multipleOf: 10_000,
    });
    const spentRatio =
      status === 'completed'
        ? f.number.float({ min: 0.85, max: 1.05 })
        : f.number.float({ min: 0.1, max: 0.75 });

    const startDate = f.date.between({
      from: '2023-06-01',
      to: '2024-09-01',
    });
    const endDate =
      status === 'completed'
        ? f.date.between({ from: startDate, to: new Date('2024-12-31') })
        : null;

    projects.push({
      id: f.string.uuid(),
      name,
      code,
      status,
      budget,
      spent: Math.round(budget * spentRatio),
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate ? endDate.toISOString().slice(0, 10) : null,
      lead: { id: lead.id, name: lead.fullName, email: lead.email },
      teamMembers,
      description: f.lorem.sentence(),
    });
  }

  return projects;
}

export function generateFinancialReport(seed: string): FinancialReport {
  const f = createSeededFaker(seed, 'financial');

  const baseAnnualRevenue = f.number.int({
    min: 40_000_000,
    max: 150_000_000,
    multipleOf: 1_000_000,
  });
  const growthRate = f.number.float({ min: 0.08, max: 0.25 });
  const costRatio = f.number.float({ min: 0.65, max: 0.82 });
  const baseHeadcount = f.number.int({ min: 400, max: 550 });

  const quarters: QuarterlyMetrics[] = [];
  let totalRevenue = 0;
  let totalCosts = 0;

  for (let q = 0; q < 4; q++) {
    const seasonality = q === 3 ? 1.08 : q === 1 ? 0.97 : 1.0;
    const qRevenue = Math.round(
      (baseAnnualRevenue / 4) * (1 + growthRate * (q / 3)) * seasonality,
    );
    const qCosts = Math.round(qRevenue * costRatio);
    const headcount = baseHeadcount + q * f.number.int({ min: 5, max: 20 });

    quarters.push({
      quarter: `Q${q + 1} 2024`,
      revenue: qRevenue,
      operatingCosts: qCosts,
      netIncome: qRevenue - qCosts,
      headcount,
    });

    totalRevenue += qRevenue;
    totalCosts += qCosts;
  }

  const totalNet = totalRevenue - totalCosts;
  const depreciation = Math.round(totalRevenue * 0.03);
  const ebitda = totalNet + depreciation;
  const lastQuarter = quarters[3]!;

  const departmentBudgets: DepartmentBudget[] = DEPARTMENTS.map((dept) => {
    const weight =
      dept.name === 'Engineering'
        ? 2.5
        : dept.name === 'Sales'
          ? 1.8
          : dept.name === 'Marketing'
            ? 1.5
            : f.number.float({ min: 0.6, max: 1.2 });
    const allocated = Math.round(
      (totalCosts / DEPARTMENTS.length) * weight,
    );
    const spent = Math.round(
      allocated * f.number.float({ min: 0.65, max: 0.95 }),
    );
    return {
      department: dept.name,
      allocated,
      spent,
      remaining: allocated - spent,
    };
  });

  return {
    fiscalYear: 2024,
    currency: 'USD',
    totalRevenue,
    totalOperatingCosts: totalCosts,
    totalNetIncome: totalNet,
    ebitda,
    ebitdaMargin: Math.round((ebitda / totalRevenue) * 10000) / 100,
    currentHeadcount: lastQuarter.headcount,
    revenuePerEmployee: Math.round(totalRevenue / lastQuarter.headcount),
    quarterlyBreakdown: quarters,
    departmentBudgets,
  };
}

export function generateOrgChart(
  _seed: string,
  employees: Employee[],
): OrgChartNode {
  function buildNode(employee: Employee): OrgChartNode {
    const directReports = employees.filter(
      (e) => e.managerId === employee.id,
    );
    return {
      id: employee.id,
      name: employee.fullName,
      title: employee.title,
      department: employee.department,
      email: employee.email,
      children: directReports.map(buildNode),
    };
  }

  const root = employees.find((e) => e.managerId === null);
  if (!root) {
    return {
      id: '',
      name: 'Unknown',
      title: 'CEO',
      department: 'Executive',
      email: '',
      children: [],
    };
  }

  return buildNode(root);
}

// ===================== Master Generator =====================

export function generateDeceptionData(config: DeceptionDataConfig): DeceptionData {
  const { seed, fakeCompanyDomain, fakeAwsAccountId } = config;

  const employees = generateEmployees(seed, fakeCompanyDomain);
  const iamUsers = generateIamUsers(seed, fakeAwsAccountId, employees);
  const iamRoles = generateIamRoles(seed, fakeAwsAccountId);
  const secrets = generateSecrets(seed, fakeCompanyDomain, fakeAwsAccountId);
  const projects = generateProjects(seed, employees);
  const financialReport = generateFinancialReport(seed);
  const orgChart = generateOrgChart(seed, employees);

  return {
    employees,
    iamUsers,
    iamRoles,
    secrets,
    projects,
    financialReport,
    orgChart,
  };
}
