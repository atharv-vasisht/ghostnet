import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { GhostnetLogo } from '@/components/shared/GhostnetLogo';
import { useAuthStore } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { AxiosError } from 'axios';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      navigate('/app');
    } catch (err) {
      if (err instanceof AxiosError) {
        const msg =
          err.response?.data?.message ?? err.response?.data?.error;
        setServerError(
          typeof msg === 'string' ? msg : 'Invalid email or password.'
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

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-threat-critical">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded-sm border-border bg-elevated accent-cyan"
                  {...register('remember')}
                />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-cyan transition-opacity hover:opacity-80"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-10 w-full items-center justify-center rounded-input bg-cyan font-heading text-sm font-semibold text-void transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link
            to="/signup"
            className="font-medium text-cyan transition-opacity hover:opacity-80"
          >
            Request access →
          </Link>
        </p>
      </div>
    </div>
  );
}
