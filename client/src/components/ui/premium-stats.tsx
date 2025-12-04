import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: "default" | "gradient" | "glass";
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  variant = "default"
}: StatCardProps) {
  const variantClasses = {
    default: "bg-card border",
    gradient: "gradient-border bg-card",
    glass: "glass-card"
  };

  return (
    <div
      className={cn(
        "rounded-lg p-6 card-hover shadow-premium",
        variantClasses[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {Icon && (
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2 flex-wrap">
        <span className="text-3xl font-bold stat-value">{value}</span>
        {trend && (
          <span
            className={cn(
              "text-sm font-medium flex items-center gap-0.5",
              trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}
          >
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  const columnClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
  };

  return (
    <div className={cn("grid gap-4", columnClasses[columns], className)}>
      {children}
    </div>
  );
}

interface ProgressStatProps {
  label: string;
  value: number;
  max: number;
  showPercentage?: boolean;
  color?: "primary" | "success" | "warning" | "destructive";
  className?: string;
}

export function ProgressStat({
  label,
  value,
  max,
  showPercentage = true,
  color = "primary",
  className
}: ProgressStatProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  
  const colorClasses = {
    primary: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    destructive: "bg-destructive"
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        {showPercentage && (
          <span className="text-muted-foreground">{percentage}%</span>
        )}
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{value.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

interface MiniChartProps {
  data: number[];
  className?: string;
  color?: string;
}

export function MiniChart({ data, className, color = "hsl(var(--primary))" }: MiniChartProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className={cn("h-8 w-20", className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
}