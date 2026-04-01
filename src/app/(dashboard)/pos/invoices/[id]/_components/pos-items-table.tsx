"use client";

import { Check } from "lucide-react";

interface PosItemsTableProps {
  invoice: Record<string, unknown>;
}

interface ItemRow {
  name: string;
  type: string;
  taxable: boolean;
  cost: number;
  qty: number;
  total: number;
}

export function PosItemsTable({ invoice }: PosItemsTableProps) {
  const items: ItemRow[] = [];

  // POS Services
  const posServices = (invoice.pos_services || []) as Array<Record<string, unknown>>;
  posServices.forEach((s) => {
    const service = s.service as Record<string, unknown> | undefined;
    items.push({
      name: String(service?.name || s.name || "Service"),
      type: "POS Service",
      taxable: s.taxable === true,
      cost: Number(service?.price || s.price || 0),
      qty: 1,
      total: Number(service?.price || s.price || 0),
    });
  });

  // Custom Services
  const customServices = (invoice.custom_services || []) as Array<Record<string, unknown>>;
  customServices.forEach((c) => {
    const price = Number(c.price) || 0;
    const qty = Number(c.quantity) || 1;
    items.push({
      name: String(c.name),
      type: "Custom Service",
      taxable: c.taxable === true,
      cost: price,
      qty,
      total: Number(c.total_price) || price * qty,
    });
  });

  // Inventory Items
  const inventoryItems = (invoice.inventory_items || []) as Array<Record<string, unknown>>;
  inventoryItems.forEach((inv) => {
    const price = Number(inv.price) || 0;
    const qty = Number(inv.quantity) || 1;
    items.push({
      name: `${String(inv.name || inv.item_name)} ${inv.upc_ean ? `(${inv.upc_ean})` : ""}`,
      type: "Inventory Item",
      taxable: inv.taxable === true,
      cost: price,
      qty,
      total: Number(inv.total_price) || price * qty,
    });
  });

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">No items on this invoice</p>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2 w-8">#</th>
          <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2">Item</th>
          <th className="text-center text-[11px] font-medium text-muted-foreground px-4 py-2 w-16">Taxable</th>
          <th className="text-right text-[11px] font-medium text-muted-foreground px-4 py-2">Cost</th>
          <th className="text-right text-[11px] font-medium text-muted-foreground px-4 py-2">Qty</th>
          <th className="text-right text-[11px] font-medium text-muted-foreground px-4 py-2">Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={i} className="border-b last:border-0">
            <td className="px-4 py-2.5 text-xs text-muted-foreground">{i + 1}</td>
            <td className="px-4 py-2.5">
              <p className="text-sm">{item.name}</p>
              <p className="text-[10px] text-muted-foreground">{item.type}</p>
            </td>
            <td className="px-4 py-2.5 text-center">
              {item.taxable && <Check className="h-3.5 w-3.5 text-emerald-500 mx-auto" />}
            </td>
            <td className="px-4 py-2.5 text-sm text-right">${item.cost.toFixed(2)}</td>
            <td className="px-4 py-2.5 text-sm text-right">{item.qty}</td>
            <td className="px-4 py-2.5 text-sm font-medium text-right">${item.total.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
