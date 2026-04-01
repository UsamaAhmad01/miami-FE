"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateInventoryItem } from "@/hooks/use-api";
import { toast } from "sonner";

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  item: { id: number; part_number: string; quantity: number; branch: number } | null;
  branches: Array<{ id: number; name: string }>;
  currentBranchId: number;
}

export function TransferModal({ open, onClose, item, branches, currentBranchId }: TransferModalProps) {
  const [destBranch, setDestBranch] = useState("");
  const [qty, setQty] = useState("");
  const [remarks, setRemarks] = useState("");
  const mutation = useUpdateInventoryItem();

  if (!item) return null;

  const otherBranches = branches.filter((b) => b.id !== currentBranchId);

  const handleTransfer = async () => {
    const q = parseInt(qty);
    if (!destBranch) { toast.error("Select destination branch"); return; }
    if (!q || q <= 0 || q > item.quantity) { toast.error(`Quantity must be 1–${item.quantity}`); return; }
    try {
      await mutation.mutateAsync({
        branchId: currentBranchId,
        itemId: item.id,
        branch: parseInt(destBranch),
        quantity: q,
        remarks,
      });
      toast.success("Transfer completed");
      setDestBranch(""); setQty(""); setRemarks("");
      onClose();
    } catch { toast.error("Failed to transfer"); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Transfer Quantity</DialogTitle>
          <DialogDescription className="text-xs">Send items to another branch</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-md border bg-muted/20 p-3 text-xs space-y-1">
            <p><span className="text-muted-foreground">Part #:</span> <span className="font-mono">{item.part_number}</span></p>
            <p><span className="text-muted-foreground">Available:</span> <span className="font-semibold">{item.quantity}</span></p>
          </div>
          <div>
            <Label className="text-xs">Destination Branch</Label>
            <select value={destBranch} onChange={(e) => setDestBranch(e.target.value)} className="mt-1 flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
              <option value="">Select branch...</option>
              {otherBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div><Label className="text-xs">Quantity (max {item.quantity})</Label><Input type="number" min={1} max={item.quantity} value={qty} onChange={(e) => setQty(e.target.value)} className="mt-1 h-9 text-sm" /></div>
          <div><Label className="text-xs">Remarks</Label><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Transfer reason" className="mt-1 h-9 text-sm" /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleTransfer} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Transfer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
