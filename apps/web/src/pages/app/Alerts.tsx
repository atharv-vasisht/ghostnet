import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import {
  Bell,
  Shield,
  Plus,
  X,
  Check,
  Pencil,
  Trash2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  useAlerts,
  useAlertRules,
  useAcknowledgeAlert,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
} from '@/hooks/useAlerts';
import { RiskBadge } from '@/components/shared/RiskBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonCard, SkeletonRow } from '@/components/shared/SkeletonLoader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Alert, AlertRule, AlertRuleInput, AlertTrigger } from '@ghostnet/shared';

const TRIGGER_TYPES: { value: AlertTrigger; label: string }[] = [
  { value: 'DEPTH_THRESHOLD', label: 'Depth Threshold' },
  { value: 'CREDENTIAL_ACCESS', label: 'Credential Access' },
  { value: 'BULK_EXFILTRATION', label: 'Bulk Exfiltration' },
  { value: 'PERSISTENCE_ATTEMPT', label: 'Persistence Attempt' },
  { value: 'DEEP_PROBE', label: 'Deep Probe' },
  { value: 'FIRST_CONTACT', label: 'First Contact' },
];

const SERVICES = [
  { id: 'iam', label: 'IAM' },
  { id: 'oauth', label: 'OAuth' },
  { id: 'secrets', label: 'Secrets' },
  { id: 'api', label: 'Internal API' },
  { id: 's3', label: 'S3' },
  { id: 'discovery', label: 'Discovery' },
];

const EMPTY_FORM: AlertRuleInput = {
  name: '',
  description: '',
  trigger: 'DEPTH_THRESHOLD',
  threshold: 5,
  services: [],
  notifyInApp: true,
  notifyEmail: false,
  notifySlack: false,
  slackWebhook: undefined,
  webhookUrl: undefined,
};

// ─── Active Alert Card ────────────────────────────────────────────────

