"use client";

import { StatusBadge } from "@/components/primitives/status-badge";
import { type Ticket, type TicketStatus, STATUS_CONFIG, PRIORITY_CONFIG } from "../_data/mock-tickets";

const KANBAN_COLUMNS: TicketStatus[] = ["open", "in_progress", "waiting", "completed"];

interface TicketsKanbanProps {
  data: Ticket[];
  onSelect: (ticket: Ticket) => void;
}

export function TicketsKanban({ data, onSelect }: TicketsKanbanProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {KANBAN_COLUMNS.map((status) => {
        const cfg = STATUS_CONFIG[status];
        const tickets = data.filter((t) => t.status === status);

        return (
          <div key={status} className="space-y-2">
            {/* Column header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <StatusBadge status={cfg.color} dot={false}>{cfg.label}</StatusBadge>
                <span className="text-xs text-muted-foreground font-medium">{tickets.length}</span>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[200px]">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => onSelect(ticket)}
                  className="rounded-lg border bg-card p-3 cursor-pointer hover:border-border transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-medium text-muted-foreground">{ticket.id}</span>
                    <span className={`text-[11px] font-medium ${PRIORITY_CONFIG[ticket.priority].color}`}>
                      {PRIORITY_CONFIG[ticket.priority].label}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-tight">{ticket.customer.name}</p>
                  <p className="text-xs text-muted-foreground">{ticket.services[0]}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">
                      {ticket.technician || "Unassigned"}
                    </span>
                    <span className="text-xs font-medium">${ticket.total}</span>
                  </div>
                </div>
              ))}

              {tickets.length === 0 && (
                <div className="rounded-lg border border-dashed py-8 text-center">
                  <p className="text-xs text-muted-foreground">No tickets</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
