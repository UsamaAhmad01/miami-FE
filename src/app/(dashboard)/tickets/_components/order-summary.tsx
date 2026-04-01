"use client";

import { useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { type BikeCart, type Pricing, calculateTotals } from "../new/_data/ticket-form-types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface OrderSummaryProps {
  bikes: BikeCart[];
  pricing: Pricing;
  /** Whether pricing came from the ticket's saved values or current branch config */
  pricingSource?: "saved" | "current";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OrderSummary({ bikes, pricing, pricingSource }: OrderSummaryProps) {
  const totals = useMemo(() => calculateTotals(bikes, pricing), [bikes, pricing]);

  const itemCount = bikes.reduce(
    (sum, b) => sum + b.services.length + b.custom_items.length + b.inventory_items.length,
    0,
  );

  const hasTaxableItems = totals.taxableTotal > 0;

  return (
    <div className="rounded-lg border bg-card p-5">
      <h3 className="text-sm font-semibold mb-4">Order Summary</h3>

      <div className="space-y-2.5 text-sm">
        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Subtotal
            <span className="text-[10px] ml-1 text-muted-foreground/50">({itemCount} items)</span>
          </span>
          <span className="tabular-nums">${totals.subtotal.toFixed(2)}</span>
        </div>

        {/* Processing fee info */}
        {pricing.service_charge > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground/60 text-xs">
              Incl. processing fee ({pricing.service_charge}%)
            </span>
            <span className="text-muted-foreground/60 text-xs tabular-nums">included</span>
          </div>
        )}

        {/* Tax */}
        <div className="flex justify-between">
          <div>
            <span className="text-muted-foreground">Tax ({pricing.tax}%)</span>
            {hasTaxableItems && (
              <span className="block text-[10px] text-muted-foreground/40 leading-tight">
                on ${totals.taxableTotal.toFixed(2)} taxable
              </span>
            )}
          </div>
          <span className="tabular-nums">${totals.taxAmount.toFixed(2)}</span>
        </div>

        <Separator />

        {/* Final Total */}
        <div className="flex justify-between items-baseline">
          <span className="text-base font-bold">Total</span>
          <span className="text-xl font-bold tabular-nums">${totals.finalTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Pricing source indicator */}
      {pricingSource === "saved" && (
        <p className="text-[10px] text-muted-foreground/40 mt-3 text-center">
          Using pricing rates from ticket creation
        </p>
      )}
    </div>
  );
}
