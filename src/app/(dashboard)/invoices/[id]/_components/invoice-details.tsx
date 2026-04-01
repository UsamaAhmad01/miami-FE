"use client";

import { Building2, User, Phone, Mail, MapPin, Calendar, Wrench, FileText } from "lucide-react";

interface InvoiceDetailsProps {
  branch: Record<string, string>;
  ticket: Record<string, unknown>;
}

export function InvoiceDetails({ branch, ticket }: InvoiceDetailsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* From (Branch) */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">From</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm font-medium">{branch.name || branch.branch_name || "Miami Bikes"}</span></div>
          {branch.address && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm text-muted-foreground">{branch.address}</span></div>}
          {branch.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm text-muted-foreground">{branch.phone}</span></div>}
        </div>
      </div>

      {/* To (Customer) */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">To</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm font-medium">{String(ticket.name || "—")}</span></div>
          <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm text-muted-foreground">{String(ticket.phone_no || "—")}</span></div>
          {typeof ticket.email === "string" && ticket.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm text-muted-foreground">{ticket.email}</span></div>}
          {typeof ticket.address === "string" && ticket.address && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm text-muted-foreground">{ticket.address}</span></div>}
        </div>
      </div>

      {/* Invoice Info */}
      <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t">
        <InfoBlock icon={FileText} label="Invoice #" value={String(ticket.automatic_generated_invoice_number || "")} />
        <InfoBlock icon={Calendar} label="Delivery Date" value={String(ticket.delivery_date || "—")} />
        <InfoBlock icon={Wrench} label="Mechanic" value={String(ticket.mechanic || "Unassigned")} />
        <InfoBlock icon={FileText} label="Description" value={String(ticket.description || "—")} />
      </div>
    </div>
  );
}

function InfoBlock({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5"><Icon className="h-3 w-3 text-muted-foreground" /><p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p></div>
      <p className="text-sm truncate">{value}</p>
    </div>
  );
}
