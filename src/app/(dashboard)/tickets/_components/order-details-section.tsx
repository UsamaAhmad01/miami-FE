"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Mechanic {
  id: number;
  name: string;
}

interface OrderDetailsSectionProps {
  // Required
  deliveryDate: string;
  onDeliveryDateChange: (val: string) => void;

  // Mechanic
  mechanic: string;
  onMechanicChange: (val: string) => void;
  mechanics: Mechanic[];

  // Special order
  specialOrder: boolean;
  onSpecialOrderChange: (val: boolean) => void;

  // Notes
  notes: string;
  onNotesChange: (val: string) => void;

  // Created by (display only)
  createdByName?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OrderDetailsSection({
  deliveryDate,
  onDeliveryDateChange,
  mechanic,
  onMechanicChange,
  mechanics,
  specialOrder,
  onSpecialOrderChange,
  notes,
  onNotesChange,
  createdByName,
}: OrderDetailsSectionProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: Date, Mechanic, Special Order */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Delivery Date *</Label>
          <Input
            type="date"
            value={deliveryDate}
            onChange={(e) => onDeliveryDateChange(e.target.value)}
            className="mt-1 h-9 text-sm"
          />
        </div>

        <div>
          <Label className="text-xs">Mechanic</Label>
          <select
            value={mechanic}
            onChange={(e) => onMechanicChange(e.target.value)}
            className="mt-1 flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
          >
            <option value="">Unassigned</option>
            {mechanics.map((m) => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs">Special Order</Label>
          <div className="mt-2 flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
              <input
                type="radio"
                name="special-order"
                checked={!specialOrder}
                onChange={() => onSpecialOrderChange(false)}
                className="accent-primary"
              />
              No
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
              <input
                type="radio"
                name="special-order"
                checked={specialOrder}
                onChange={() => onSpecialOrderChange(true)}
                className="accent-primary"
              />
              Yes
            </label>
          </div>
        </div>
      </div>

      {/* Created by display */}
      {createdByName && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
          <span className="font-medium text-foreground/70">Created by:</span>{" "}
          {createdByName}
        </div>
      )}

      {/* Notes */}
      <div>
        <Label className="text-xs">Notes</Label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Add notes about this ticket..."
          className="mt-1 flex w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
        />
      </div>
    </div>
  );
}
