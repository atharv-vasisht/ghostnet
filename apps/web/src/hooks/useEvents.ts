import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import type { AgentEvent, EventFilters } from '@ghostnet/shared';

interface EventListResponse {
  events: AgentEvent[];
  total: number;
}

export function useEvents(filters?: EventFilters) {
  const isDemo = useAuthStore((s) => s.isDemo);
  const prefix = isDemo ? '/demo' : '';

  return useQuery({
    queryKey: ['events', filters, isDemo],
    queryFn: async () => {
      const { data } = await api.get<EventListResponse>(
        `${prefix}/events`,
        { params: filters }
      );
      return {
        ...data,
        events: Array.isArray(data.events) ? data.events : [],
      };
    },
  });
}
