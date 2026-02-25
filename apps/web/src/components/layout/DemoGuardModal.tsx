import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock, X } from 'lucide-react';
import { DemoGuardCtx } from '@/hooks/useDemoGuard';

export function DemoGuardProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const showGuard = useCallback(() => setOpen(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <DemoGuardCtx.Provider value={{ showGuard }}>
      {children}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-card border border-border bg-elevated p-8 text-center shadow-lg">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-input p-1 text-text-muted transition-colors hover:bg-surface hover:text-text-secondary"
            >
              <X size={18} />
            </button>

            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-dim">
              <Lock size={24} className="text-cyan" />
            </div>

            <h2 className="font-heading text-lg font-semibold text-text-primary">
              Account Required
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              This feature requires an account &mdash; sign up free to get
              started.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                to="/signup"
                className="rounded-input bg-cyan px-6 py-2.5 text-sm font-semibold text-void transition-opacity hover:opacity-90"
              >
                Sign Up Free
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="rounded-input border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </DemoGuardCtx.Provider>
  );
}
