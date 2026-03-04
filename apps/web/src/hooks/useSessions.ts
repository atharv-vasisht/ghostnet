import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import type {
  SessionFilters,
  SessionListResponse,
  AgentSession,
} from '@ghostnet/shared';

export function useSessions(filters?: SessionFilters) {
  const isDemo = useAuthStore((s) => s.isDemo);
  const prefix = isDemo ? '/demo' : '';

  return useQuery({
    queryKey: ['sessions', filters, isDemo],
    queryFn: async () => {
      const { data } = await api.get<SessionListResponse>(
        `${prefix}/sessions`,
        { params: filters }
      );
      return {
        ...data,
        sessions: Array.isArray(data.sessions) ? data.sessions : [],
      };
    },
  });
}

export function useSession(id: string | undefined) {
  const isDemo = useAuthStore((s) => s.isDemo);
  const prefix = isDemo ? '/demo' : '';

  return useQuery({
    queryKey: ['session', id, isDemo],
    queryFn: async () => {
      const { data } = await api.get<AgentSession>(`${prefix}/sessions/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useSessionExport(id: string | undefined) {
  return useQuery({
    queryKey: ['session-export', id],
    queryFn: async () => {
      const { data } = await api.get<Blob>(`/reports/sessions/${id}`, {
        responseType: 'blob',
      });
      return data;
    },
    enabled: false,
  });
}
