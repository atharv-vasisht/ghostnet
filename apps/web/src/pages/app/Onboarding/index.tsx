import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { GhostnetLogo } from '@/components/shared/GhostnetLogo';
import { Step1Identity } from './Step1Identity';
import { Step2Services } from './Step2Services';
import { Step3Deploy } from './Step3Deploy';
import { Step4Verify } from './Step4Verify';
import type {
  OnboardingStep,
  OnboardingState,
  IdentityData,
  ServiceId,
} from './types';

const STEPS: { step: OnboardingStep; label: string }[] = [
  { step: 1, label: 'Identity' },
  { step: 2, label: 'Services' },
  { step: 3, label: 'Deploy' },
  { step: 4, label: 'Verify' },
];

const DEFAULT_SERVICES: ServiceId[] = [
  'iam',
  'oauth',
  'secrets',
  'api',
  's3',
  'discovery',
];

const defaultIdentity: IdentityData = {
  companyName: '',
  domain: '',
  awsAccountId: '',
  industry: 'Technology',
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [state, setState] = useState<OnboardingState>({
    step: 1,
    identity: defaultIdentity,
    enabledServices: [...DEFAULT_SERVICES],
  });

  const setStep = useCallback((step: OnboardingStep) => {
    setState((s) => ({ ...s, step }));
  }, []);

  const setIdentity = useCallback((identity: IdentityData) => {
    setState((s) => ({ ...s, identity }));
  }, []);

  const toggleService = useCallback((id: ServiceId, enabled: boolean) => {
    setState((s) => {
      const next = enabled
        ? [...s.enabledServices, id]
        : s.enabledServices.filter((x) => x !== id);
      return { ...s, enabledServices: next };
    });
  }, []);

  const handleComplete = useCallback(() => {
    navigate('/app', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-void">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-center">
          <GhostnetLogo size="lg" />
        </div>

        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex gap-1">
            {STEPS.map(({ step, label }) => (
              <div key={step} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={cn(
                    'h-1.5 w-full rounded-full transition-colors duration-150',
                    state.step >= step ? 'bg-cyan' : 'bg-border'
                  )}
                />
                <span
                  className={cn(
                    'text-xs font-medium',
                    state.step >= step
                      ? 'text-cyan'
                      : 'text-text-muted'
                  )}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="rounded-card border border-border bg-surface p-6 sm:p-8">
          {state.step === 1 && (
            <>
              <h1 className="mb-2 font-heading text-xl font-semibold text-text-primary">
                Tell us about your fake enterprise
              </h1>
              <Step1Identity
                initialData={state.identity}
                onNext={(data) => {
                  setIdentity(data);
                  setStep(2);
                }}
              />
            </>
          )}

          {state.step === 2 && (
            <>
              <h1 className="mb-2 font-heading text-xl font-semibold text-text-primary">
                Choose your deception services
              </h1>
              <Step2Services
                enabledServices={state.enabledServices}
                onToggle={toggleService}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            </>
          )}

          {state.step === 3 && (
            <>
              <h1 className="mb-2 font-heading text-xl font-semibold text-text-primary">
                Your deception endpoints are ready
              </h1>
              <Step3Deploy
                domain={state.identity.domain}
                enabledServices={state.enabledServices}
                onNext={() => setStep(4)}
                onBack={() => setStep(2)}
              />
            </>
          )}

          {state.step === 4 && (
            <>
              <h1 className="mb-2 font-heading text-xl font-semibold text-text-primary">
                Waiting for first signal...
              </h1>
              <Step4Verify
                domain={state.identity.domain}
                enabledServices={state.enabledServices}
                onComplete={handleComplete}
                onBack={() => setStep(3)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
