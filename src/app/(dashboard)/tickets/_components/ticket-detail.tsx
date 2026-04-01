"use client";

import { User, Bike, Clock, DollarSign, Wrench, MessageSquare, UserCheck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/primitives/status-badge";
import { type Ticket, STATUS_CONFIG, PRIORITY_CONFIG } from "../_data/mock-tickets";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

interface TicketDetailProps {
  ticket: Ticket | null;
  onClose: () => void;
}

export function TicketDetail({ ticket, onClose }: TicketDetailProps) {
  return (
    <Sheet open={!!ticket} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        {ticket && <TicketDetailContent ticket={ticket} />}
      </SheetContent>
    </Sheet>
  );
}

function TicketDetailContent({ ticket }: { ticket: Ticket }) {
  const statusCfg = STATUS_CONFIG[ticket.status];
  const priorityCfg = PRIORITY_CONFIG[ticket.priority];

  return (
    <>
      {/* Header */}
      <SheetHeader className="p-5 pb-0">
        <div className="flex items-center gap-3">
          <SheetTitle className="font-mono text-sm">{ticket.id}</SheetTitle>
          <StatusBadge status={statusCfg.color}>{statusCfg.label}</StatusBadge>
        </div>
        <SheetDescription className="sr-only">Ticket detail for {ticket.id}</SheetDescription>
      </SheetHeader>

      {/* Quick Actions */}
      <div className="flex gap-2 px-5 py-3">
        {ticket.status === "open" && (
          <Button size="sm" variant="default" className="text-xs h-7">Assign Technician</Button>
        )}
        {ticket.status === "in_progress" && (
          <Button size="sm" variant="default" className="text-xs h-7">Mark Ready</Button>
        )}
        {ticket.status === "waiting" && (
          <Button size="sm" variant="outline" className="text-xs h-7">Resume Work</Button>
        )}
        <Button size="sm" variant="outline" className="text-xs h-7">Print Invoice</Button>
      </div>

      <Separator />

      {/* Body */}
      <div className="p-5 space-y-4">
        <DetailSection icon={User} label="Customer">
          <p className="text-sm font-medium">{ticket.customer.name}</p>
          <p className="text-xs text-muted-foreground">{ticket.customer.phone}</p>
        </DetailSection>

        <DetailSection icon={Bike} label={`Bike${ticket.bikes.length > 1 ? "s" : ""}`}>
          {ticket.bikes.map((b, i) => (
            <div key={i} className={i > 0 ? "mt-2" : ""}>
              <p className="text-sm font-medium">{b.make} {b.model}</p>
              <p className="text-xs text-muted-foreground">{b.color}{b.serial_number ? ` — ${b.serial_number}` : ""}</p>
            </div>
          ))}
        </DetailSection>

        <DetailSection icon={Wrench} label="Services">
          <div className="space-y-1">
            {ticket.services.map((s) => (
              <p key={s} className="text-sm">{s}</p>
            ))}
          </div>
        </DetailSection>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <DetailSection icon={DollarSign} label="Total">
            <p className="text-sm font-semibold">${ticket.total}</p>
          </DetailSection>
          <DetailSection icon={UserCheck} label="Technician">
            <p className="text-sm">{ticket.technician || <span className="text-muted-foreground italic">Unassigned</span>}</p>
          </DetailSection>
          <DetailSection icon={Clock} label="Created">
            <p className="text-xs text-muted-foreground">{formatDate(ticket.created)}</p>
          </DetailSection>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Priority</p>
            <p className={`text-sm font-medium ${priorityCfg.color}`}>{priorityCfg.label}</p>
          </div>
        </div>

        {ticket.notes && (
          <>
            <Separator />
            <DetailSection icon={MessageSquare} label="Notes">
              <p className="text-sm text-muted-foreground leading-relaxed">{ticket.notes}</p>
            </DetailSection>
          </>
        )}

        {/* Payment History */}
        {ticket.payments.length > 0 && (
          <>
            <Separator />
            <DetailSection icon={DollarSign} label="Payments">
              <div className="space-y-2">
                {ticket.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium capitalize">{p.payment_type}</span>
                      <span className="text-muted-foreground"> — {p.payment_method.replace(/_/g, " ")}</span>
                    </div>
                    <span className="font-medium">${(p.total_amount / 100).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm pt-1 border-t">
                  <span className="text-muted-foreground">Balance due</span>
                  <span className={`font-semibold ${ticket.balance_due > 0 ? "text-red-600 dark:text-red-400" : "text-[var(--success)]"}`}>
                    ${ticket.balance_due.toFixed(2)}
                  </span>
                </div>
              </div>
            </DetailSection>
          </>
        )}

        {/* Timeline */}
        <Separator />
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Timeline</p>
          <div className="space-y-3">
            <TimelineItem time={formatDate(ticket.created)} event="Ticket created" />
            {ticket.technician && (
              <TimelineItem time={formatDate(ticket.created)} event={`Assigned to ${ticket.technician}`} />
            )}
            {ticket.status === "in_progress" && (
              <TimelineItem time="Now" event="Work in progress" active />
            )}
            {ticket.status === "completed" && (
              <TimelineItem time="Earlier" event="Service completed" />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function DetailSection({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      {children}
    </div>
  );
}

function TimelineItem({ time, event, active }: { time: string; event: string; active?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={`h-2 w-2 rounded-full mt-1.5 ${active ? "bg-primary" : "bg-border"}`} />
        <div className="w-px h-full bg-border" />
      </div>
      <div className="pb-3">
        <p className="text-xs text-muted-foreground">{time}</p>
        <p className="text-sm">{event}</p>
      </div>
    </div>
  );
}
