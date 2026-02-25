import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { GhostnetLogo } from '@/components/shared/GhostnetLogo';
import { useAuthStore } from '@/lib/auth';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { AxiosError } from 'axios';

const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address'),
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

type SignupFormData = z.infer<typeof signupSchema>;

interface InviteInfo {
  email: string;
  orgName: string;
  role: string;
}

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const signup = useAuthStore((s) => s.signup);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (!inviteToken) return;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<InviteInfo>(
          `/auth/invites/${inviteToken}`
        );
        if (cancelled) return;
        setInviteInfo(data);
        setValue('email', data.email);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AxiosError) {
          setInviteError(
            err.response?.data?.message ??
              'This invite link is invalid or has expired.'
          );
        } else {
          setInviteError('Failed to validate invite. Please try again.');
        }
      } finally {
        if (!cancelled) setInviteLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [inviteToken, setValue]);

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);
    try {
      await signup({
        name: data.name,
        email: data.email,
        password: data.password,
        inviteToken: inviteToken ?? '',
      });
      navigate('/onboarding');
    } catch (err) {
      if (err instanceof AxiosError) {
        const msg =
          err.response?.data?.message ?? err.response?.data?.error;
        setServerError(
          typeof msg === 'string' ? msg : 'Signup failed. Please try again.'
        );
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  if (inviteLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <Loader2 size={24} className="animate-spin text-cyan" />
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void px-4">
        <div className="w-full max-w-[400px] text-center">
          <GhostnetLogo size="lg" className="mb-8 justify-center" />
          <div className="rounded-card border border-border bg-surface p-6">
            <AlertCircle size={32} className="mx-auto mb-3 text-threat-critical" />
            <h2 className="mb-2 font-heading text-lg font-semibold text-text-primary">
              Invalid Invite
            </h2>
            <p className="mb-4 text-sm text-text-secondary">{inviteError}</p>
            <Link
              to="/login"
              className="text-sm font-medium text-cyan transition-opacity hover:opacity-80"
            >
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-4 py-8">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex justify-center">
          <GhostnetLogo size="lg" />
        </div>

        {inviteInfo && (
          <div className="mb-4 rounded-input border border-cyan/20 bg-cyan-dim px-3 py-2.5 text-center text-sm text-text-secondary">
            You've been invited to join{' '}
            <span className="font-medium text-cyan">{inviteInfo.orgName}</span>{' '}
            as {inviteInfo.role.toLowerCase()}
          </div>
        )}

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
                htmlFor="name"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary"
              >
                Full Name
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Smith"
                  className={cn(
                    'h-10 w-full rounded-input border bg-elevated pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors duration-150',
                    errors.name
                      ? 'border-threat-critical focus:ring-threat-critical'
                      : 'border-border focus:border-cyan focus:ring-cyan'
                  )}
                  {...register('name')}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-threat-critical">
                  {errors.name.message}
                </p>
              )}
            </div>

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
                  readOnly={!!inviteInfo}
                  className={cn(
                    'h-10 w-full rounded-input border bg-elevated pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors duration-150',
                    inviteInfo && 'cursor-not-allowed opacity-60',
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                Confirm Password
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
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
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
                'Create Account'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-cyan transition-opacity hover:opacity-80"
          >
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
