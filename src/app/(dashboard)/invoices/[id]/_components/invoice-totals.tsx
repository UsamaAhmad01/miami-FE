"use client";

import { Separator } from "@/components/ui/separator";

interface InvoiceTotalsProps {
  ticket: Record<string, unknown>;
  taxRate: number;
}

export function InvoiceTotals({ ticket, taxRate }: InvoiceTotalsProps) {
  const totalPrice = Number(ticket.total_price) || 0;

  // Calculate tax from items
  const allItems = getAllItems(ticket);
  const taxableTotal = allItems.filter((i) => i.taxable).reduce((sum, i) => sum + i.price * i.qty, 0);
  const tax = taxableTotal * (taxRate / 100);
  const subtotal = totalPrice - tax;

  const discountPct = Number(ticket.discount_percentage) || 0;
  const discountAmt = Number(ticket.discount_amount) || 0;
  const discount = discountPct > 0 ? subtotal * discountPct / 100 : discountAmt;

  const credit = Number(ticket.credited_amount) || 0;
  const total = subtotal + tax - discount - credit;

  return (
    <div className="space-y-2 text-sm max-w-xs ml-auto">
      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Tax ({taxRate}%)</span><span>${tax.toFixed(2)}</span></div>
      {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-${discount.toFixed(2)}</span></div>}
      {credit > 0 && <div className="flex justify-between text-emerald-600"><span>Credit Applied</span><span>-${credit.toFixed(2)}</span></div>}
      <Separator />
      <div className="flex justify-between text-lg font-bold"><span>Total</span><span>${total.toFixed(2)}</span></div>
    </div>
  );
}

function getAllItems(ticket: Record<string, unknown>) {
  const items: { price: number; qty: number; taxable: boolean }[] = [];
  const multiBike = ticket.enable_multiple_bikes === true;

  if (multiBike) {
    const bikes = (ticket.bikes || []) as Array<Record<string, unknown>>;
    bikes.forEach((bike) => pushItems(bike, items));
  } else {
    pushItems(ticket, items);
  }
  return items;
}

function pushItems(source: Record<string, unknown>, items: { price: number; qty: number; taxable: boolean }[]) {
  ((source.services || []) as Array<Record<string, unknown>>).forEach((s) => items.push({ price: Number(s.price) || 0, qty: Number(s.quantity) || 1, taxable: s.taxable !== false }));
  ((source.custom_services || []) as Array<Record<string, unknown>>).forEach((c) => items.push({ price: Number(c.price) || 0, qty: Number(c.quantity) || 1, taxable: !!c.taxable }));
  ((source.inventory_items || []) as Array<Record<string, unknown>>).forEach((inv) => items.push({ price: Number(inv.price) || 0, qty: Number(inv.quantity) || 1, taxable: inv.taxable !== false }));
}
