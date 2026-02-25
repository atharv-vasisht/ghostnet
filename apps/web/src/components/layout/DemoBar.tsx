import { Link } from 'react-router-dom';

export function DemoBar() {
  return (
    <div className="flex h-10 w-full items-center justify-between bg-gradient-to-r from-cyan-dim to-transparent px-4">
      <p className="text-sm text-text-secondary">
        <span className="mr-1.5">⚡</span>
        <span className="font-medium text-cyan">DEMO MODE</span>
        <span className="mx-1.5">—</span>
        Viewing simulated attack data. Real sessions require an account.
      </p>
      <div className="flex items-center gap-3">
        <Link
          to="/signup"
          className="rounded-input bg-cyan px-3 py-1 text-xs font-semibold text-void transition-opacity hover:opacity-90"
        >
          Sign Up Free
        </Link>
        <Link
          to="/"
          className="text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          Learn More
        </Link>
      </div>
    </div>
  );
}
