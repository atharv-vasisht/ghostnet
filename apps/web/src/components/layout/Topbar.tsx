import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Settings, UserPlus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { LiveDot } from '@/components/shared/LiveDot';
import { useAuthStore } from '@/lib/auth';
import { cn } from '@/lib/utils';

const routeTitles: Record<string, string> = {
  '/app/dashboard': 'Overview',
  '/app/sessions': 'Sessions',
  '/app/alerts': 'Alerts',
  '/app/reports': 'Reports',
  '/app/config': 'Configuration',
  '/app/team': 'Team',
  '/demo/dashboard': 'Overview',
  '/demo/sessions': 'Sessions',
  '/demo/alerts': 'Alerts',
};

function resolveTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];
  if (pathname.startsWith('/app/sessions/') || pathname.startsWith('/demo/sessions/'))
    return 'Session Detail';
  if (pathname.startsWith('/app/config/')) return 'Configuration';
  return 'Dashboard';
}

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isDemo = useAuthStore((s) => s.isDemo);
  const logout = useAuthStore((s) => s.logout);
  const title = resolveTitle(location.pathname);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    if (isDemo) {
      navigate('/');
      return;
    }
    await logout();
    navigate('/login');
  };

  const displayName = isDemo ? 'Demo Analyst' : (user?.name ?? 'U');
  const displayEmail = isDemo ? 'demo@ghostnet.io' : (user?.email ?? '');

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="font-heading text-sm font-semibold text-text-primary">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 rounded-badge border border-border px-2.5 py-1">
          <LiveDot />
          <span className="text-xs font-medium text-threat-safe">LIVE</span>
        </div>

        <button className="relative rounded-input p-1.5 text-text-secondary transition-colors duration-150 hover:bg-elevated hover:text-text-primary">
          <Bell size={18} />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-threat-critical text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 rounded-input px-2 py-1 text-text-secondary transition-colors duration-150 hover:bg-elevated hover:text-text-primary"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-dim text-[10px] font-medium text-cyan">
              {initials}
            </div>
            <ChevronDown size={14} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-card border border-border bg-elevated py-1 shadow-lg">
              <div className="border-b border-border px-3 py-2">
                <p className="text-sm font-medium text-text-primary">
                  {displayName}
                </p>
                <p className="text-xs text-text-muted">{displayEmail}</p>
              </div>

              {isDemo ? (
                <>
                  <Link
                    to="/signup"
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-cyan transition-colors hover:bg-surface"
                  >
                    <UserPlus size={14} />
                    Sign Up Free
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
                  >
                    <LogOut size={14} />
                    Exit Demo
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/app/config');
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
                  >
                    <Settings size={14} />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
