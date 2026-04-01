"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Filters {
  brand: string;
  minPrice: string;
  maxPrice: string;
  minMargin: string;
  maxMargin: string;
  stock: string;
}

interface FilterPanelProps {
  filters: Filters;
  onApply: (filters: Filters) => void;
  onClear: () => void;
}

export function FilterPanel({ filters: initialFilters, onApply, onClear }: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const update = (key: keyof Filters, value: string) => setFilters((p) => ({ ...p, [key]: value }));
  const hasFilters = Object.values(initialFilters).some((v) => v !== "");

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Filters</h3>
          {hasFilters && <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">Active</span>}
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div><Label className="text-xs">Min Price</Label><Input type="number" value={filters.minPrice} onChange={(e) => update("minPrice", e.target.value)} placeholder="$0" className="mt-1 h-8 text-sm" /></div>
            <div><Label className="text-xs">Max Price</Label><Input type="number" value={filters.maxPrice} onChange={(e) => update("maxPrice", e.target.value)} placeholder="$999" className="mt-1 h-8 text-sm" /></div>
            <div><Label className="text-xs">Min Margin %</Label><Input type="number" value={filters.minMargin} onChange={(e) => update("minMargin", e.target.value)} placeholder="0%" className="mt-1 h-8 text-sm" /></div>
            <div><Label className="text-xs">Max Margin %</Label><Input type="number" value={filters.maxMargin} onChange={(e) => update("maxMargin", e.target.value)} placeholder="100%" className="mt-1 h-8 text-sm" /></div>
            <div><Label className="text-xs">Brand</Label><Input value={filters.brand} onChange={(e) => update("brand", e.target.value)} placeholder="Brand name" className="mt-1 h-8 text-sm" /></div>
            <div>
              <Label className="text-xs">Stock</Label>
              <select value={filters.stock} onChange={(e) => update("stock", e.target.value)} className="mt-1 flex h-8 w-full rounded-md border bg-background px-2 py-1 text-sm">
                <option value="">All</option>
                <option value="yes">In Stock</option>
                <option value="no">Out of Stock</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={() => onApply(filters)}>Apply Filters</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setFilters({ brand: "", minPrice: "", maxPrice: "", minMargin: "", maxMargin: "", stock: "" }); onClear(); }}>
              <X className="h-3 w-3 mr-1" />Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
