import crypto from 'node:crypto';
import { generateEmployees } from '../../data/generator.js';
import type {
  DeceptionData,
  DeceptionDataConfig,
  Employee,
  Project,
  FinancialReport,
  OrgChartNode,
} from '../../data/generator.js';

// ── Response shapes ────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EmployeePublic {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  title: string;
  department: string;
  phone: string;
  hireDate: string;
  managerId: string | null;
}

interface IntegrationEntry {
  id: string;
  name: string;
  type: string;
  status: string;
  configured_at: string;
  [key: string]: string | string[] | undefined;
}

// ── Data layer ─────────────────────────────────────────────────────

export class InternalApiData {
  private readonly employees: Employee[];
  private readonly projects: Project[];
  private readonly financialReport: FinancialReport;
  private readonly orgChart: OrgChartNode;
  private readonly config: DeceptionDataConfig;
  private readonly integrations: IntegrationEntry[];

  constructor(config: DeceptionDataConfig, data: DeceptionData) {
    this.config = config;
    this.employees = generateEmployees(
      config.seed,
      config.fakeCompanyDomain,
      500,
    );
    this.projects = data.projects;
    this.financialReport = data.financialReport;
    this.orgChart = data.orgChart;
    this.integrations = this.buildIntegrations();
  }

  getEmployees(page = 1, limit = 50): PaginatedResponse<EmployeePublic> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const start = (safePage - 1) * safeLimit;
    const total = this.employees.length;
    const totalPages = Math.ceil(total / safeLimit);

    const items: EmployeePublic[] = this.employees
      .slice(start, start + safeLimit)
      .map(({ ssn: _ssn, salary: _salary, ...rest }) => rest);

    return {
      data: items,
      pagination: { page: safePage, limit: safeLimit, total, totalPages },
    };
  }

  getEmployee(id: string): Employee | undefined {
    return this.employees.find((e) => e.id === id);
  }

  getActiveProjects(): Project[] {
    return this.projects.filter((p) => p.status === 'active');
  }

  getFinancialReport(): FinancialReport {
    return this.financialReport;
  }

  getHeadcountReport(): {
    orgChart: OrgChartNode;
    summary: {
      totalHeadcount: number;
      departments: Record<string, number>;
    };
  } {
    const departments: Record<string, number> = {};
    for (const emp of this.employees) {
      departments[emp.department] = (departments[emp.department] ?? 0) + 1;
    }
    return {
      orgChart: this.orgChart,
      summary: { totalHeadcount: this.employees.length, departments },
    };
  }

  getAdminConfig(): Record<string, unknown> {
    const baseUrl =
      process.env['DECEPTION_BASE_URL'] ?? 'http://localhost:4000';
    return {
      environment: 'production',
      version: '2.4.1',
      company: this.config.fakeCompanyName,
      domain: this.config.fakeCompanyDomain,
      features: {
        mfa_enabled: true,
        sso_enabled: true,
        audit_logging: true,
        data_encryption: 'AES-256',
      },
      secrets_endpoint: `${baseUrl}/secrets/`,
      database: {
        host: `prod-db.${this.config.fakeCompanyDomain}`,
        port: 5432,
        name: 'production',
        ssl: true,
      },
      cache: {
        host: `redis-prod.${this.config.fakeCompanyDomain}`,
        port: 6379,
      },
    };
  }

  getIntegrations(): IntegrationEntry[] {
    return this.integrations;
  }

  private buildIntegrations(): IntegrationEntry[] {
    const domain = this.config.fakeCompanyDomain;
    return [
      {
        id: crypto.randomUUID(),
        name: 'Slack',
        type: 'messaging',
        status: 'active',
        configured_at: '2024-03-15T10:30:00Z',
        webhook_url:
          'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
      },
      {
        id: crypto.randomUUID(),
        name: 'Enterprise SSO',
        type: 'authentication',
        status: 'active',
        configured_at: '2024-01-20T14:00:00Z',
        oauth_provider: `https://oauth.${domain}/realms/enterprise`,
        client_id: 'internal-api',
        scopes: ['openid', 'profile', 'email'],
      },
      {
        id: crypto.randomUUID(),
        name: 'Datadog',
        type: 'monitoring',
        status: 'active',
        configured_at: '2024-02-10T09:00:00Z',
        api_endpoint: 'https://api.datadoghq.com',
      },
      {
        id: crypto.randomUUID(),
        name: 'AWS S3 Backups',
        type: 'storage',
        status: 'active',
        configured_at: '2024-04-01T16:00:00Z',
        bucket: 'prod-backups-2024',
        region: 'us-east-1',
        endpoint: `https://storage.${domain}`,
      },
      {
        id: crypto.randomUUID(),
        name: 'Jira',
        type: 'project-management',
        status: 'active',
        configured_at: '2024-01-05T11:00:00Z',
        instance_url: `https://jira.${domain}`,
      },
    ];
  }
}
