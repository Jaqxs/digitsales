import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  iconColor?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  className?: string;
}

const iconColors = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  destructive: 'bg-destructive-light text-destructive',
  info: 'bg-info-light text-info',
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
    if (change === undefined || change === 0) return 'text-muted-foreground';
    return change > 0 ? 'text-success' : 'text-destructive';
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-200 hover:shadow-card-hover animate-in',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 text-xs font-medium', getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(change)}%</span>
              <span className="text-muted-foreground font-normal">{changeLabel}</span>
            </div>
          )}
        </div>
        <div className={cn('rounded-xl p-3', iconColors[iconColor])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
