"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuickImportCart } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

interface QuickOrderModalProps { open: boolean; onClose: () => void; }

export function QuickOrderModal({ open, onClose }: QuickOrderModalProps) {
  const { user } = useAuthStore();
  const [upcs, setUpcs] = useState("");
  const [warehouses, setWarehouses] = useState("");
  const [quantities, setQuantities] = useState("");
  const mutation = useQuickImportCart();

  const handleImport = async () => {
    if (!upcs.trim()) { toast.error("Enter at least one UPC"); return; }
    const formData = new FormData();
    formData.append("upc_input", upcs.split("\n").join(","));
    formData.append("vendor_input", warehouses.split("\n").join(","));
    formData.append("quantity_input", quantities.split("\n").join(","));
    formData.append("user_id", String(user?.id || ""));
    try {
      const result = await mutation.mutateAsync(formData);
      if (Array.isArray(result) && result.length > 0) {
        localStorage.setItem("importErrors", JSON.stringify(result));
        toast.warning("Import completed with errors");
      } else {
        toast.success("Items imported");
      }
      setUpcs(""); setWarehouses(""); setQuantities("");
      onClose();
    } catch { toast.error("Failed to import"); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Quick Order</DialogTitle>
          <DialogDescription className="text-xs">Enter one per line</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-xs">UPC (required)</Label><textarea value={upcs} onChange={(e) => setUpcs(e.target.value)} rows={6} placeholder="UPC1&#10;UPC2&#10;UPC3" className="mt-1 flex w-full rounded-md border bg-background px-2 py-1.5 text-xs font-mono resize-none" /></div>
          <div><Label className="text-xs">Warehouse (optional)</Label><textarea value={warehouses} onChange={(e) => setWarehouses(e.target.value)} rows={6} placeholder="QBP&#10;J&B&#10;Trek" className="mt-1 flex w-full rounded-md border bg-background px-2 py-1.5 text-xs resize-none" /></div>
          <div><Label className="text-xs">Quantity</Label><textarea value={quantities} onChange={(e) => setQuantities(e.target.value)} rows={6} placeholder="3&#10;1&#10;2" className="mt-1 flex w-full rounded-md border bg-background px-2 py-1.5 text-xs font-mono resize-none" /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleImport} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Import"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
