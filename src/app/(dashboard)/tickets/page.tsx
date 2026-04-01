"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus, LayoutList, Kanban, DollarSign, Wrench, Clock, Download, Trash2,
  RefreshCw, CreditCard, MessageSquare, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { KpiCard } from "@/components/primitives/kpi-card";
import { TicketsTable } from "./_components/tickets-table";
import { TicketFilters } from "./_components/ticket-filters";
import { BulkDeleteModal, BulkStatusModal, BulkPaymentModal, BulkNotesModal, BulkEmailModal } from "./_components/bulk-modals";
import { type ApiTicket } from "./_data/api-types";
import { useTicketsByBranch, useExportTickets, useDeleteTicket } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

type ViewMode = "table" | "kanban";
type BulkModal = "delete" | "status" | "payment" | "notes" | "email" | null;

export default function TicketsPage() {
  const [view, setView] = useState<ViewMode>("table");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [specialOrders, setSpecialOrders] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [bulkModal, setBulkModal] = useState<BulkModal>(null);

  const { user } = useAuthStore();
  const branch = user?.branch_name || "";

  // Fetch tickets from real API
  const { data: ticketsResponse, isLoading } = useTicketsByBranch(branch, {
    special_order: specialOrders ? "Yes" : undefined,
    length: 50,
  });

  const tickets: ApiTicket[] = (ticketsResponse?.data || []) as unknown as ApiTicket[];

  const exportMutation = useExportTickets(branch);
  const deleteMutation = useDeleteTicket();

  // Compute ticket counts for filters
  const ticketCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => {
      const s = t.status?.toLowerCase() || "unknown";
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [tickets]);

  const toggleStatus = (status: string) => {
    setStatusFilter((prev) => prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]);
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const allIds = tickets.map((t) => t.automatic_generated_invoice_number);
    const allSelected = allIds.every((id) => selectedRows.has(id));
    setSelectedRows(allSelected ? new Set() : new Set(allIds));
  };

  const handleDelete = async (invoiceNumber: string) => {
    try {
      await deleteMutation.mutateAsync(invoiceNumber);
      toast.success(`Ticket ${invoiceNumber} deleted`);
    } catch {
      toast.error("Failed to delete ticket");
    }
  };

  const handleExport = () => {
    exportMutation.mutate(Array.from(selectedRows));
  };

  const selectedIdsArray = Array.from(selectedRows);

  // KPI calculations from live data
  const pendingCount = tickets.filter((t) => t.status?.toLowerCase() === "pending").length;
  const completedCount = tickets.filter((t) => t.status?.toLowerCase() === "completed").length;
  const unpaidTotal = tickets.filter((t) => {
    const ps = (t.payment_status || "").toLowerCase().replace(/[\s_]/g, "");
    return ps !== "fullypaid" && ps !== "paid";
  }).reduce((sum, t) => sum + (t.total_price || 0), 0);
  const completedRevenue = tickets.filter((t) => t.status?.toLowerCase() === "completed").reduce((sum, t) => sum + (t.total_price || 0), 0);

  return (
    <PageShell>
      <PageHeader
        title="Tickets"
        description={`${branch} — ${tickets.length} total tickets`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border bg-muted/40 p-0.5">
              <button onClick={() => setView("table")} className={`rounded-sm px-2 py-1 text-xs font-medium transition-colors ${view === "table" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}>
                <LayoutList className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setView("kanban")} className={`rounded-sm px-2 py-1 text-xs font-medium transition-colors ${view === "kanban" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}>
                <Kanban className="h-3.5 w-3.5" />
              </button>
            </div>
            <Link href="/tickets/new">
              <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" />New Ticket</Button>
            </Link>
          </div>
        }
      />

      {/* KPIs from real data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Pending" value={String(pendingCount)} icon={Wrench} />
        <KpiCard title="Completed" value={String(completedCount)} icon={Clock} trend="up" />
        <KpiCard title="Unpaid Balance" value={`$${unpaidTotal.toFixed(0)}`} trend="down" icon={DollarSign} />
        <KpiCard title="Completed Revenue" value={`$${completedRevenue.toFixed(0)}`} trend="up" icon={DollarSign} />
      </div>

      {view === "table" && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <TicketFilters activeStatuses={statusFilter} onToggle={toggleStatus} ticketCounts={ticketCounts} />
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none ml-2">
                <input type="checkbox" checked={specialOrders} onChange={(e) => setSpecialOrders(e.target.checked)} className="h-3 w-3 rounded accent-primary" />
                Special Orders
              </label>
            </div>

            {selectedRows.size > 0 && (
              <div className="flex items-center gap-1.5 animate-fade-in">
                <span className="text-xs text-muted-foreground mr-1">{selectedRows.size} selected</span>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkModal("delete")}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkModal("status")}><RefreshCw className="h-3 w-3 mr-1" />Status</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkModal("payment")}><CreditCard className="h-3 w-3 mr-1" />Payment</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkModal("notes")}><MessageSquare className="h-3 w-3 mr-1" />Notes</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkModal("email")}><Mail className="h-3 w-3 mr-1" />Email</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleExport}><Download className="h-3 w-3 mr-1" />Export</Button>
              </div>
            )}
          </div>

          <TicketsTable
            data={tickets}
            statusFilter={statusFilter}
            selectedRows={selectedRows}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            onStatusClick={() => {}}
            onPaymentClick={() => {}}
            onDelete={handleDelete}
            loading={isLoading}
          />
        </>
      )}

      {/* Bulk Modals */}
      <BulkDeleteModal open={bulkModal === "delete"} onClose={() => { setBulkModal(null); setSelectedRows(new Set()); }} selectedIds={selectedIdsArray} onSuccess={() => setSelectedRows(new Set())} />
      <BulkStatusModal open={bulkModal === "status"} onClose={() => setBulkModal(null)} selectedIds={selectedIdsArray} />
      <BulkPaymentModal open={bulkModal === "payment"} onClose={() => setBulkModal(null)} selectedIds={selectedIdsArray} />
      <BulkNotesModal open={bulkModal === "notes"} onClose={() => setBulkModal(null)} selectedIds={selectedIdsArray} />
      <BulkEmailModal open={bulkModal === "email"} onClose={() => setBulkModal(null)} selectedIds={selectedIdsArray} />
    </PageShell>
  );
}
