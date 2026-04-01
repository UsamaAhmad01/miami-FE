import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export function SkeletonCard({ lines = 3, className }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-5 space-y-3", className)}>
      <div className="h-3 w-24 rounded skeleton-shimmer" />
      <div className="h-7 w-20 rounded skeleton-shimmer" />
      {Array.from({ length: lines - 2 }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded skeleton-shimmer"
          style={{ width: `${60 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 py-3 px-4", className)}>
      <div className="h-4 w-4 rounded skeleton-shimmer" />
      <div className="h-3 flex-1 rounded skeleton-shimmer" />
      <div className="h-3 w-16 rounded skeleton-shimmer" />
      <div className="h-5 w-20 rounded-full skeleton-shimmer" />
      <div className="h-3 w-12 rounded skeleton-shimmer" />
    </div>
  );
}
