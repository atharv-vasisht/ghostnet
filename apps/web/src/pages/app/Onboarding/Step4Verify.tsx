import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { CopyButton } from '@/components/shared/CopyButton';
import { cn } from '@/lib/utils';
import type { ServiceId } from './types';

function getOrgSlug(domain: string): string {
  const parts = domain.split('.');
  return parts[0] || domain.replace(/\./g, '-');
}

function getCurlCommand(serviceId: ServiceId, orgSlug: string): string {
  const base = `https://${serviceId}.${orgSlug}.ghostnet.io`;
  switch (serviceId) {
    case 'iam':
      return `curl -X POST "${base}/" -H "Content-Type: application/x-www-form-urlencoded" -d "Action=ListUsers&Version=2010-05-08"`;
    case 'oauth':
      return `curl "${base}/.well-known/openid-configuration"`;
    case 'secrets':
      return `curl -X POST "${base}/" -H "Content-Type: application/x-amz-json-1.1" -d '{"SecretId":"test"}'`;
    case 'api':
      return `curl "${base}/api/v1/employees"`;
    case 's3':
      return `curl -X GET "${base}/" -H "Host: ${serviceId}.${orgSlug}.ghostnet.io"`;
    case 'discovery':
      return `curl "${base}/services"`;
    default:
      return `curl "${base}/"`;
  }
}

interface Step4VerifyProps {
  domain: string;
  enabledServices: ServiceId[];
  onComplete: () => void;
  onBack: () => void;
}

export function Step4Verify({
  domain,
  enabledServices,
  onComplete,
  onBack,
}: Step4VerifyProps) {
  const [signalReceived, setSignalReceived] = useState(false);
  const orgSlug = getOrgSlug(domain);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSignalReceived(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const curlCommands = enabledServices.map((id) => ({
    id,
    command: getCurlCommand(id, orgSlug),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-6">
        {signalReceived ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-threat-safe/20">
              <Check size={32} className="text-threat-safe" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-text-primary">
              Signal received! Your environment is live.
            </h3>
          </div>
        ) : (
          <>
            <div className="relative">
              <div
                className={cn(
                  'h-24 w-24 rounded-full border-2 border-cyan/40',
                  'animate-radar-pulse'
                )}
              />
              <div
                className={cn(
                  'absolute inset-0 flex items-center justify-center',
                  'rounded-full bg-cyan/10'
                )}
              >
                <div
                  className={cn(
                    'h-3 w-3 rounded-full bg-cyan',
                    'animate-radar-dot'
                  )}
                />
              </div>
            </div>
            <p className="text-center text-sm text-text-secondary">
              Waiting for first signal...
            </p>
            <p className="text-center text-sm text-text-secondary">
              Run a test probe against any endpoint to confirm your environment
              is live.
            </p>
          </>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="font-heading text-sm font-semibold text-text-primary">
          Test commands
        </h4>
        <div className="space-y-2">
          {curlCommands.map(({ id, command }) => (
            <div
              key={id}
              className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <code className="break-all font-mono text-xs text-text-primary">
                {command}
              </code>
              <CopyButton value={command} className="shrink-0" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 pt-4">
        {signalReceived ? (
          <Link
            to="/app"
            onClick={onComplete}
            className="flex items-center justify-center gap-2 rounded-input bg-cyan px-6 py-3 font-heading text-sm font-semibold text-void transition-opacity hover:opacity-90"
          >
            Go to Dashboard
            <ArrowRight size={18} />
          </Link>
        ) : (
          <>
            <Link
              to="/app"
              onClick={onComplete}
              className="text-center text-sm text-text-secondary underline transition-colors hover:text-cyan"
            >
              Skip for now
            </Link>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={onBack}
                className="rounded-input border border-border bg-elevated px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-border hover:text-text-primary"
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
