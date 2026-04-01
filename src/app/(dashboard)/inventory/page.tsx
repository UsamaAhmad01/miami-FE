"use client";

import { useState } from "react";
import { Plus, Upload, Trash2, Send, History, Save, Search, AlertTriangle, Loader2, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useInventorySearch, useUpdateInventoryItem, useDeleteInventoryItem, useBulkDeleteInventory } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { AddItemModal } from "./_components/add-item-modal";
import { TransferModal } from "./_components/transfer-modal";
import { HistoryModal } from "./_components/history-modal";
import { toast } from "sonner";

type InventoryItem = { id: number; part_number: string; upc_ean: string; description: string; quantity: number; unit_price: number; branch: number };

export default function InventoryPage() {
  const { user } = useAuthStore();
  const userId = user?.id || 0;
  const userBranchId = user?.branch_id || 0;

  const [activeBranch, setActiveBranch] = useState(userBranchId);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const pageSize = 10;

  const { data: inventoryData, isLoading } = useInventorySearch(userId, activeBranch, { draw: 1, start: page * pageSize, length: pageSize, search });
  const items = inventoryData?.data || [];
  const totalRecords = inventoryData?.recordsFiltered || 0;
  const branches = inventoryData?.accessible_branches || [];

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editedValues, setEditedValues] = useState<Record<number, { qty?: number; price?: number }>>({});
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);
  const [historyPart, setHistoryPart] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();
  const bulkDelete = useBulkDeleteInventory();

  const toggleRow = (id: number) => setSelectedRows((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => { const allIds = items.map((i) => i.id); const all = allIds.every((id) => selectedRows.has(id)); setSelectedRows(all ? new Set() : new Set(allIds)); };
  const allSelected = items.length > 0 && items.every((i) => selectedRows.has(i.id));

  const handleSave = async (item: InventoryItem) => {
    const edits = editedValues[item.id];
    if (!edits || (edits.qty === undefined && edits.price === undefined)) { toast.info("No changes to save"); return; }
    const payload: Record<string, unknown> = { branchId: activeBranch, itemId: item.id };
    if (edits.qty !== undefined && edits.qty !== item.quantity) payload.quantity = edits.qty;
    if (edits.price !== undefined && edits.price !== item.unit_price) payload.unit_price = edits.price;
    if (Object.keys(payload).length === 2) { toast.info("No changes to save"); return; }
    try {
      await updateItem.mutateAsync(payload as Parameters<typeof updateItem.mutateAsync>[0]);
      toast.success("Item updated");
      setEditedValues((p) => { const n = { ...p }; delete n[item.id]; return n; });
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (itemId: number) => {
    try {
      await deleteItem.mutateAsync({ branchId: activeBranch, itemId });
      toast.success("Item deleted");
      setDeleteItemId(null);
    } catch { toast.error("Failed to delete"); }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;
    try {
      await bulkDelete.mutateAsync(Array.from(selectedRows).join(","));
      toast.success(`${selectedRows.size} items deleted`);
      setSelectedRows(new Set());
      setDeleteConfirmOpen(false);
    } catch { toast.error("Failed to delete"); }
  };

  const handleImportCsv = async () => {
    if (!importFile) { toast.error("Select a CSV file"); return; }
    if (!importFile.name.toLowerCase().endsWith(".csv")) { toast.error("File must be CSV format"); return; }
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("branch", String(activeBranch));
      const { data } = await api.post("/inventory/import-csv/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      if ((data as Record<string, unknown>).error) {
        toast.error(String((data as Record<string, unknown>).error));
      } else {
        toast.success("CSV imported successfully");
        setImportModalOpen(false);
        setImportFile(null);
      }
    } catch {
      toast.error("Failed to import CSV");
    } finally {
      setImporting(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Inventory"
        description="Warehouse inventory management"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)}><FileUp className="h-3.5 w-3.5 mr-1.5" />Import CSV</Button>
            <Button variant="outline" size="sm" onClick={() => setAddModalOpen(true)}><Plus className="h-3.5 w-3.5 mr-1.5" />Add Item</Button>
            {selectedRows.size > 0 && (
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(true)}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete ({selectedRows.size})
              </Button>
            )}
          </div>
        }
      />

      {/* Branch Tabs */}
      {branches.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {branches.map((b) => (
            <button key={b.id} onClick={() => { setActiveBranch(b.id); setPage(0); setSelectedRows(new Set()); }}
              className={cn("rounded-md border px-3 py-1.5 text-xs font-medium transition-colors", activeBranch === b.id ? "border-primary/30 bg-primary/5 text-foreground" : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted")}
            >{b.name}</button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search by part #, UPC, or description..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9 h-9 text-sm" />
      </div>

      {/* Table */}
      {isLoading ? <BrandedLoader variant="inline" text="Loading inventory..." /> : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="w-10 px-3 py-2.5"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-3.5 w-3.5 rounded accent-primary" /></th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Part #</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">UPC/EAN</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Description</th>
                <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2.5 w-20">Qty</th>
                <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2.5 w-24">Price</th>
                <th className="px-3 py-2.5 w-64 text-center text-[11px] font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const edited = editedValues[item.id] || {};
                return (
                  <tr key={item.id} className={`border-b last:border-0 ${selectedRows.has(item.id) ? "bg-primary/5" : ""}`}>
                    <td className="px-3 py-2"><input type="checkbox" checked={selectedRows.has(item.id)} onChange={() => toggleRow(item.id)} className="h-3.5 w-3.5 rounded accent-primary" /></td>
                    <td className="px-3 py-2 text-xs font-mono">{item.part_number}</td>
                    <td className="px-3 py-2 text-xs font-mono text-muted-foreground">{item.upc_ean}</td>
                    <td className="px-3 py-2 text-sm">{item.description}</td>
                    <td className="px-3 py-2">
                      <Input type="number" min={0} value={edited.qty ?? item.quantity} onChange={(e) => setEditedValues((p) => ({ ...p, [item.id]: { ...p[item.id], qty: parseInt(e.target.value) || 0 } }))} className="h-7 w-16 text-sm text-center ml-auto" />
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" min={0} step={0.01} value={edited.price ?? item.unit_price} onChange={(e) => setEditedValues((p) => ({ ...p, [item.id]: { ...p[item.id], price: parseFloat(e.target.value) || 0 } }))} className="h-7 w-20 text-sm text-right ml-auto" />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {item.branch === userBranchId && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Transfer" onClick={() => setTransferItem(item)}><Send className="h-3 w-3" /></Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="History" onClick={() => setHistoryPart(item.part_number)}><History className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Save" onClick={() => handleSave(item)}><Save className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Delete" onClick={() => setDeleteItemId(item.id)}><Trash2 className="h-3 w-3 text-destructive/60" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && <tr><td colSpan={7} className="px-3 py-12 text-center text-sm text-muted-foreground">No inventory items found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalRecords > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalRecords)} of {totalRecords}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={(page + 1) * pageSize >= totalRecords} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddItemModal open={addModalOpen} onClose={() => setAddModalOpen(false)} branchId={activeBranch} />
      <TransferModal open={!!transferItem} onClose={() => setTransferItem(null)} item={transferItem} branches={branches} currentBranchId={activeBranch} />
      <HistoryModal open={!!historyPart} onClose={() => setHistoryPart("")} partNumber={historyPart} />

      {/* Delete single confirm */}
      <Dialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle className="text-base">Delete Item</DialogTitle><DialogDescription className="text-xs">This cannot be undone.</DialogDescription></DialogHeader>
          <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setDeleteItemId(null)}>Cancel</Button><Button variant="destructive" size="sm" onClick={() => deleteItemId && handleDelete(deleteItemId)}>Delete</Button></div>
        </DialogContent>
      </Dialog>

      {/* Bulk delete confirm */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />Bulk Delete</DialogTitle>
          <DialogDescription className="text-xs">Delete {selectedRows.size} items? This cannot be undone.</DialogDescription></DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={bulkDelete.isPending}>
              {bulkDelete.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete All"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import CSV modal */}
      <Dialog open={importModalOpen} onOpenChange={(o) => { if (!o) { setImportModalOpen(false); setImportFile(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Import CSV</DialogTitle>
            <DialogDescription className="text-xs">Upload a CSV file to bulk-import inventory items</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-muted"
            />
            <div className="rounded-md bg-muted/30 p-3 text-[11px] text-muted-foreground">
              <p className="font-medium mb-1">Expected CSV format:</p>
              <pre className="font-mono text-[10px] leading-relaxed">Part Number,Quantity,Unit Price,Description,upc ean{"\n"}101,5,10.50,Test Item 1,123456789012{"\n"}102,10,15.00,Test Item 2,987654321098</pre>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => { setImportModalOpen(false); setImportFile(null); }}>Cancel</Button>
            <Button size="sm" onClick={handleImportCsv} disabled={importing || !importFile}>
              {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
              {importing ? "Importing..." : "Upload"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
