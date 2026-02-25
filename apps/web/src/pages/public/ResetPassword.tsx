import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { GhostnetLogo } from '@/components/shared/GhostnetLogo';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { AxiosError } from 'axios';

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenChecking, setTokenChecking] = useState(true);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setTokenChecking(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await api.get(`/auth/reset-password/validate`, {
          params: { token },
        });
        if (!cancelled) setTokenValid(true);
      } catch {
        if (!cancelled) setTokenValid(false);
      } finally {
        if (!cancelled) setTokenChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate('/login'), 3000);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const onSubmit = async (data: ResetFormData) => {
    if (!token) return;
    setServerError(null);
    try {
      await api.post('/auth/reset-password', {
        token,
        password: data.password,
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof AxiosError) {
        const msg =
          err.response?.data?.message ?? err.response?.data?.error;
        setServerError(
          typeof msg === 'string'
            ? msg
            : 'Failed to reset password. Please try again.'
        );
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  if (tokenChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <Loader2 size={24} className="animate-spin text-cyan" />
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void px-4">
        <div className="w-full max-w-[400px] text-center">
          <GhostnetLogo size="lg" className="mb-8 justify-center" />
          <div className="rounded-card border border-border bg-surface p-6">
            <AlertCircle
              size={32}
              className="mx-auto mb-3 text-threat-critical"
            />
            <h2 className="mb-2 font-heading text-lg font-semibold text-text-primary">
              Invalid or Expired Link
            </h2>
            <p className="mb-4 text-sm text-text-secondary">
              This password reset link is invalid or has expired. Please request
              a new one.
            </p>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-cyan transition-opacity hover:opacity-80"
            >
              Request new reset link →
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                Password reset
              </h2>
              <p className="text-sm text-text-secondary">
                Your password has been updated. Redirecting to login...
              </p>
            </div>
          ) : (
            <>
              <h2 className="mb-1 font-heading text-lg font-semibold text-text-primary">
                Set new password
              </h2>
              <p className="mb-5 text-sm text-text-secondary">
                Choose a new password for your account.
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
                    htmlFor="password"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                    />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      className={cn(
                        'h-10 w-full rounded-input border bg-elevated pl-9 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors duration-150',
                        errors.password
                          ? 'border-threat-critical focus:ring-threat-critical'
                          : 'border-border focus:border-cyan focus:ring-cyan'
                      )}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
                    >
                      {showPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-threat-critical">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                    />
                    <input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      className={cn(
                        'h-10 w-full rounded-input border bg-elevated pl-9 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors duration-150',
                        errors.confirmPassword
                          ? 'border-threat-critical focus:ring-threat-critical'
                          : 'border-border focus:border-cyan focus:ring-cyan'
                      )}
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
                    >
                      {showConfirm ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-threat-critical">
                      {errors.confirmPassword.message}
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
                    'Reset Password'
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
