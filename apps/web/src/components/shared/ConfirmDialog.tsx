import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-void/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-border bg-surface p-6 shadow-lg focus:outline-none">
          <div className="flex items-start justify-between">
            <Dialog.Title className="font-heading text-base font-semibold text-text-primary">
              {title}
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
          <Dialog.Description className="mt-2 text-sm text-text-secondary">
            {description}
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-input border border-border px-4 py-2 text-sm text-text-secondary transition-colors duration-150 hover:bg-elevated hover:text-text-primary"
              >
                {cancelLabel}
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                'rounded-input px-4 py-2 text-sm font-medium transition-colors duration-150 disabled:opacity-50',
                variant === 'danger'
                  ? 'bg-threat-critical/20 text-threat-critical hover:bg-threat-critical/30'
                  : 'bg-cyan text-void hover:bg-cyan/90'
              )}
            >
              {loading ? 'Loading...' : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
