"use client";

import { useCallback, useState } from "react";
import {
  Bike, Plus, Minus, Trash2, Wrench, Package, FileText, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  type BikeCart, type CartService, type CartCustomItem, type CartInventoryItem,
  type Pricing, applyProcessingFee,
} from "../new/_data/ticket-form-types";
import { EditBikeModal } from "../new/_components/edit-bike-modal";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface BikeCardsDisplayProps {
  bikes: BikeCart[];
  pricing: Pricing;
  /** Full inventory catalog for stock validation */
  inventory: Array<{ id: string; quantity?: number }>;
  onBikesChange: (updater: (prev: BikeCart[]) => BikeCart[]) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BikeCardsDisplay({ bikes, pricing, inventory, onBikesChange }: BikeCardsDisplayProps) {
  const [renameTarget, setRenameTarget] = useState<{ bikeId: number; name: string } | null>(null);

  /* ---- Bike-level actions ---- */

  const addBike = useCallback(() => {
    onBikesChange((prev) => {
      const maxId = prev.reduce((mx, b) => Math.max(mx, b.bike_id), 0);
      return [...prev, {
        bike_id: maxId + 1,
        bike_name: `Bike ${prev.length + 1}`,
        services: [],
        custom_items: [],
        inventory_items: [],
      }];
    });
    toast.success("Bike added");
  }, [onBikesChange]);

  const removeBike = useCallback((bikeId: number) => {
    onBikesChange((prev) => {
      if (prev.length <= 1) {
        toast.error("Cannot remove the last bike");
        return prev;
      }
      return prev.filter((b) => b.bike_id !== bikeId);
    });
  }, [onBikesChange]);

  const renameBike = useCallback((bikeId: number, newName: string) => {
    onBikesChange((prev) =>
      prev.map((b) => (b.bike_id === bikeId ? { ...b, bike_name: newName } : b)),
    );
    toast.success("Bike renamed");
  }, [onBikesChange]);

  /* ---- Item-level actions ---- */

  const removeService = useCallback((bikeId: number, serviceId: number) => {
    onBikesChange((prev) =>
      prev.map((b) =>
        b.bike_id !== bikeId ? b : { ...b, services: b.services.filter((s) => s.service_id !== serviceId) },
      ),
    );
  }, [onBikesChange]);

  const removeCustomItem = useCallback((bikeId: number, itemId: string) => {
    onBikesChange((prev) =>
      prev.map((b) =>
        b.bike_id !== bikeId ? b : { ...b, custom_items: b.custom_items.filter((c) => c.id !== itemId) },
      ),
    );
  }, [onBikesChange]);

  const removeInventoryItem = useCallback((bikeId: number, itemId: string) => {
    onBikesChange((prev) =>
      prev.map((b) =>
        b.bike_id !== bikeId ? b : { ...b, inventory_items: b.inventory_items.filter((i) => i.item_id !== itemId) },
      ),
    );
  }, [onBikesChange]);

  const updateCustomPrice = useCallback((bikeId: number, itemId: string, rawPrice: number) => {
    if (isNaN(rawPrice) || rawPrice < 0) return;
    const priceWithFee = applyProcessingFee(rawPrice, pricing.service_charge);
    onBikesChange((prev) =>
      prev.map((b) =>
        b.bike_id !== bikeId
          ? b
          : { ...b, custom_items: b.custom_items.map((c) => (c.id === itemId ? { ...c, price: priceWithFee, original_price: rawPrice } : c)) },
      ),
    );
  }, [onBikesChange, pricing.service_charge]);

  const updateQuantity = useCallback((bikeId: number, type: "custom" | "inventory", itemId: string, delta: number) => {
    onBikesChange((prev) =>
      prev.map((b) => {
        if (b.bike_id !== bikeId) return b;

        if (type === "custom") {
          const updated = b.custom_items
            .map((c) => (c.id === itemId ? { ...c, quantity: c.quantity + delta } : c))
            .filter((c) => c.quantity > 0);
          return { ...b, custom_items: updated };
        }

        // Inventory — validate stock on increase
        const item = b.inventory_items.find((i) => i.item_id === itemId);
        if (!item) return b;
        const newQty = item.quantity + delta;
        if (newQty < 1) return { ...b, inventory_items: b.inventory_items.filter((i) => i.item_id !== itemId) };

        if (delta > 0) {
          const catalogItem = inventory.find((inv) => inv.id === itemId);
          const available = catalogItem?.quantity || 0;
          const totalUsed = prev.reduce(
            (sum, bk) => sum + (bk.inventory_items.find((i) => i.item_id === itemId)?.quantity || 0),
            0,
          );
          if (totalUsed - item.quantity + newQty > available) {
            toast.error(`Insufficient stock. Available: ${available}, used across bikes: ${totalUsed - item.quantity}`);
            return b;
          }
        }

        return { ...b, inventory_items: b.inventory_items.map((i) => (i.item_id === itemId ? { ...i, quantity: newQty } : i)) };
      }),
    );
  }, [onBikesChange, inventory]);

  const updateTaxable = useCallback((bikeId: number, type: "custom" | "inventory", itemId: string, taxable: boolean) => {
    onBikesChange((prev) =>
      prev.map((b) => {
        if (b.bike_id !== bikeId) return b;
        if (type === "custom") {
          return { ...b, custom_items: b.custom_items.map((c) => (c.id === itemId ? { ...c, taxable } : c)) };
        }
        return { ...b, inventory_items: b.inventory_items.map((i) => (i.item_id === itemId ? { ...i, taxable } : i)) };
      }),
    );
  }, [onBikesChange]);

  /* ---- Render ---- */

  return (
    <div className="space-y-4">
      {/* Add Bike button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="text-xs h-7" onClick={addBike}>
          <Bike className="h-3 w-3 mr-1" />Add Bike
        </Button>
      </div>

      {bikes.map((bike) => {
        const itemCount = bike.services.length + bike.custom_items.length + bike.inventory_items.length;
        return (
          <div key={bike.bike_id} className="rounded-lg border bg-card overflow-hidden">
            {/* ── Card Header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Bike className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{bike.bike_name}</span>
                <span className="text-[10px] text-muted-foreground">({itemCount} items)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={() => setRenameTarget({ bikeId: bike.bike_id, name: bike.bike_name })}
                >
                  <Pencil className="h-3 w-3 mr-1" />Rename
                </Button>
                {bikes.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeBike(bike.bike_id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />Remove
                  </Button>
                )}
              </div>
            </div>

            {/* ── Card Body — Items ── */}
            {itemCount === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                No items added yet. Use the buttons above to add services, custom items, or inventory.
              </div>
            ) : (
              <div>
                {/* Services */}
                {bike.services.map((svc) => (
                  <ServiceRow
                    key={svc.service_id}
                    svc={svc}
                    onRemove={() => removeService(bike.bike_id, svc.service_id)}
                  />
                ))}

                {/* Custom Items */}
                {bike.custom_items.map((item) => (
                  <CustomItemRow
                    key={item.id}
                    item={item}
                    bikeId={bike.bike_id}
                    onRemove={() => removeCustomItem(bike.bike_id, item.id)}
                    onPriceChange={(val) => updateCustomPrice(bike.bike_id, item.id, val)}
                    onQtyChange={(delta) => updateQuantity(bike.bike_id, "custom", item.id, delta)}
                    onTaxChange={(val) => updateTaxable(bike.bike_id, "custom", item.id, val)}
                  />
                ))}

                {/* Inventory Items */}
                {bike.inventory_items.map((item) => (
                  <InventoryItemRow
                    key={item.item_id}
                    item={item}
                    onRemove={() => removeInventoryItem(bike.bike_id, item.item_id)}
                    onQtyChange={(delta) => updateQuantity(bike.bike_id, "inventory", item.item_id, delta)}
                    onTaxChange={(val) => updateTaxable(bike.bike_id, "inventory", item.item_id, val)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Rename Modal */}
      {renameTarget && (
        <EditBikeModal
          open
          onClose={() => setRenameTarget(null)}
          currentName={renameTarget.name}
          onSave={(newName) => {
            renameBike(renameTarget.bikeId, newName);
            setRenameTarget(null);
          }}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/*  Item Row Sub-components                                            */
/* ================================================================== */

function ServiceRow({ svc, onRemove }: { svc: CartService; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <Wrench className="h-3.5 w-3.5 text-blue-500/60 shrink-0" />
        <span className="text-sm truncate">{svc.name}</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-600/50 bg-blue-50 dark:bg-blue-950/30 px-1 rounded">Service</span>
        {svc.taxable && <span className="text-[9px] text-muted-foreground bg-muted px-1 rounded">TAX</span>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-medium tabular-nums">${svc.price.toFixed(2)}</span>
        <button onClick={onRemove} className="text-muted-foreground/30 hover:text-destructive transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function CustomItemRow({
  item, bikeId, onRemove, onPriceChange, onQtyChange, onTaxChange,
}: {
  item: CartCustomItem;
  bikeId: number;
  onRemove: () => void;
  onPriceChange: (val: number) => void;
  onQtyChange: (delta: number) => void;
  onTaxChange: (val: boolean) => void;
}) {
  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 border-b hover:bg-muted/20 transition-colors">
      <FileText className="h-3.5 w-3.5 text-emerald-500/60 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm truncate block">{item.name}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-600/50 bg-emerald-50 dark:bg-emerald-950/30 px-1 rounded">Custom</span>
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={item.taxable}
              onChange={(e) => onTaxChange(e.target.checked)}
              className="h-2.5 w-2.5 rounded accent-primary"
            />
            <span className="text-[9px] text-muted-foreground/40">Tax</span>
          </label>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={item.original_price}
          onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
          className="w-16 h-7 text-xs text-right px-2 tabular-nums"
        />
        <QuantityControl value={item.quantity} onDelta={onQtyChange} />
        <span className="text-sm font-medium w-16 text-right tabular-nums">
          ${(item.price * item.quantity).toFixed(2)}
        </span>
        <button
          onClick={onRemove}
          className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function InventoryItemRow({
  item, onRemove, onQtyChange, onTaxChange,
}: {
  item: CartInventoryItem;
  onRemove: () => void;
  onQtyChange: (delta: number) => void;
  onTaxChange: (val: boolean) => void;
}) {
  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 border-b hover:bg-muted/20 transition-colors">
      <Package className="h-3.5 w-3.5 text-amber-500/60 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm truncate block">{item.item_name}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-600/50 bg-amber-50 dark:bg-amber-950/30 px-1 rounded">Product</span>
          {item.upc_ean && <span className="text-[10px] text-muted-foreground/40 font-mono">{item.upc_ean}</span>}
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={item.taxable}
              onChange={(e) => onTaxChange(e.target.checked)}
              className="h-2.5 w-2.5 rounded accent-primary"
            />
            <span className="text-[9px] text-muted-foreground/40">Tax</span>
          </label>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground tabular-nums">${item.price.toFixed(2)}</span>
        <QuantityControl value={item.quantity} onDelta={onQtyChange} />
        <span className="text-sm font-medium w-16 text-right tabular-nums">
          ${(item.price * item.quantity).toFixed(2)}
        </span>
        <button
          onClick={onRemove}
          className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ---- Shared quantity stepper ---- */

function QuantityControl({ value, onDelta }: { value: number; onDelta: (d: number) => void }) {
  return (
    <div className="flex items-center rounded-lg border bg-muted/15 overflow-hidden">
      <button
        onClick={() => onDelta(-1)}
        className="h-7 w-7 flex items-center justify-center hover:bg-muted transition-colors"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="text-xs font-semibold w-6 text-center tabular-nums border-x">
        {value}
      </span>
      <button
        onClick={() => onDelta(1)}
        className="h-7 w-7 flex items-center justify-center hover:bg-muted transition-colors"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
