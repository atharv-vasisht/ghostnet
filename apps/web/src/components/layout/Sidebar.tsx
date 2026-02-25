import { NavLink, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Activity,
  Bell,
  FileText,
  Settings,
  Users,
  LogOut,
} from 'lucide-react';
import { GhostnetLogo } from '@/components/shared/GhostnetLogo';
import { useAuthStore } from '@/lib/auth';
import { useDemoGuard } from '@/hooks/useDemoGuard';
import { cn } from '@/lib/utils';

interface SidebarProps {
  basePath?: string;
  demoMode?: boolean;
}

function getNavItems(basePath: string) {
  return [
    { to: `${basePath}/dashboard`, label: 'Overview', icon: LayoutDashboard },
    { to: `${basePath}/sessions`, label: 'Sessions', icon: Activity },
    { to: `${basePath}/alerts`, label: 'Alerts', icon: Bell },
    { to: `${basePath}/reports`, label: 'Reports', icon: FileText, gatedInDemo: true },
  ];
}

function getSecondaryItems(basePath: string) {
  return [
    { to: `${basePath}/config`, label: 'Configuration', icon: Settings, gatedInDemo: true },
    { to: `${basePath}/team`, label: 'Team', icon: Users, gatedInDemo: true },
  ];
}

function UserInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-dim text-xs font-medium text-cyan">
      {initials}
    </div>
  );
}

function NavItemLink({
  item,
  isDemoGated,
  onGated,
}: {
  item: { to: string; label: string; icon: LucideIcon };
  isDemoGated: boolean;
  onGated: () => void;
}) {
  if (isDemoGated) {
    return (
      <button
        type="button"
        onClick={onGated}
        className="flex h-10 w-full items-center gap-3 rounded-input border-l-2 border-transparent px-4 text-sm text-text-secondary transition-colors duration-150 hover:bg-elevated hover:text-text-primary"
      >
        <item.icon size={18} />
        {item.label}
      </button>
    );
  }

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'flex h-10 items-center gap-3 rounded-input px-4 text-sm transition-colors duration-150',
          isActive
            ? 'border-l-2 border-cyan bg-cyan-dim text-cyan'
            : 'border-l-2 border-transparent text-text-secondary hover:bg-elevated hover:text-text-primary'
        )
      }
    >
      <item.icon size={18} />
      {item.label}
    </NavLink>
  );
}

export function Sidebar({ basePath = '/app', demoMode = false }: SidebarProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { showGuard } = useDemoGuard();

  const navItems = getNavItems(basePath);
  const secondaryItems = getSecondaryItems(basePath);

  const handleLogout = async () => {
    if (demoMode) {
      navigate('/');
      return;
    }
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 z-30 flex w-60 flex-col border-r border-border bg-surface',
        demoMode ? 'top-10 h-[calc(100vh-2.5rem)]' : 'top-0 h-screen'
      )}
    >
      <div className="flex h-14 items-center px-4">
        <GhostnetLogo size="sm" />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pt-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavItemLink
                item={item}
                isDemoGated={demoMode && !!item.gatedInDemo}
                onGated={showGuard}
              />
            </li>
          ))}
        </ul>

        <div className="mx-4 my-3 border-t border-border" />

        <ul className="space-y-0.5">
          {secondaryItems.map((item) => (
            <li key={item.to}>
              <NavItemLink
                item={item}
                isDemoGated={demoMode && !!item.gatedInDemo}
                onGated={showGuard}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3">
          <UserInitials name={demoMode ? 'Demo Analyst' : (user?.name ?? 'User')} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">
              {demoMode ? 'Demo Analyst' : (user?.name ?? 'User')}
            </p>
            <p className="truncate text-xs text-text-muted">
              {demoMode ? 'demo@ghostnet.io' : (user?.email ?? '')}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-input p-1.5 text-text-muted transition-colors duration-150 hover:bg-elevated hover:text-text-secondary"
            title={demoMode ? 'Exit demo' : 'Sign out'}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
