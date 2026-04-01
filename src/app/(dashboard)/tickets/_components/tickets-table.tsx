"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/primitives/status-badge";
import { type ApiTicket, normalizeStatus, normalizePaymentStatus } from "../_data/api-types";

function formatDate(d: string) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return `${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}-${date.getFullYear()}`;
}

interface TicketsTableProps {
  data: ApiTicket[];
  statusFilter: string[];
  selectedRows: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  onStatusClick: (ticket: ApiTicket) => void;
  onPaymentClick: (ticket: ApiTicket) => void;
  onDelete: (invoiceNumber: string) => void;
  loading?: boolean;
}

export function TicketsTable({
  data, statusFilter, selectedRows, onToggleRow, onToggleAll, onStatusClick, onPaymentClick, onDelete, loading,
}: TicketsTableProps) {
  const router = useRouter();

  const filtered = statusFilter.length > 0
    ? data.filter((t) => statusFilter.includes(t.status?.toLowerCase()))
    : data;

  const allSelected = filtered.length > 0 && filtered.every((t) => selectedRows.has(t.automatic_generated_invoice_number));

  const handleRowClick = (ticket: ApiTicket, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-no-navigate]")) return;
    const inv = ticket.automatic_generated_invoice_number;
    // POS tickets → POS detail page, bike tickets → ticket detail page
    if (ticket.is_pos) {
      router.push(`/pos/${inv}`);
    } else {
      router.push(`/tickets/${inv}/bike`);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="w-10 px-3 py-2.5" data-no-navigate>
              <input type="checkbox" checked={allSelected} onChange={onToggleAll} className="h-3.5 w-3.5 rounded accent-primary" />
            </th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Invoice #</th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Customer</th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Phone</th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5 max-w-[200px]">Description</th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Delivery</th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Status</th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Validated</th>
            <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2.5">Price</th>
            <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2.5">Deposit</th>
            <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2.5">Discount</th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Payment</th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5 w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((ticket) => {
            const inv = ticket.automatic_generated_invoice_number;
            const statusCfg = normalizeStatus(ticket.status);
            const paymentCfg = normalizePaymentStatus(ticket.payment_status);
            const isSelected = selectedRows.has(inv);

            return (
              <tr
                key={inv}
                onClick={(e) => handleRowClick(ticket, e)}
                className={`border-b last:border-0 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/30"}`}
              >
                <td className="px-3 py-2.5" data-no-navigate>
                  <input type="checkbox" checked={isSelected} onChange={() => onToggleRow(inv)} className="h-3.5 w-3.5 rounded accent-primary" />
                </td>
                <td className="px-3 py-2.5 font-mono text-xs font-medium">{inv}</td>
                <td className="px-3 py-2.5 text-sm font-medium">{ticket.name}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{ticket.phone_no}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">{ticket.description || "—"}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{formatDate(ticket.delivery_date)}</td>
                <td className="px-3 py-2.5" data-no-navigate>
                  <button onClick={(e) => { e.stopPropagation(); onStatusClick(ticket); }}>
                    <StatusBadge status={statusCfg.color}>{statusCfg.label}</StatusBadge>
                  </button>
                </td>
                <td className="px-3 py-2.5 text-xs">{ticket.validated_by || "—"}</td>
                <td className="px-3 py-2.5 text-sm font-medium text-right">${(ticket.total_services_price || ticket.total_price || 0).toFixed(2)}</td>
                <td className="px-3 py-2.5 text-xs text-right text-muted-foreground">{ticket.credited_amount ? `$${ticket.credited_amount}` : "—"}</td>
                <td className="px-3 py-2.5 text-xs text-right text-muted-foreground">{ticket.discount_amount ? `$${ticket.discount_amount}` : "—"}</td>
                <td className="px-3 py-2.5" data-no-navigate>
                  <button onClick={(e) => { e.stopPropagation(); onPaymentClick(ticket); }}>
                    <StatusBadge status={paymentCfg.color}>{paymentCfg.label}</StatusBadge>
                  </button>
                </td>
                <td className="px-3 py-2.5" data-no-navigate>
                  <div className="flex items-center gap-1">
                    <Link href={`/invoices/${inv}`} onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Invoice"><FileText className="h-3 w-3" /></Button>
                    </Link>
                    <Link href={`/tickets/${inv}/edit`} onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Edit"><Pencil className="h-3 w-3" /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-6 w-6" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(inv); }}>
                      <Trash2 className="h-3 w-3 text-destructive/60 hover:text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr><td colSpan={13} className="px-3 py-12 text-center text-sm text-muted-foreground">No tickets found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
