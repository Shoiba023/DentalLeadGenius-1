import { cn } from "@/lib/utils";

interface PremiumLoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function PremiumLoading({ className, size = "md", text }: PremiumLoadingProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <div className="absolute inset-0 rounded-full border-2 border-muted" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/20 to-transparent animate-pulse" />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 skeleton-loading rounded" />
        <div className="h-8 w-8 skeleton-loading rounded-full" />
      </div>
      <div className="h-8 w-32 skeleton-loading rounded" />
      <div className="h-3 w-20 skeleton-loading rounded" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="border-b bg-muted/30 p-4">
        <div className="flex gap-4">
          <div className="h-4 w-32 skeleton-loading rounded" />
          <div className="h-4 w-24 skeleton-loading rounded" />
          <div className="h-4 w-28 skeleton-loading rounded" />
          <div className="h-4 w-20 skeleton-loading rounded" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b last:border-b-0 p-4">
          <div className="flex gap-4 items-center">
            <div className="h-4 w-4 skeleton-loading rounded" />
            <div className="h-4 flex-1 max-w-48 skeleton-loading rounded" />
            <div className="h-4 w-24 skeleton-loading rounded" />
            <div className="h-4 w-28 skeleton-loading rounded" />
            <div className="h-6 w-16 skeleton-loading rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

interface PageLoadingProps {
  title?: string;
}

export function PageLoading({ title = "Loading..." }: PageLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full gradient-primary opacity-50 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">Please wait while we load your data</p>
        </div>
      </div>
    </div>
  );
}