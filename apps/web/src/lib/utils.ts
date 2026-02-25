import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RiskLevel } from '@ghostnet/shared';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo ago`;
}

export function formatTimestamp(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(date));
}

export function getRiskColor(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    CRITICAL: 'text-threat-critical',
    HIGH: 'text-threat-high',
    MEDIUM: 'text-threat-medium',
    LOW: 'text-threat-low',
  };
  return map[level];
}

export function getRiskBg(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    CRITICAL: 'bg-threat-critical/[0.13]',
    HIGH: 'bg-threat-high/[0.13]',
    MEDIUM: 'bg-threat-medium/[0.13]',
    LOW: 'bg-threat-low/[0.13]',
  };
  return map[level];
}

export function getRiskBorder(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    CRITICAL: 'border-threat-critical/[0.27]',
    HIGH: 'border-threat-high/[0.27]',
    MEDIUM: 'border-threat-medium/[0.27]',
    LOW: 'border-threat-low/[0.27]',
  };
  return map[level];
}

const SERVICE_ICON_MAP: Record<string, string> = {
  iam: 'Shield',
  oauth: 'KeyRound',
  api: 'Globe',
  secrets: 'Lock',
  s3: 'HardDrive',
  discovery: 'Search',
};

export function getServiceIcon(service: string): string {
  return SERVICE_ICON_MAP[service] ?? 'Box';
}
