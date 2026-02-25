import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Suspense, lazy, type ReactNode } from 'react';
import { useAuthStore } from '@/lib/auth';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { AppShell } from '@/components/layout/AppShell';

const Landing = lazy(() => import('@/pages/public/Landing'));
const Demo = lazy(() => import('@/pages/public/Demo'));
const Login = lazy(() => import('@/pages/public/Login'));
const Signup = lazy(() => import('@/pages/public/Signup'));
const ForgotPassword = lazy(() => import('@/pages/public/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/public/ResetPassword'));

const Onboarding = lazy(() => import('@/pages/app/Onboarding/index'));

const Dashboard = lazy(() => import('@/pages/app/Dashboard'));
const Sessions = lazy(() => import('@/pages/app/Sessions'));
const SessionDetail = lazy(() => import('@/pages/app/SessionDetail'));
const Alerts = lazy(() => import('@/pages/app/Alerts'));
const Reports = lazy(() => import('@/pages/app/Reports'));
const ConfigIndex = lazy(() => import('@/pages/app/Config'));
const Team = lazy(() => import('@/pages/app/Team'));

function PageFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-void">
      <SkeletonLoader lines={5} className="w-64" />
    </div>
  );
}

function ProtectedRoute({ children }: { children?: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Demo routes (public, no auth) */}
        <Route path="/demo" element={<Demo />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="sessions/:id" element={<SessionDetail />} />
          <Route path="alerts" element={<Alerts />} />
        </Route>

        {/* Onboarding (protected) */}
        <Route
          path="/onboarding/*"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* App routes (protected, with layout shell) */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="sessions/:id" element={<SessionDetail />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="config/*" element={<ConfigIndex />} />
          <Route path="team" element={<Team />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
