"use client";

import { User, Mail, Phone, MapPin, Clock, DollarSign, Wrench, MessageSquare, Tag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/primitives/status-badge";
import { type Customer, TAG_COLORS } from "../_data/mock-customers";

const statusMap: Record<string, "info" | "warning" | "success" | "neutral" | "error"> = {
  open: "info",
  in_progress: "warning",
  waiting: "neutral",
  completed: "success",
  cancelled: "error",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface CustomerDetailProps {
  customer: Customer | null;
  onClose: () => void;
}

export function CustomerDetail({ customer, onClose }: CustomerDetailProps) {
  return (
    <Sheet open={!!customer} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        {customer && <CustomerDetailContent customer={customer} />}
      </SheetContent>
    </Sheet>
  );
}

function CustomerDetailContent({ customer }: { customer: Customer }) {
  return (
    <>
      <SheetHeader className="p-5 pb-0">
        <SheetTitle className="text-lg">{customer.name}</SheetTitle>
        <SheetDescription className="sr-only">Customer profile for {customer.name}</SheetDescription>
        {customer.tags.length > 0 && (
          <div className="flex gap-1.5 mt-1">
            {customer.tags.map((tag) => (
              <span key={tag} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${TAG_COLORS[tag] || "bg-muted text-muted-foreground"}`}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </SheetHeader>

      {/* Quick Actions */}
      <div className="flex gap-2 px-5 py-3">
        <Button size="sm" variant="default" className="text-xs h-7">Create Ticket</Button>
        <Button size="sm" variant="outline" className="text-xs h-7">Open POS</Button>
        <Button size="sm" variant="outline" className="text-xs h-7">Send Message</Button>
      </div>

      <Separator />

      <div className="p-5 space-y-4">
        {/* Contact Info */}
        <div className="grid grid-cols-1 gap-3">
          <InfoRow icon={Phone} label="Phone" value={customer.phone} />
          <InfoRow icon={Mail} label="Email" value={customer.email} />
          <InfoRow icon={MapPin} label="Address" value={customer.address} />
        </div>

        <Separator />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatBlock icon={Wrench} label="Tickets" value={String(customer.total_tickets)} />
          <StatBlock icon={DollarSign} label="Total Spent" value={`$${customer.total_spent.toLocaleString()}`} />
          <StatBlock icon={Clock} label="Customer Since" value={formatDate(customer.created_at)} />
        </div>

        {customer.notes && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <MessageSquare className="h-3 w-3 text-muted-foreground" />
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Notes</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{customer.notes}</p>
            </div>
          </>
        )}

        {/* Ticket History */}
        <Separator />
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Service History</p>
            <span className="text-xs text-muted-foreground">{customer.tickets.length} tickets</span>
          </div>

          {customer.tickets.length > 0 ? (
            <div className="space-y-2">
              {customer.tickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center gap-3 rounded-md border p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-medium">{ticket.id}</span>
                      <StatusBadge status={statusMap[ticket.status]}>{ticket.status.replace(/_/g, " ")}</StatusBadge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{ticket.bike} — {ticket.services.join(", ")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium">${ticket.total}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(ticket.created)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No service history yet.</p>
          )}
        </div>
      </div>
    </>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

function StatBlock({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="text-center">
      <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
