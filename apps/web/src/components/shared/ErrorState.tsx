import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = 'Failed to load. Please try again.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-16 text-center ${className}`}
    >
      <div className="rounded-full bg-threat-critical/15 p-4">
        <AlertCircle size={32} className="text-threat-critical" />
      </div>
      <p className="text-sm text-text-secondary">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-input border border-border bg-elevated px-4 py-2 text-sm font-medium text-text-primary transition-colors duration-150 hover:bg-surface"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}
