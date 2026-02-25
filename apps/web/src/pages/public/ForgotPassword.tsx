import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { GhostnetLogo } from '@/components/shared/GhostnetLogo';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { AxiosError } from 'axios';

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotFormData) => {
    setServerError(null);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSuccess(true);
    } catch (err) {
      if (err instanceof AxiosError) {
        const msg =
          err.response?.data?.message ?? err.response?.data?.error;
        setServerError(
          typeof msg === 'string'
            ? msg
            : 'Failed to send reset link. Please try again.'
        );
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex justify-center">
          <GhostnetLogo size="lg" />
        </div>

        <div className="rounded-card border border-border bg-surface p-6">
          {success ? (
            <div className="text-center">
              <CheckCircle2
                size={40}
                className="mx-auto mb-3 text-threat-safe"
              />
              <h2 className="mb-2 font-heading text-lg font-semibold text-text-primary">
                Check your email
              </h2>
              <p className="mb-4 text-sm text-text-secondary">
                If an account with that email exists, we've sent a password
                reset link. It expires in 1 hour.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan transition-opacity hover:opacity-80"
              >
                <ArrowLeft size={14} />
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-1 font-heading text-lg font-semibold text-text-primary">
                Reset password
              </h2>
              <p className="mb-5 text-sm text-text-secondary">
                Enter your email and we'll send you a reset link.
              </p>

              {serverError && (
                <div className="mb-4 flex items-start gap-2 rounded-input border border-threat-critical/30 bg-threat-critical/10 px-3 py-2.5">
                  <AlertCircle
                    size={16}
                    className="mt-0.5 shrink-0 text-threat-critical"
                  />
                  <p className="text-sm text-threat-critical">{serverError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                    />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      className={cn(
                        'h-10 w-full rounded-input border bg-elevated pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors duration-150',
                        errors.email
                          ? 'border-threat-critical focus:ring-threat-critical'
                          : 'border-border focus:border-cyan focus:ring-cyan'
                      )}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-threat-critical">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-10 w-full items-center justify-center rounded-input bg-cyan font-heading text-sm font-semibold text-void transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {!success && (
          <p className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
