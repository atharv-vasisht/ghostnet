import { useState, useEffect } from 'react';
import { AlertTriangle, Save, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';

interface EnvironmentConfig {
  fakeCompanyName: string;
  fakeDomain: string;
  awsAccountId: string;
  deceptionSeed: string;
}

export default function Environment() {
  const qc = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['config', 'environment'],
    queryFn: async () => {
      const { data } = await api.get<EnvironmentConfig>('/config/environment');
      return data;
    },
  });

  const [form, setForm] = useState<EnvironmentConfig>({
    fakeCompanyName: '',
    fakeDomain: '',
    awsAccountId: '',
    deceptionSeed: '',
  });

  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (config) {
      setForm(config);
      setDirty(false);
    }
  }, [config]);

  const saveMut = useMutation({
    mutationFn: async (input: EnvironmentConfig) => {
      const { data } = await api.put<EnvironmentConfig>(
        '/config/environment',
        input
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['config', 'environment'] });
      setDirty(false);
    },
  });

  const handleChange = (field: keyof EnvironmentConfig, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setDirty(true);
  };

  if (isLoading) {
    return <SkeletonLoader lines={8} className="max-w-xl" />;
  }

  const fields: { key: keyof EnvironmentConfig; label: string; placeholder: string }[] = [
    {
      key: 'fakeCompanyName',
      label: 'Fake Company Name',
      placeholder: 'e.g. Nexus Dynamics',
    },
    {
      key: 'fakeDomain',
      label: 'Fake Domain',
      placeholder: 'e.g. nexusdynamics.io',
    },
    {
      key: 'awsAccountId',
      label: 'AWS Account ID',
      placeholder: 'e.g. 123456789012',
    },
    {
      key: 'deceptionSeed',
      label: 'Deception Seed',
      placeholder: 'Random seed for data generation',
    },
  ];

  return (
    <div className="max-w-xl space-y-6">
      {/* Warning Banner */}
      <div className="flex items-start gap-3 rounded-card border border-threat-medium/30 bg-threat-medium/10 px-4 py-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-threat-medium" />
        <p className="text-xs leading-relaxed text-threat-medium">
          Changing these values will affect all future deception responses. Active
          sessions will not be retroactively updated.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
              {label}
            </label>
            <input
              type="text"
              value={form[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-input border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors duration-150 focus:border-cyan"
            />
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => saveMut.mutate(form)}
          disabled={!dirty || saveMut.isPending}
          className="flex items-center gap-2 rounded-input bg-cyan px-5 py-2 text-sm font-medium text-void transition-colors duration-150 hover:bg-cyan/90 disabled:opacity-50"
        >
          {saveMut.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Save Changes
        </button>
        {saveMut.isSuccess && (
          <span className="text-xs text-threat-safe">Saved successfully</span>
        )}
        {saveMut.isError && (
          <span className="text-xs text-threat-critical">Failed to save</span>
        )}
      </div>
    </div>
  );
}
