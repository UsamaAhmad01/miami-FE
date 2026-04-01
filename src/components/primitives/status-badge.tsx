import { cn } from "@/lib/utils";

type Status = "success" | "warning" | "error" | "info" | "neutral";

interface StatusBadgeProps {
  status: Status;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const statusStyles: Record<Status, string> = {
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  error: "bg-red-500/10 text-red-700 dark:text-red-400",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  neutral: "bg-muted text-muted-foreground",
};

const dotStyles: Record<Status, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-muted-foreground",
};

export function StatusBadge({ status, children, className, dot = true }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotStyles[status])} />}
      {children}
    </span>
  );
}
