"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddInventoryItem, useProductByUpc } from "@/hooks/use-api";
import { toast } from "sonner";

interface AddItemModalProps { open: boolean; onClose: () => void; branchId: number; }

export function AddItemModal({ open, onClose, branchId }: AddItemModalProps) {
  const [upc, setUpc] = useState("");
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [debouncedUpc, setDebouncedUpc] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mutation = useAddInventoryItem();

  // Debounce UPC lookup
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (upc.length > 3) {
      timerRef.current = setTimeout(() => setDebouncedUpc(upc), 1500);
    }
    return () => clearTimeout(timerRef.current);
  }, [upc]);

  const { data: upcData, isFetching } = useProductByUpc(debouncedUpc);
  useEffect(() => { if (upcData?.description) setDesc(upcData.description); }, [upcData]);

  const handleAdd = async () => {
    if (!upc.trim()) { toast.error("UPC is required"); return; }
    if (!qty || parseInt(qty) <= 0) { toast.error("Valid quantity required"); return; }
    try {
      await mutation.mutateAsync({
        branchId,
        part_number: upc,
        description: desc,
        quantity: parseInt(qty),
        unit_price: parseFloat(price) || 0,
        upc_ean: upc,
        branch: String(branchId),
      });
      toast.success("Item added");
      setUpc(""); setDesc(""); setQty(""); setPrice(""); setDebouncedUpc("");
    } catch { toast.error("Failed to add item"); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setUpc(""); setDesc(""); setQty(""); setPrice(""); } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Add Inventory Item</DialogTitle>
          <DialogDescription className="text-xs">Add a single item to inventory</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">UPC/EAN</Label>
            <div className="relative">
              <Input value={upc} onChange={(e) => setUpc(e.target.value)} placeholder="Scan or enter UPC" className="mt-1 h-9 text-sm" autoFocus />
              {isFetching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>
          </div>
          <div><Label className="text-xs">Description</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Auto-filled from UPC" className="mt-1 h-9 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Quantity</Label><Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} className="mt-1 h-9 text-sm" /></div>
            <div><Label className="text-xs">Unit Price ($)</Label><Input type="number" step="0.01" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 h-9 text-sm" /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          <Button size="sm" onClick={handleAdd} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add Item"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
