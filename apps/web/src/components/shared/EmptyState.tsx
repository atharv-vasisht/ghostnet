import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className
      )}
    >
      <div className="mb-4 rounded-full bg-elevated p-4">
        <Icon size={32} className="text-text-muted" />
      </div>
      <h3 className="mb-2 font-heading text-sm font-semibold text-text-primary">
        {title}
      </h3>
      <p className="mb-6 max-w-sm text-sm text-text-secondary">{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="rounded-input bg-cyan px-4 py-2 text-sm font-medium text-void transition-colors duration-150 hover:bg-cyan/90"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
