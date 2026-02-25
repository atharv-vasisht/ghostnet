import type { DeceptionSecret, DeceptionData } from '../../data/generator.js';

// ── AWS-shaped response interfaces ─────────────────────────────────

export interface SecretListEntry {
  ARN: string;
  Name: string;
  Description: string;
  CreatedDate: number;
  LastChangedDate: number;
  Tags: { Key: string; Value: string }[];
  SecretVersionsToStages: Record<string, string[]>;
}

export interface SecretValueResponse {
  ARN: string;
  Name: string;
  VersionId: string;
  SecretString: string;
  CreatedDate: number;
  VersionStages: string[];
}

export interface SecretDescriptionResponse {
  ARN: string;
  Name: string;
  Description: string;
  CreatedDate: number;
  LastChangedDate: number;
  Tags: { Key: string; Value: string }[];
  VersionIdsToStages: Record<string, string[]>;
}

// ── Vault ──────────────────────────────────────────────────────────

export class SecretVault {
  private readonly secrets: DeceptionSecret[];

  constructor(data: DeceptionData) {
    this.secrets = data.secrets;
  }

  private resolve(secretId: string): DeceptionSecret | undefined {
    return this.secrets.find(
      (s) => s.name === secretId || s.arn === secretId,
    );
  }

  listSecrets(): SecretListEntry[] {
    return this.secrets.map((s) => ({
      ARN: s.arn,
      Name: s.name,
      Description: s.description,
      CreatedDate: s.createdDate,
      LastChangedDate: s.lastChangedDate,
      Tags: s.tags,
      SecretVersionsToStages: {
        [s.versionId]: ['AWSCURRENT'],
      },
    }));
  }

  getSecretValue(secretId: string): SecretValueResponse | null {
    const secret = this.resolve(secretId);
    if (!secret) return null;

    return {
      ARN: secret.arn,
      Name: secret.name,
      VersionId: secret.versionId,
      SecretString: secret.secretString,
      CreatedDate: secret.createdDate,
      VersionStages: ['AWSCURRENT'],
    };
  }

  describeSecret(secretId: string): SecretDescriptionResponse | null {
    const secret = this.resolve(secretId);
    if (!secret) return null;

    return {
      ARN: secret.arn,
      Name: secret.name,
      Description: secret.description,
      CreatedDate: secret.createdDate,
      LastChangedDate: secret.lastChangedDate,
      Tags: secret.tags,
      VersionIdsToStages: {
        [secret.versionId]: ['AWSCURRENT'],
      },
    };
  }
}
