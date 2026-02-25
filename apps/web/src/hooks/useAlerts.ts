import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import type { Alert, AlertRule, AlertRuleInput } from '@ghostnet/shared';

export function useAlerts() {
  const isDemo = useAuthStore((s) => s.isDemo);

  return useQuery({
    queryKey: ['alerts', isDemo],
    queryFn: async () => {
      const endpoint = isDemo ? '/demo/alerts' : '/alerts';
      const { data } = await api.get<Alert[]>(endpoint);
      return data;
    },
  });
}

export function useAlertRules() {
  const isDemo = useAuthStore((s) => s.isDemo);

  return useQuery({
    queryKey: ['alert-rules', isDemo],
    queryFn: async () => {
      const endpoint = isDemo ? '/demo/alerts/rules' : '/alerts/rules';
      const { data } = await api.get<AlertRule[]>(endpoint);
      return data;
    },
  });
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data } = await api.patch<Alert>(`/alerts/${alertId}/acknowledge`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useCreateAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AlertRuleInput) => {
      const { data } = await api.post<AlertRule>('/alerts/rules', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });
}

export function useUpdateAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<AlertRuleInput> & { id: string; enabled?: boolean }) => {
      const { data } = await api.patch<AlertRule>(`/alerts/rules/${id}`, input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });
}

export function useDeleteAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/alerts/rules/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });
}
