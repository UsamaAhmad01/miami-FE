import { cn } from "@/lib/utils";

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 6, className }: SkeletonTableProps) {
  return (
    <div className={cn("rounded-lg border bg-card overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b bg-muted/20">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="h-3 rounded skeleton-shimmer"
            style={{ width: `${50 + Math.random() * 60}px` }}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5 border-b last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <div
              key={`${r}-${c}`}
              className="h-3 rounded skeleton-shimmer"
              style={{
                width: c === 0 ? "60px" : c === 1 ? "120px" : `${40 + Math.random() * 50}px`,
                animationDelay: `${r * 0.05}s`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 rounded skeleton-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
            <div className="h-8 w-8 rounded-md skeleton-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
          </div>
          <div className="h-7 w-16 rounded skeleton-shimmer" style={{ animationDelay: `${i * 0.1 + 0.05}s` }} />
          <div className="h-3 w-24 rounded skeleton-shimmer" style={{ animationDelay: `${i * 0.1 + 0.1}s` }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-5", className)}>
      <div className="h-4 w-32 rounded skeleton-shimmer mb-6" />
      <div className="h-[280px] flex items-end gap-2 px-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t skeleton-shimmer"
            style={{
              height: `${30 + Math.random() * 60}%`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
