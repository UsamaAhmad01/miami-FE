"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddToWatchlist } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

interface WatchlistModalProps {
  open: boolean;
  onClose: () => void;
  upc: string;
}

export function WatchlistModal({ open, onClose, upc }: WatchlistModalProps) {
  const { user } = useAuthStore();
  const mutation = useAddToWatchlist();
  const [priceAlert, setPriceAlert] = useState(false);
  const [stockAlert, setStockAlert] = useState(false);
  const [priceTarget, setPriceTarget] = useState("");

  const canSubmit = priceAlert || stockAlert;

  const handleSubmit = async () => {
    if (priceAlert && (!priceTarget || parseFloat(priceTarget) <= 0)) {
      toast.error("Enter a valid price target");
      return;
    }
    try {
      const item: { sku: string; priceTarget?: number; boolpriceTarget?: boolean; boolcheckstock?: boolean } = {
        sku: upc,
        boolcheckstock: stockAlert,
      };
      if (priceAlert) {
        item.priceTarget = parseFloat(priceTarget);
        item.boolpriceTarget = true;
      }
      await mutation.mutateAsync({
        user_id: String(user?.id || ""),
        items: [item],
      });
      toast.success("Added to Watch List");
      setPriceAlert(false);
      setStockAlert(false);
      setPriceTarget("");
      onClose();
    } catch {
      toast.error("Failed to add to watch list");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Add to Watch List</DialogTitle>
          <DialogDescription className="text-xs">Get notified about this product</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={priceAlert} onChange={(e) => setPriceAlert(e.target.checked)} className="h-4 w-4 rounded accent-primary" />
            <span className="text-sm">Price Target Alert</span>
          </label>
          {priceAlert && (
            <div className="ml-6">
              <Label className="text-xs">Target Price ($)</Label>
              <Input type="number" step="0.01" value={priceTarget} onChange={(e) => setPriceTarget(e.target.value)} placeholder="0.00" className="mt-1 h-8 text-sm w-32" />
            </div>
          )}

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={stockAlert} onChange={(e) => setStockAlert(e.target.checked)} className="h-4 w-4 rounded accent-primary" />
            <span className="text-sm">Stock Availability Alert</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Start Watching"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
