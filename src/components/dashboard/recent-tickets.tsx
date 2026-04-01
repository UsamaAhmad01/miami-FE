"use client";

import { Clock } from "lucide-react";
import { SectionHeader } from "@/components/primitives/section-header";
import { StatusBadge } from "@/components/primitives/status-badge";
import { Button } from "@/components/ui/button";

const tickets = [
  { id: "TKT-1042", customer: "James Rodriguez", service: "Full Tune-Up", status: "In Progress" as const, time: "2h ago", amount: "$185" },
  { id: "TKT-1041", customer: "Sarah Chen", service: "Brake Replacement", status: "Pending" as const, time: "3h ago", amount: "$120" },
  { id: "TKT-1040", customer: "Mike Thompson", service: "Tire Change", status: "Completed" as const, time: "5h ago", amount: "$95" },
  { id: "TKT-1039", customer: "Emma Davis", service: "Chain & Gear Service", status: "In Progress" as const, time: "6h ago", amount: "$150" },
  { id: "TKT-1038", customer: "Carlos Mendez", service: "Wheel Truing", status: "Completed" as const, time: "1d ago", amount: "$65" },
];

const statusMap = {
  "In Progress": "info",
  Pending: "warning",
  Completed: "success",
} as const;

export function RecentTickets() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-5 pb-3">
        <SectionHeader
          title="Recent Tickets"
          action={<Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground">View All</Button>}
        />
      </div>
      <div className="divide-y">
        {tickets.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold font-mono">{t.id}</span>
                <StatusBadge status={statusMap[t.status]}>{t.status}</StatusBadge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {t.customer} — {t.service}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-medium">{t.amount}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                <Clock className="h-2.5 w-2.5" />{t.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
