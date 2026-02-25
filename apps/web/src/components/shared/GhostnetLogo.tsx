import { cn } from '@/lib/utils';

interface GhostnetLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function HexMeshIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M16 2V16M16 16V30M16 16L28 9M16 16L4 9M16 16L28 23M16 16L4 23"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <circle cx="16" cy="16" r="3" fill="currentColor" opacity="0.4" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

const sizeMap = {
  sm: { icon: 'h-5 w-5', text: 'text-base' },
  md: { icon: 'h-7 w-7', text: 'text-xl' },
  lg: { icon: 'h-9 w-9', text: 'text-2xl' },
};

export function GhostnetLogo({ size = 'md', className }: GhostnetLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <HexMeshIcon className={cn(s.icon, 'text-cyan')} />
      <span
        className={cn(
          s.text,
          'font-display font-bold tracking-tight text-text-primary'
        )}
      >
        GHOSTNET
      </span>
    </div>
  );
}
