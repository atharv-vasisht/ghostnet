import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Globe, Hash, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IdentityData } from './types';

function generateRandomAwsAccountId(): string {
  return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join(
    ''
  );
}

const identitySchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  domain: z
    .string()
    .min(1, 'Domain is required')
    .refine((val) => val.includes('.'), 'Domain must contain a dot (e.g., acme-internal.io)'),
  awsAccountId: z
    .string()
    .length(12, 'AWS Account ID must be exactly 12 digits')
    .regex(/^\d{12}$/, 'AWS Account ID must be 12 digits'),
  industry: z.string().min(1, 'Industry is required'),
});

export type IdentityFormData = z.infer<typeof identitySchema>;

interface Step1IdentityProps {
  initialData: IdentityData;
  onNext: (data: IdentityData) => void;
  onBack?: () => void;
}

const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Manufacturing',
  'Other',
] as const;

export function Step1Identity({
  initialData,
  onNext,
  onBack,
}: Step1IdentityProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IdentityFormData>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      companyName: initialData.companyName || '',
      domain: initialData.domain || '',
      awsAccountId: initialData.awsAccountId || generateRandomAwsAccountId(),
      industry: initialData.industry || 'Technology',
    },
  });

  const awsAccountId = watch('awsAccountId');

  useEffect(() => {
    if (!initialData.awsAccountId && !awsAccountId) {
      setValue('awsAccountId', generateRandomAwsAccountId());
    }
  }, [initialData.awsAccountId, awsAccountId, setValue]);

  const handleGenerateAccountId = () => {
    setValue('awsAccountId', generateRandomAwsAccountId(), {
      shouldValidate: true,
    });
  };

  const onSubmit = (data: IdentityFormData) => {
    onNext({
      companyName: data.companyName,
      domain: data.domain,
      awsAccountId: data.awsAccountId,
      industry: data.industry,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <p className="text-sm text-text-secondary">
        This creates your deception environment&apos;s identity. Choose something
        realistic for your industry.
      </p>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="companyName"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary"
          >
            Fake Company Name
          </label>
          <div className="relative">
            <Building2
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              id="companyName"
              type="text"
              placeholder="Acme Corp"
              className={cn(
                'h-10 w-full rounded-input border bg-elevated pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors duration-150',
                errors.companyName
                  ? 'border-threat-critical focus:ring-threat-critical'
                  : 'border-border focus:border-cyan focus:ring-cyan'
              )}
              {...register('companyName')}
            />
          </div>
          {errors.companyName && (
            <p className="mt-1 text-xs text-threat-critical">
              {errors.companyName.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="domain"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary"
          >
            Fake Domain
          </label>
          <div className="relative">
            <Globe
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              id="domain"
              type="text"
              placeholder="acme-internal.io"
              className={cn(
                'h-10 w-full rounded-input border bg-elevated pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors duration-150',
                errors.domain
                  ? 'border-threat-critical focus:ring-threat-critical'
                  : 'border-border focus:border-cyan focus:ring-cyan'
              )}
              {...register('domain')}
            />
          </div>
          {errors.domain && (
            <p className="mt-1 text-xs text-threat-critical">
              {errors.domain.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="awsAccountId"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary"
          >
            AWS Account ID
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                id="awsAccountId"
                type="text"
                inputMode="numeric"
                maxLength={12}
                placeholder="123456789012"
                className={cn(
                  'h-10 w-full rounded-input border bg-elevated pl-9 pr-3 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors duration-150',
                  errors.awsAccountId
                    ? 'border-threat-critical focus:ring-threat-critical'
                    : 'border-border focus:border-cyan focus:ring-cyan'
                )}
                {...register('awsAccountId')}
              />
            </div>
            <button
              type="button"
              onClick={handleGenerateAccountId}
              className="rounded-input border border-border bg-elevated px-3 text-xs font-medium text-text-secondary transition-colors hover:bg-border hover:text-text-primary"
            >
              Generate
            </button>
          </div>
          {errors.awsAccountId && (
            <p className="mt-1 text-xs text-threat-critical">
              {errors.awsAccountId.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="industry"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary"
          >
            Industry
          </label>
          <div className="relative">
            <Briefcase
              size={16}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-text-muted"
            />
            <select
              id="industry"
              className={cn(
                'h-10 w-full appearance-none rounded-input border bg-elevated pl-9 pr-8 text-sm text-text-primary focus:outline-none focus:ring-1 transition-colors duration-150',
                errors.industry
                  ? 'border-threat-critical focus:ring-threat-critical'
                  : 'border-border focus:border-cyan focus:ring-cyan'
              )}
              {...register('industry')}
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              ▼
            </span>
          </div>
          {errors.industry && (
            <p className="mt-1 text-xs text-threat-critical">
              {errors.industry.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="rounded-input border border-border bg-elevated px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-border hover:text-text-primary"
          >
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          type="submit"
          className="rounded-input bg-cyan px-6 py-2 font-heading text-sm font-semibold text-void transition-opacity hover:opacity-90"
        >
          Next
        </button>
      </div>
    </form>
  );
}
