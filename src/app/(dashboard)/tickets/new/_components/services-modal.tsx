"use client";

import { useState } from "react";
import { Search, Plus, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CatalogService } from "../_data/ticket-form-types";

interface ServicesModalProps {
  open: boolean;
  onClose: () => void;
  services: CatalogService[];
  addedServiceIds: Set<number>;
  /** When true, don't disable "added" services — dedup is per-bike, handled by bike selection modal */
  multiBike?: boolean;
  onAdd: (service: CatalogService) => void;
}

export function ServicesModal({ open, onClose, services, addedServiceIds, multiBike = false, onAdd }: ServicesModalProps) {
  const [search, setSearch] = useState("");
  const filtered = services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Select Services</DialogTitle>
          <DialogDescription className="text-xs">Add services to this ticket</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>

        <div className="max-h-64 overflow-y-auto divide-y -mx-1">
          {filtered.map((svc) => {
            const added = !multiBike && addedServiceIds.has(svc.id);
            return (
              <div key={svc.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 rounded-md transition-colors">
                <div>
                  <p className="text-sm font-medium">{svc.name}</p>
                  <p className="text-xs text-muted-foreground">${svc.price.toFixed(2)} {svc.taxable ? "• Taxable" : ""}</p>
                </div>
                <Button
                  size="sm"
                  variant={added ? "ghost" : "outline"}
                  className="h-7 text-xs"
                  disabled={added}
                  onClick={() => onAdd(svc)}
                >
                  {added ? <><Check className="h-3 w-3 mr-1" />Added</> : <><Plus className="h-3 w-3 mr-1" />Add</>}
                </Button>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No services found</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
