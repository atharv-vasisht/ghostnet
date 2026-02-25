export type OnboardingStep = 1 | 2 | 3 | 4;

export interface IdentityData {
  companyName: string;
  domain: string;
  awsAccountId: string;
  industry: string;
}

export type ServiceId =
  | 'iam'
  | 'oauth'
  | 'secrets'
  | 'api'
  | 's3'
  | 'discovery';

export interface OnboardingState {
  step: OnboardingStep;
  identity: IdentityData;
  enabledServices: ServiceId[];
}
