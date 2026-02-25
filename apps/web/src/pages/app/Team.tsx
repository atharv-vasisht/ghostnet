import { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  X,
  Mail,
  Clock,
  AlertCircle,
  Trash2,
  Loader2,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonRow } from '@/components/shared/SkeletonLoader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { cn, formatRelativeTime } from '@/lib/utils';

type MemberRole = 'admin' | 'analyst' | 'viewer';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  lastLoginAt: string | null;
}

interface PendingInvite {
  id: string;
  email: string;
  role: MemberRole;
  createdAt: string;
}

const ROLE_STYLES: Record<MemberRole, string> = {
  admin: 'bg-threat-critical/15 text-threat-critical border-threat-critical/25',
  analyst: 'bg-cyan/15 text-cyan border-cyan/25',
  viewer: 'bg-border text-text-secondary border-border',
};

const ROLES: { value: MemberRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'viewer', label: 'Viewer' },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Team() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const { data: members, isLoading: membersLoading, isError } = useQuery({
    queryKey: ['team', 'members'],
    queryFn: async () => {
      const { data } = await api.get<TeamMember[]>('/team/members');
      return data;
    },
  });

  const { data: invites, isLoading: invitesLoading } = useQuery({
    queryKey: ['team', 'invites'],
    queryFn: async () => {
      const { data } = await api.get<PendingInvite[]>('/team/invites');
      return data;
    },
  });

  const inviteMut = useMutation({
    mutationFn: async (input: { email: string; role: MemberRole }) => {
      await api.post('/team/invites', input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', 'invites'] });
    },
  });

  const updateRoleMut = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: MemberRole }) => {
      await api.patch(`/team/members/${id}`, { role });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', 'members'] });
    },
  });

  const removeMut = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/team/members/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', 'members'] });
    },
  });

  const revokeInviteMut = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/team/invites/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', 'invites'] });
    },
  });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('analyst');
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  const isCurrentUser = useCallback(
    (memberId: string) => currentUser?.id === memberId,
    [currentUser]
  );

  const adminCount = (members ?? []).filter((m) => m.role === 'admin').length;

  const canChangeRole = (member: TeamMember) =>
    !isCurrentUser(member.id) && !(member.role === 'admin' && adminCount <= 1);

  const canRemove = (member: TeamMember) =>
    !isCurrentUser(member.id) && !(member.role === 'admin' && adminCount <= 1);

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteMut.mutate(
      { email: inviteEmail.trim(), role: inviteRole },
      {
        onSuccess: () => {
          setInviteOpen(false);
          setInviteEmail('');
          setInviteRole('analyst');
        },
      }
    );
  };

  return (
    <div className="min-h-full bg-void p-6">
      <div className="mx-auto max-w-[1440px] space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-text-primary">
              Team
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Manage team members and permissions
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-1.5 rounded-input bg-cyan px-4 py-2 text-sm font-medium text-void transition-colors duration-150 hover:bg-cyan/90"
          >
            <UserPlus size={18} />
            Invite Member
          </button>
        </div>

        {isError && (
          <div className="rounded-card border border-threat-critical/30 bg-threat-critical/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-threat-critical" />
              <p className="text-sm text-threat-critical">Failed to load team members</p>
            </div>
          </div>
        )}

        {/* Members Table */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Users size={18} className="text-cyan" />
            <h2 className="font-heading text-sm font-semibold text-text-primary">
              Members
            </h2>
            {members && (
              <span className="rounded-badge bg-cyan/15 px-1.5 py-0.5 font-mono text-[10px] font-medium text-cyan">
                {members.length}
              </span>
            )}
          </div>

          <div className="rounded-card border border-border bg-surface">
            {membersLoading ? (
              <div>
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            ) : !members || members.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No team members"
                description="Invite team members to collaborate on threat analysis"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-elevated">
                      {['Member', 'Email', 'Role', 'Last Login', 'Actions'].map(
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
                    {members.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b border-border transition-colors duration-150 hover:bg-elevated"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan/15 font-heading text-xs font-bold text-cyan">
                              {getInitials(member.name)}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-text-primary">
                                {member.name}
                              </span>
                              {isCurrentUser(member.id) && (
                                <span className="ml-2 text-[10px] text-text-muted">
                                  (you)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                          {member.email}
                        </td>
                        <td className="px-4 py-3">
                          {canChangeRole(member) ? (
                            <select
                              value={member.role}
                              onChange={(e) =>
                                updateRoleMut.mutate({
                                  id: member.id,
                                  role: e.target.value as MemberRole,
                                })
                              }
                              className="rounded-input border border-border bg-elevated px-2 py-1 text-xs text-text-primary outline-none transition-colors duration-150 focus:border-cyan"
                            >
                              {ROLES.map(({ value, label }) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={cn(
                                'inline-flex rounded-badge border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide',
                                ROLE_STYLES[member.role]
                              )}
                            >
                              {member.role}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-text-secondary">
                          {member.lastLoginAt
                            ? formatRelativeTime(member.lastLoginAt)
                            : 'Never'}
                        </td>
                        <td className="px-4 py-3">
                          {canRemove(member) ? (
                            <button
                              type="button"
                              onClick={() => setRemoveTarget(member)}
                              className="rounded-input p-1.5 text-text-muted transition-colors duration-150 hover:bg-threat-critical/10 hover:text-threat-critical"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <span className="text-[11px] text-text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Pending Invites */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Mail size={18} className="text-text-secondary" />
            <h2 className="font-heading text-sm font-semibold text-text-primary">
              Pending Invites
            </h2>
          </div>

          <div className="rounded-card border border-border bg-surface">
            {invitesLoading ? (
              <div>
                {Array.from({ length: 2 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            ) : !invites || invites.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-text-muted">No pending invites</p>
              </div>
            ) : (
              <div>
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm text-text-primary">
                        {invite.email}
                      </span>
                      <span
                        className={cn(
                          'rounded-badge border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide',
                          ROLE_STYLES[invite.role]
                        )}
                      >
                        {invite.role}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Clock size={12} />
                        {formatRelativeTime(invite.createdAt)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => revokeInviteMut.mutate(invite.id)}
                      disabled={revokeInviteMut.isPending}
                      className="rounded-input p-1.5 text-text-muted transition-colors duration-150 hover:bg-threat-critical/10 hover:text-threat-critical disabled:opacity-50"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Invite Modal */}
        <Dialog.Root open={inviteOpen} onOpenChange={setInviteOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-void/80 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-border bg-surface p-6 shadow-lg focus:outline-none">
              <div className="flex items-start justify-between">
                <Dialog.Title className="font-heading text-base font-semibold text-text-primary">
                  Invite Team Member
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
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full rounded-input border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors duration-150 focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                    className="w-full rounded-input border border-border bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors duration-150 focus:border-cyan"
                  >
                    {ROLES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviteMut.isPending}
                  className="flex items-center gap-1.5 rounded-input bg-cyan px-4 py-2 text-sm font-medium text-void transition-colors duration-150 hover:bg-cyan/90 disabled:opacity-50"
                >
                  {inviteMut.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <UserPlus size={14} />
                  )}
                  Send Invite
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Remove Confirm Dialog */}
        <ConfirmDialog
          open={!!removeTarget}
          onOpenChange={(open) => !open && setRemoveTarget(null)}
          title="Remove Team Member"
          description={`Are you sure you want to remove ${removeTarget?.name}? They will lose access to GHOSTNET immediately.`}
          confirmLabel="Remove"
          variant="danger"
          loading={removeMut.isPending}
          onConfirm={() => {
            if (removeTarget) {
              removeMut.mutate(removeTarget.id, {
                onSuccess: () => setRemoveTarget(null),
              });
            }
          }}
        />
      </div>
    </div>
  );
}
