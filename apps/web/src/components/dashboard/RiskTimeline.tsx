import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { RiskTimelinePoint } from '@/hooks/useDashboardStats';

interface RiskTimelineProps {
  data: RiskTimelinePoint[];
  className?: string;
}

interface TooltipPayloadItem {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function RiskTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-card border border-border bg-elevated px-3 py-2 shadow-glow-cyan">
      <p className="font-mono text-[11px] text-text-muted">{label}</p>
      <p className="font-mono text-sm font-semibold text-cyan">
        Risk: {payload[0]?.value ?? '—'}
      </p>
    </div>
  );
}

export function RiskTimeline({ data, className }: RiskTimelineProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface',
        className
      )}
    >
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-heading text-sm font-semibold text-text-primary">
          24h Risk Timeline
        </h3>
        <p className="mt-0.5 text-[11px] text-text-muted">
          Aggregate risk score over the last 24 hours
        </p>
      </div>

      <div className="p-4">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
          >
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#00D4FF" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="#1E2733"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="hour"
              tick={{
                fill: '#4A5568',
                fontSize: 11,
                fontFamily: 'JetBrains Mono',
              }}
              axisLine={{ stroke: '#1E2733' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{
                fill: '#4A5568',
                fontSize: 11,
                fontFamily: 'JetBrains Mono',
              }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<RiskTooltip />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#00D4FF"
              strokeWidth={2}
              fill="url(#riskGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: '#00D4FF',
                stroke: '#080B12',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
