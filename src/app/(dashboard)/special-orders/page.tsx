"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, DollarSign, Wrench, Clock, Download, Trash2, RefreshCw, CreditCard, MessageSquare, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { KpiCard } from "@/components/primitives/kpi-card";
import { TicketsTable } from "@/app/(dashboard)/tickets/_components/tickets-table";
import { TicketFilters } from "@/app/(dashboard)/tickets/_components/ticket-filters";
import { BulkDeleteModal, BulkStatusModal, BulkPaymentModal, BulkNotesModal, BulkEmailModal } from "@/app/(dashboard)/tickets/_components/bulk-modals";
import { type ApiTicket } from "@/app/(dashboard)/tickets/_data/api-types";
import { useTicketsByBranch, useExportTickets, useDeleteTicket } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

type BulkModal = "delete" | "status" | "payment" | "notes" | "email" | null;

export default function SpecialOrdersPage() {
  const { user } = useAuthStore();
  const branch = user?.branch_name || "";
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [bulkModal, setBulkModal] = useState<BulkModal>(null);

  const { data: response, isLoading } = useTicketsByBranch(branch, { special_order: "Yes", length: 50 });
  const tickets: ApiTicket[] = (response?.data || []) as unknown as ApiTicket[];

  const exportMutation = useExportTickets(branch);
  const deleteMutation = useDeleteTicket();

  const ticketCounts = useMemo(() => { const c: Record<string, number> = {}; tickets.forEach((t) => { const s = t.status?.toLowerCase() || "unknown"; c[s] = (c[s] || 0) + 1; }); return c; }, [tickets]);
  const toggleStatus = (s: string) => setStatusFilter((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const toggleRow = (id: string) => setSelectedRows((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => { const ids = tickets.map((t) => t.automatic_generated_invoice_number); setSelectedRows(ids.every((id) => selectedRows.has(id)) ? new Set() : new Set(ids)); };
  const selectedIdsArray = Array.from(selectedRows);

  return (
    <PageShell>
      <PageHeader title="Special Orders" description={`${branch} — ${tickets.length} special orders`} actions={
        <Link href="/tickets/new"><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" />New Ticket</Button></Link>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard title="Total" value={String(tickets.length)} icon={Wrench} />
        <KpiCard title="Pending" value={String(tickets.filter((t) => t.status?.toLowerCase() === "pending").length)} icon={Clock} />
        <KpiCard title="Value" value={`$${tickets.reduce((s, t) => s + (t.total_services_price || t.total_price || 0), 0).toFixed(0)}`} icon={DollarSign} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <TicketFilters activeStatuses={statusFilter} onToggle={toggleStatus} ticketCounts={ticketCounts} />
        {selectedRows.size > 0 && (
          <div className="flex items-center gap-1.5 animate-fade-in">
            <span className="text-xs text-muted-foreground mr-1">{selectedRows.size} selected</span>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkModal("delete")}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkModal("status")}><RefreshCw className="h-3 w-3 mr-1" />Status</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkModal("payment")}><CreditCard className="h-3 w-3 mr-1" />Payment</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkModal("notes")}><MessageSquare className="h-3 w-3 mr-1" />Notes</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkModal("email")}><Mail className="h-3 w-3 mr-1" />Email</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => exportMutation.mutate(selectedIdsArray)}><Download className="h-3 w-3 mr-1" />Export</Button>
          </div>
        )}
      </div>

      <TicketsTable data={tickets} statusFilter={statusFilter} selectedRows={selectedRows} onToggleRow={toggleRow} onToggleAll={toggleAll} onStatusClick={() => {}} onPaymentClick={() => {}} onDelete={(id) => deleteMutation.mutateAsync(id).then(() => toast.success("Deleted"))} loading={isLoading} />

      <BulkDeleteModal open={bulkModal === "delete"} onClose={() => { setBulkModal(null); setSelectedRows(new Set()); }} selectedIds={selectedIdsArray} onSuccess={() => setSelectedRows(new Set())} />
      <BulkStatusModal open={bulkModal === "status"} onClose={() => setBulkModal(null)} selectedIds={selectedIdsArray} />
      <BulkPaymentModal open={bulkModal === "payment"} onClose={() => setBulkModal(null)} selectedIds={selectedIdsArray} />
      <BulkNotesModal open={bulkModal === "notes"} onClose={() => setBulkModal(null)} selectedIds={selectedIdsArray} />
      <BulkEmailModal open={bulkModal === "email"} onClose={() => setBulkModal(null)} selectedIds={selectedIdsArray} />
    </PageShell>
  );
}
