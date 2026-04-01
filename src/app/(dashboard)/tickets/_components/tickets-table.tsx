"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Pencil, Trash2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  // Pagination (optional — when omitted, shows all data with no pagination controls)
  page?: number;
  pageSize?: number;
  totalRecords?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  // Search (optional — when omitted, hides search bar)
  search?: string;
  onSearchChange?: (val: string) => void;
}

const PAGE_SIZES = [10, 15, 25, 50, 100];

export function TicketsTable({
  data, statusFilter, selectedRows, onToggleRow, onToggleAll, onStatusClick, onPaymentClick, onDelete, loading,
  page, pageSize, totalRecords, onPageChange, onPageSizeChange,
  search, onSearchChange,
}: TicketsTableProps) {
  const router = useRouter();
  const [hoveredTicket, setHoveredTicket] = useState<ApiTicket | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const filtered = statusFilter.length > 0
    ? data.filter((t) => statusFilter.includes(t.status?.toLowerCase()))
    : data;

  const allSelected = filtered.length > 0 && filtered.every((t) => selectedRows.has(t.automatic_generated_invoice_number));
  const hasPagination = page !== undefined && pageSize !== undefined && totalRecords !== undefined && onPageChange !== undefined;
  const totalPages = hasPagination ? Math.ceil(totalRecords / pageSize) : 1;
  const showStart = hasPagination ? page * pageSize + 1 : 1;
  const showEnd = hasPagination ? Math.min((page + 1) * pageSize, totalRecords) : filtered.length;
  const hasSearch = search !== undefined && onSearchChange !== undefined;

  const handleRowClick = (ticket: ApiTicket, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-no-navigate]")) return;
    const inv = ticket.automatic_generated_invoice_number;
    if (ticket.is_pos) {
      router.push(`/pos/${inv}`);
    } else {
      router.push(`/tickets/${inv}/bike`);
    }
  };

  const handlePriceHover = (ticket: ApiTicket, e: React.MouseEvent) => {
    setHoveredTicket(ticket);
    setTooltipPos({ x: e.clientX + 15, y: e.clientY + 15 });
  };

  const handlePriceMove = (e: React.MouseEvent) => {
    let x = e.clientX + 15;
    let y = e.clientY + 15;
    // Keep tooltip on screen
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      if (x + rect.width > window.innerWidth) x = e.clientX - rect.width - 15;
      if (y + rect.height > window.innerHeight) y = e.clientY - rect.height - 15;
    }
    setTooltipPos({ x, y });
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
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Search + Page Size — only shown when pagination is enabled */}
      {(hasPagination || hasSearch) && (
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/10">
          <div className="flex items-center gap-2">
            {hasPagination && onPageSizeChange && (
              <>
                <span className="text-xs text-muted-foreground">Show</span>
                <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} className="rounded-md border bg-background px-2 py-1 text-xs">
                  {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="text-xs text-muted-foreground">per page</span>
              </>
            )}
          </div>
          {hasSearch && (
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search tickets..." className="pl-8 h-7 text-xs" />
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
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
                  {/* Price cell — hover shows tooltip with ticket details */}
                  <td
                    className="px-3 py-2.5 text-sm font-medium text-right tabular-nums"
                    data-no-navigate
                    onMouseEnter={(e) => handlePriceHover(ticket, e)}
                    onMouseMove={handlePriceMove}
                    onMouseLeave={() => setHoveredTicket(null)}
                  >
                    ${(Number(ticket.total_services_price || ticket.total_price) || 0).toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-right text-muted-foreground tabular-nums">{ticket.credited_amount ? `$${ticket.credited_amount}` : "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-right text-muted-foreground tabular-nums">{ticket.discount_amount ? `$${ticket.discount_amount}` : "—"}</td>
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

      {/* Pagination Footer — only shown when pagination is enabled */}
      {hasPagination && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
          <p className="text-xs text-muted-foreground">
            Showing {totalRecords > 0 ? showStart : 0} to {showEnd} of {totalRecords} tickets
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={page === 0} onClick={() => onPageChange(0)}>First</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-xs text-muted-foreground px-2">Page {page + 1} of {totalPages || 1}</span>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={page + 1 >= totalPages} onClick={() => onPageChange(totalPages - 1)}>Last</Button>
          </div>
        </div>
      )}

      {/* Price Hover Tooltip */}
      {hoveredTicket && (
        <div
          ref={tooltipRef}
          className="fixed z-50 rounded-lg border bg-card shadow-xl p-4 pointer-events-none max-w-xs"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <p className="text-xs font-semibold mb-2">Ticket #{hoveredTicket.automatic_generated_invoice_number}</p>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between gap-6"><span className="text-muted-foreground">Customer</span><span className="font-medium">{hoveredTicket.name}</span></div>
            <div className="flex justify-between gap-6"><span className="text-muted-foreground">Phone</span><span>{hoveredTicket.phone_no}</span></div>
            {hoveredTicket.description && <div className="flex justify-between gap-6"><span className="text-muted-foreground">Description</span><span className="truncate max-w-[160px]">{hoveredTicket.description}</span></div>}
            <div className="flex justify-between gap-6"><span className="text-muted-foreground">Delivery</span><span>{formatDate(hoveredTicket.delivery_date)}</span></div>
            <div className="flex justify-between gap-6"><span className="text-muted-foreground">Status</span><span>{hoveredTicket.status}</span></div>
            <div className="flex justify-between gap-6"><span className="text-muted-foreground">Payment</span><span>{hoveredTicket.payment_status}</span></div>
            <div className="border-t my-1 pt-1">
              <div className="flex justify-between gap-6"><span className="text-muted-foreground">Price</span><span className="font-semibold tabular-nums">${(Number(hoveredTicket.total_price) || 0).toFixed(2)}</span></div>
              {hoveredTicket.credited_amount ? <div className="flex justify-between gap-6"><span className="text-muted-foreground">Deposit</span><span className="tabular-nums">${hoveredTicket.credited_amount}</span></div> : null}
              {hoveredTicket.discount_amount ? <div className="flex justify-between gap-6"><span className="text-muted-foreground">Discount</span><span className="tabular-nums">${hoveredTicket.discount_amount}</span></div> : null}
            </div>
            {hoveredTicket.services && hoveredTicket.services.length > 0 && (
              <div className="border-t my-1 pt-1">
                <span className="text-muted-foreground">Services ({hoveredTicket.services.length}):</span>
                <div className="mt-0.5">
                  {hoveredTicket.services.slice(0, 3).map((s, i) => (
                    <span key={i} className="block truncate">{s.name} — ${(Number(s.price) || 0).toFixed(2)}</span>
                  ))}
                  {hoveredTicket.services.length > 3 && <span className="text-muted-foreground">+{hoveredTicket.services.length - 3} more</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
