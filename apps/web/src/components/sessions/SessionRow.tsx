import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { RiskBadge } from '@/components/shared/RiskBadge';
import { ServiceBadge } from '@/components/sessions/ServiceBadge';
import { useAuthStore } from '@/lib/auth';
import { formatRelativeTime } from '@/lib/utils';
import type { AgentSession } from '@ghostnet/shared';

interface SessionRowProps {
  session: AgentSession;
}

const STATUS_CLASSES: Record<string, string> = {
  ACTIVE: 'text-threat-safe',
  IDLE: 'text-threat-medium',
  CLOSED: 'text-text-muted',
};

export function SessionRow({ session }: SessionRowProps) {
  const navigate = useNavigate();
  const isDemo = useAuthStore((s) => s.isDemo);
  const basePath = isDemo ? '/demo' : '/app';

  return (
    <tr
      onClick={() => navigate(`${basePath}/sessions/${session.id}`)}
      className="group h-12 cursor-pointer border-b border-border transition-colors duration-150 hover:bg-elevated"
    >
      <td className="px-4 py-3">
        <RiskBadge level={session.riskLevel} />
      </td>
      <td className="px-4 py-3 font-mono text-xs text-text-primary">
        {session.sourceIp}
      </td>
      <td className="px-4 py-3 text-xs text-text-secondary">
        {formatRelativeTime(session.firstSeenAt)}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-text-primary">
        {session.eventCount}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {session.servicesTouched.slice(0, 3).map((svc) => (
            <ServiceBadge key={svc} service={svc} />
          ))}
          {session.servicesTouched.length > 3 && (
            <span className="text-[10px] text-text-muted">
              +{session.servicesTouched.length - 3}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-xs font-medium ${STATUS_CLASSES[session.status] ?? 'text-text-muted'}`}
        >
          {session.status}
        </span>
      </td>
      <td className="w-8 px-2 py-3">
        <ChevronRight
          size={14}
          className="text-text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        />
      </td>
    </tr>
  );
}
