"use client";

import { useState } from "react";
import { Search, Plus, Check, Barcode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CatalogInventoryItem } from "../_data/ticket-form-types";

interface InventoryModalProps {
  open: boolean;
  onClose: () => void;
  inventory: CatalogInventoryItem[];
  addedItemIds: Set<string>;
  /** When true, don't disable "added" items — dedup is per-bike, handled by bike selection modal */
  multiBike?: boolean;
  onAdd: (item: CatalogInventoryItem) => void;
}

export function InventoryModal({ open, onClose, inventory, addedItemIds, multiBike = false, onAdd }: InventoryModalProps) {
  const [search, setSearch] = useState("");
  const filtered = inventory.filter((item) =>
    (item.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (item.upc_ean || "").includes(search)
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Add Inventory Item</DialogTitle>
          <DialogDescription className="text-xs">Search by name or scan UPC</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by description or UPC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
            autoFocus
          />
        </div>

        <div className="max-h-64 overflow-y-auto divide-y -mx-1">
          {filtered.map((item) => {
            const added = !multiBike && addedItemIds.has(item.id);
            return (
              <div key={item.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 rounded-md transition-colors">
                <div>
                  <p className="text-sm font-medium">{item.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="font-mono">{item.upc_ean}</span>
                    <span>•</span>
                    <span>{item.quantity} in stock</span>
                    <span>•</span>
                    <span>${Number(item.unit_price || 0).toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={added ? "ghost" : "outline"}
                  className="h-7 text-xs"
                  disabled={added || item.quantity === 0}
                  onClick={() => onAdd(item)}
                >
                  {added ? <><Check className="h-3 w-3 mr-1" />Added</> : <><Plus className="h-3 w-3 mr-1" />Add</>}
                </Button>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No items found</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
