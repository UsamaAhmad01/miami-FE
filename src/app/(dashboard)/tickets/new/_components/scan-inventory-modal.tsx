"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, Check, Loader2, ScanBarcode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CatalogInventoryItem } from "../_data/ticket-form-types";

interface ScanInventoryModalProps {
  open: boolean;
  onClose: () => void;
  inventory: CatalogInventoryItem[];
  addedItemIds: Set<string>;
  multiBike?: boolean;
  onAdd: (item: CatalogInventoryItem) => void;
}

export function ScanInventoryModal({ open, onClose, inventory, addedItemIds, multiBike = false, onAdd }: ScanInventoryModalProps) {
  const [upc, setUpc] = useState("");
  const [results, setResults] = useState<CatalogInventoryItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setUpc("");
      setResults([]);
      setSearched(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open]);

  const performSearch = (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setSearching(true);
    // Search local inventory data by UPC (exact or partial match)
    const q = query.trim().toLowerCase();
    const matches = inventory.filter(
      (item) =>
        (item.upc_ean || "").toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q)
    );
    setResults(matches);
    setSearched(true);
    setSearching(false);
  };

  const handleInput = (value: string) => {
    setUpc(value);
    // Debounced search — 800ms after user stops typing
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(value), 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      performSearch(upc);
    }
  };

  const handleManualSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    performSearch(upc);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <ScanBarcode className="h-4 w-4" />
            Scan Inventory Item
          </DialogTitle>
          <DialogDescription className="text-xs">
            Enter or scan a UPC/EAN barcode to search inventory
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Scan or type UPC/EAN..."
              value={upc}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 h-9 text-sm font-mono"
              autoFocus
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleManualSearch} disabled={!upc.trim() || searching} className="h-9 text-xs">
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* Hint */}
        <p className="text-[10px] text-muted-foreground/60">
          Results appear automatically after typing. Press Enter for instant search.
        </p>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto divide-y -mx-1">
          {searching && (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Searching...</span>
            </div>
          )}

          {!searching && searched && results.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground">No items found for &ldquo;{upc}&rdquo;</p>
            </div>
          )}

          {!searching && results.map((item) => {
            const added = !multiBike && addedItemIds.has(item.id);
            return (
              <div key={item.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 rounded-md transition-colors">
                <div>
                  <p className="text-sm font-medium">{item.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="font-mono">{item.upc_ean}</span>
                    <span>·</span>
                    <span>{item.quantity} in stock</span>
                    <span>·</span>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
