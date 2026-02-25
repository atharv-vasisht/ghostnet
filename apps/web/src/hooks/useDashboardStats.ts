import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import type { SessionListResponse, Alert } from '@ghostnet/shared';

export interface DashboardStats {
  activeSessions: number;
  totalEvents: number;
  activeAlerts: number;
  avgRiskScore: number;
  sessionsDelta: number;
  eventsDelta: number;
  alertsDelta: number;
  riskDelta: number;
  serviceActivity: Record<string, number>;
  riskTimeline: RiskTimelinePoint[];
}

export interface RiskTimelinePoint {
  time: string;
  hour: string;
  score: number;
}

function generateTimeline(
  sessions: SessionListResponse['sessions']
): RiskTimelinePoint[] {
  const now = new Date();
  const points: RiskTimelinePoint[] = [];

  for (let i = 23; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourStr = t.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const hourStart = new Date(t);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

    const activeDuringHour = sessions.filter((s) => {
      const first = new Date(s.firstSeenAt).getTime();
      const last = new Date(s.lastSeenAt).getTime();
      return first <= hourEnd.getTime() && last >= hourStart.getTime();
    });

    const score =
      activeDuringHour.length > 0
        ? Math.round(
            activeDuringHour.reduce((sum, s) => sum + s.riskScore, 0) /
              activeDuringHour.length
          )
        : 0;

    points.push({ time: t.toISOString(), hour: hourStr, score });
  }

  return points;
}

export function useDashboardStats() {
  const isDemo = useAuthStore((s) => s.isDemo);

  return useQuery({
    queryKey: ['dashboard-stats', isDemo],
    queryFn: async (): Promise<DashboardStats> => {
      if (isDemo) {
        try {
          const { data } = await api.get<DashboardStats>('/demo/stats');
          return data;
        } catch {
          // Fall through to computed stats if demo endpoint not available
        }
      }

      const [sessionsRes, alertsRes] = await Promise.all([
        api.get<SessionListResponse>('/sessions', {
          params: { limit: 100, sortBy: 'lastSeenAt', sortOrder: 'desc' },
        }),
        api.get<Alert[]>('/alerts'),
      ]);

      const sessions = sessionsRes.data.sessions;
      const alerts = alertsRes.data;

      const activeSessions = sessions.filter(
        (s) => s.status === 'ACTIVE'
      ).length;
      const totalEvents = sessions.reduce(
        (sum, s) => sum + s.eventCount,
        0
      );
      const activeAlerts = alerts.filter((a) => !a.acknowledged).length;
      const avgRiskScore =
        sessions.length > 0
          ? Math.round(
              sessions.reduce((sum, s) => sum + s.riskScore, 0) /
                sessions.length
            )
          : 0;

      const serviceActivity: Record<string, number> = {};
      sessions.forEach((s) => {
        s.servicesTouched.forEach((svc) => {
          serviceActivity[svc] = (serviceActivity[svc] ?? 0) + s.eventCount;
        });
      });

      return {
        activeSessions,
        totalEvents,
        activeAlerts,
        avgRiskScore,
        sessionsDelta: 0,
        eventsDelta: 0,
        alertsDelta: 0,
        riskDelta: 0,
        serviceActivity,
        riskTimeline: generateTimeline(sessions),
      };
    },
    refetchInterval: 30_000,
  });
}
