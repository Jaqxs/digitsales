import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  iconColor?: 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'brand';
  className?: string;
}

const iconColors = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success-light text-success border-success/20',
  warning: 'bg-warning-light text-warning border-warning/20',
  destructive: 'bg-destructive-light text-destructive border-destructive/20',
  info: 'bg-info-light text-info border-info/20',
  brand: 'bg-accent/10 text-accent border-accent/20',
};

const glowColors = {
  primary: 'hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]',
  success: 'hover:shadow-[0_0_30px_hsl(var(--success)/0.15)]',
  warning: 'hover:shadow-[0_0_30px_hsl(var(--warning)/0.15)]',
  destructive: 'hover:shadow-[0_0_30px_hsl(var(--destructive)/0.15)]',
  info: 'hover:shadow-[0_0_30px_hsl(var(--info)/0.15)]',
  brand: 'hover:shadow-[0_0_30px_hsl(var(--accent)/0.15)]',
};

export function StatsCard({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  icon,
  iconColor = 'primary',
  className,
}: StatsCardProps) {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) return <Minus className="h-3 w-3" />;
    return change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-muted-foreground bg-muted';
    return change > 0 ? 'text-success bg-success-light' : 'text-destructive bg-destructive-light';
  };

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 animate-in overflow-hidden',
        glowColors[iconColor],
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/[0.02] pointer-events-none" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2 sm:space-y-3">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">{value}</p>
          {change !== undefined && (
            <div className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full', getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(change)}%</span>
              <span className="text-muted-foreground font-normal hidden sm:inline">{changeLabel}</span>
            </div>
          )}
        </div>
        <div className={cn('rounded-xl p-2.5 sm:p-3 border transition-transform duration-300 group-hover:scale-110', iconColors[iconColor])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