function AlertCard({
  alert,
  onAcknowledge,
  acknowledging,
}: {
  alert: Alert;
  onAcknowledge: (id: string) => void;
  acknowledging: boolean;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-4 transition-colors duration-150 hover:bg-elevated">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <RiskBadge level={alert.severity} />
            <span className="font-mono text-[11px] text-text-muted">
              {formatRelativeTime(alert.createdAt)}
            </span>
          </div>
          <h3 className="font-heading text-sm font-semibold text-text-primary">
            {alert.title}
          </h3>
          <p className="text-xs leading-relaxed text-text-secondary">
            {alert.description}
          </p>
          <Link
            to={`/app/sessions/${alert.sessionId}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-cyan transition-colors duration-150 hover:text-cyan/80"
          >
            View Session
            <ExternalLink size={12} />
          </Link>
        </div>
        <button
          type="button"
          onClick={() => onAcknowledge(alert.id)}
          disabled={acknowledging}
          className="flex shrink-0 items-center gap-1.5 rounded-input border border-border bg-elevated px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors duration-150 hover:bg-border hover:text-text-primary disabled:opacity-50"
        >
          <Check size={14} />
          Acknowledge
        </button>
      </div>
    </div>
  );
}

// ─── Rule Form Modal ──────────────────────────────────────────────────

function RuleFormModal({
  open,
  onOpenChange,
  editRule,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editRule: AlertRule | null;
  onSave: (input: AlertRuleInput) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<AlertRuleInput>(EMPTY_FORM);

  const resetForm = useCallback((rule: AlertRule | null) => {
    if (rule) {
      setForm({
        name: rule.name,
        description: rule.description,
        trigger: rule.trigger,
        threshold: rule.threshold ?? undefined,
        services: rule.services,
        notifyInApp: rule.notifyInApp,
        notifyEmail: rule.notifyEmail,
        notifySlack: rule.notifySlack,
        slackWebhook: rule.slackWebhook ?? undefined,
        webhookUrl: rule.webhookUrl ?? undefined,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, []);

  // Reset when dialog opens
  const handleOpenChange = (next: boolean) => {
    if (next) resetForm(editRule);
    onOpenChange(next);
  };

  const toggleService = (svc: string) => {
    setForm((prev) => {
      const services = prev.services ?? [];
      return {
        ...prev,
        services: services.includes(svc)
          ? services.filter((s) => s !== svc)
          : [...services, svc],
      };
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-void/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-card border border-border bg-surface p-6 shadow-lg focus:outline-none">
          <div className="flex items-start justify-between">
            <Dialog.Title className="font-heading text-base font-semibold text-text-primary">
              {editRule ? 'Edit Alert Rule' : 'New Alert Rule'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-input p-1 text-text-muted transition-colors duration-150 hover:text-text-secondary"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-4 space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Alert rule name"
                className="w-full rounded-input border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors duration-150 focus:border-cyan"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="What triggers this alert?"
                rows={2}
                className="w-full resize-none rounded-input border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors duration-150 focus:border-cyan"
              />
            </div>

            {/* Trigger Type */}
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                Trigger Type
              </label>
              <select
                value={form.trigger}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    trigger: e.target.value as AlertTrigger,
                  }))
                }
                className="w-full rounded-input border border-border bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors duration-150 focus:border-cyan"
              >
                {TRIGGER_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Threshold (only for DEPTH_THRESHOLD) */}
            {form.trigger === 'DEPTH_THRESHOLD' && (
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                  Threshold
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.threshold ?? 5}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      threshold: parseInt(e.target.value, 10) || undefined,
                    }))
                  }
                  className="w-24 rounded-input border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary outline-none transition-colors duration-150 focus:border-cyan"
                />
              </div>
            )}

            {/* Services */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                Services
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map(({ id, label }) => {
                  const active = (form.services ?? []).includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleService(id)}
                      className={cn(
                        'rounded-input border px-2.5 py-1 text-xs font-medium transition-colors duration-150',
                        active
                          ? 'border-cyan/40 bg-cyan/10 text-cyan'
                          : 'border-border text-text-secondary hover:border-text-muted'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Toggles */}
            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                Notifications
              </label>
              <div className="space-y-2">
                {[
                  { key: 'notifyInApp' as const, label: 'In-App' },
                  { key: 'notifyEmail' as const, label: 'Email' },
                  { key: 'notifySlack' as const, label: 'Slack' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-text-primary">{label}</span>
                    <Switch.Root
                      checked={form[key]}
                      onCheckedChange={(checked) =>
                        setForm((p) => ({ ...p, [key]: checked }))
                      }
                      className={cn(
                        'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150',
                        'data-[state=checked]:bg-cyan data-[state=unchecked]:bg-border'
                      )}
                    >
                      <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-150 data-[state=checked]:translate-x-4" />
                    </Switch.Root>
                  </div>
                ))}
              </div>
            </div>

            {/* Slack Webhook */}
            {form.notifySlack && (
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                  Slack Webhook URL
                </label>
                <input
                  type="url"
                  value={form.slackWebhook ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, slackWebhook: e.target.value || undefined }))
                  }
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full rounded-input border border-border bg-elevated px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted outline-none transition-colors duration-150 focus:border-cyan"
                />
              </div>
            )}

            {/* Webhook URL */}
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                Webhook URL
              </label>
              <input
                type="url"
                value={form.webhookUrl ?? ''}
                onChange={(e) =>
                  setForm((p) => ({ ...p, webhookUrl: e.target.value || undefined }))
                }
                placeholder="https://your-endpoint.com/webhook"
                className="w-full rounded-input border border-border bg-elevated px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted outline-none transition-colors duration-150 focus:border-cyan"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-input border border-border px-4 py-2 text-sm text-text-secondary transition-colors duration-150 hover:bg-elevated hover:text-text-primary"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={() => onSave(form)}
              disabled={saving || !form.name.trim()}
              className="rounded-input bg-cyan px-4 py-2 text-sm font-medium text-void transition-colors duration-150 hover:bg-cyan/90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editRule ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Main Alerts Page ─────────────────────────────────────────────────

export default function Alerts() {
  const { data: alertsRaw, isLoading: alertsLoading, isError: alertsError } = useAlerts();
  const { data: rulesRaw, isLoading: rulesLoading } = useAlertRules();

  const alerts: Alert[] = Array.isArray(alertsRaw) ? alertsRaw : [];
  const rules: AlertRule[] = Array.isArray(rulesRaw) ? rulesRaw : [];

  const acknowledgeMut = useAcknowledgeAlert();
  const createMut = useCreateAlertRule();
  const updateMut = useUpdateAlertRule();
  const deleteMut = useDeleteAlertRule();
  const toggleMut = useUpdateAlertRule();

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AlertRule | null>(null);

  const activeAlerts = alerts
    .filter((a) => !a.acknowledged)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const handleSaveRule = useCallback(
    (input: AlertRuleInput) => {
      if (editingRule) {
        updateMut.mutate(
          { id: editingRule.id, ...input },
          { onSuccess: () => setRuleModalOpen(false) }
        );
      } else {
        createMut.mutate(input, {
          onSuccess: () => setRuleModalOpen(false),
        });
      }
    },
    [editingRule, updateMut, createMut]
  );

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
    setRuleModalOpen(true);
  };

  const handleNewRule = () => {
    setEditingRule(null);
    setRuleModalOpen(true);
  };

  const handleToggleRule = (rule: AlertRule) => {
    toggleMut.mutate({ id: rule.id, enabled: !rule.enabled });
  };

  return (
    <div className="min-h-full bg-void p-6">
      <div className="mx-auto max-w-[1440px] space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary">
            Alerts
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Monitor and manage security alerts and notification rules
          </p>
        </div>

        {/* ── Active Alerts ─────────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Bell size={18} className="text-threat-critical" />
            <h2 className="font-heading text-sm font-semibold text-text-primary">
              Active Alerts
            </h2>
            {activeAlerts.length > 0 && (
              <span className="rounded-badge bg-threat-critical/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-threat-critical">
                {activeAlerts.length}
              </span>
            )}
          </div>

          {alertsError && (
            <div className="mb-4 rounded-card border border-threat-critical/30 bg-threat-critical/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-threat-critical" />
                <p className="text-sm text-threat-critical">Failed to load alerts</p>
              </div>
            </div>
          )}

          {alertsLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : activeAlerts.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No active alerts"
              description="All alerts have been acknowledged. New alerts will appear when suspicious activity is detected."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {activeAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={(id) => acknowledgeMut.mutate(id)}
                  acknowledging={acknowledgeMut.isPending}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Alert Rules ───────────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-cyan" />
              <h2 className="font-heading text-sm font-semibold text-text-primary">
                Alert Rules
              </h2>
            </div>
            <button
              type="button"
              onClick={handleNewRule}
              className="flex items-center gap-1.5 rounded-input bg-cyan px-3 py-1.5 text-xs font-medium text-void transition-colors duration-150 hover:bg-cyan/90"
            >
              <Plus size={14} />
              New Rule
            </button>
          </div>

          <div className="rounded-card border border-border bg-surface">
            {rulesLoading ? (
              <div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            ) : !rules || rules.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No alert rules configured"
                description="Create rules to get notified when suspicious patterns are detected"
                action={{ label: 'Create Rule', onClick: handleNewRule }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-elevated">
                      {['Name', 'Trigger', 'Threshold', 'Services', 'Enabled', 'Actions'].map(
                        (col) => (
                          <th
                            key={col}
                            className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-text-secondary"
                          >
                            {col}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr
                        key={rule.id}
                        className="border-b border-border transition-colors duration-150 hover:bg-elevated"
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-text-primary">
                            {rule.name}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-badge border border-border bg-elevated px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                            {rule.trigger.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-text-primary">
                          {rule.threshold ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-text-secondary">
                            {rule.services.length > 0
                              ? rule.services.join(', ')
                              : 'All'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Switch.Root
                            checked={rule.enabled}
                            onCheckedChange={() => handleToggleRule(rule)}
                            className={cn(
                              'relative h-5 w-9 rounded-full transition-colors duration-150',
                              'data-[state=checked]:bg-cyan data-[state=unchecked]:bg-border'
                            )}
                          >
                            <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-150 data-[state=checked]:translate-x-4" />
                          </Switch.Root>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditRule(rule)}
                              className="rounded-input p-1.5 text-text-muted transition-colors duration-150 hover:bg-elevated hover:text-text-primary"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(rule)}
                              className="rounded-input p-1.5 text-text-muted transition-colors duration-150 hover:bg-threat-critical/10 hover:text-threat-critical"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Rule Form Modal */}
        <RuleFormModal
          open={ruleModalOpen}
          onOpenChange={setRuleModalOpen}
          editRule={editingRule}
          onSave={handleSaveRule}
          saving={createMut.isPending || updateMut.isPending}
        />

        {/* Delete Confirm Dialog */}
        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete Alert Rule"
          description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          loading={deleteMut.isPending}
          onConfirm={() => {
            if (deleteTarget) {
              deleteMut.mutate(deleteTarget.id, {
                onSuccess: () => setDeleteTarget(null),
              });
            }
          }}
        />
      </div>
    </div>
  );
}
