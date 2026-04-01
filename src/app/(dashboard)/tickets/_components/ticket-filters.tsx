"use client";

import { cn } from "@/lib/utils";

interface TicketFiltersProps {
  activeStatuses: string[];
  onToggle: (status: string) => void;
  ticketCounts: Record<string, number>;
}

const FILTER_STATUSES = [
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "in progress", label: "In Progress" },
];

export function TicketFilters({ activeStatuses, onToggle, ticketCounts }: TicketFiltersProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {FILTER_STATUSES.map((status) => {
        const active = activeStatuses.includes(status.key);
        const count = ticketCounts[status.key] || 0;

        return (
          <button
            key={status.key}
            onClick={() => onToggle(status.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "border-primary/30 bg-primary/5 text-foreground"
                : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {status.label}
            <span className={cn("text-[10px]", active ? "text-primary" : "text-muted-foreground/60")}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
