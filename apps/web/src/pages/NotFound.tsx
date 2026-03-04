import { Link } from 'react-router-dom';
import { Ghost, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-void px-4">
      <div className="text-center">
        <Ghost size={64} className="mx-auto mb-4 text-text-muted" />
        <h1 className="font-display text-4xl font-bold text-text-primary">404</h1>
        <p className="mt-2 text-lg text-text-secondary">
          Page not found
        </p>
        <p className="mt-1 text-sm text-text-muted">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-input bg-cyan px-4 py-2 text-sm font-medium text-void transition-colors duration-150 hover:bg-cyan/90"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>
      </div>
    </div>
  );
}
