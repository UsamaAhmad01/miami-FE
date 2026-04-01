"use client";

interface InvoiceItemsTableProps {
  ticket: Record<string, unknown>;
}

interface ItemRow {
  name: string;
  price: number;
  quantity: number;
  total: number;
  taxable: boolean;
  type: string;
}

export function InvoiceItemsTable({ ticket }: InvoiceItemsTableProps) {
  const multiBike = ticket.enable_multiple_bikes === true;
  const bikes = (ticket.bikes || []) as Array<Record<string, unknown>>;

  if (multiBike && bikes.length > 0) {
    return (
      <div className="space-y-4">
        {bikes.map((bike, bikeIdx) => {
          const items = extractItemsFromBike(bike);
          return (
            <div key={bikeIdx}>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Cart {(bike.bike_id as number) || bikeIdx + 1}: {(bike.bike_name as string) || `Bike ${bikeIdx + 1}`}
              </p>
              <ItemsTable items={items} />
            </div>
          );
        })}
      </div>
    );
  }

  // Single bike mode
  const items = extractItemsFromTicket(ticket);
  return <ItemsTable items={items} />;
}

function ItemsTable({ items }: { items: ItemRow[] }) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground text-center py-4">No items</p>;

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2">Item</th>
          <th className="text-right text-[11px] font-medium text-muted-foreground px-4 py-2">Price</th>
          <th className="text-right text-[11px] font-medium text-muted-foreground px-4 py-2">Qty</th>
          <th className="text-right text-[11px] font-medium text-muted-foreground px-4 py-2">Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={i} className="border-b last:border-0">
            <td className="px-4 py-2 text-sm">
              {item.name}
              {item.taxable && <span className="text-[9px] text-muted-foreground bg-muted px-1 rounded ml-1.5">TAX</span>}
            </td>
            <td className="px-4 py-2 text-sm text-right">${item.price.toFixed(2)}</td>
            <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
            <td className="px-4 py-2 text-sm font-medium text-right">${item.total.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function extractItemsFromTicket(ticket: Record<string, unknown>): ItemRow[] {
  const items: ItemRow[] = [];
  const services = (ticket.services || []) as Array<Record<string, unknown>>;
  const customs = (ticket.custom_services || []) as Array<Record<string, unknown>>;
  const inventory = (ticket.inventory_items || []) as Array<Record<string, unknown>>;

  services.forEach((s) => {
    const price = Number(s.price) || 0;
    const qty = Number(s.quantity) || 1;
    items.push({ name: String(s.name), price, quantity: qty, total: price * qty, taxable: s.taxable !== false, type: "service" });
  });
  customs.forEach((c) => {
    const price = Number(c.price) || 0;
    const qty = Number(c.quantity) || 1;
    items.push({ name: String(c.name), price, quantity: qty, total: price * qty, taxable: !!c.taxable, type: "custom" });
  });
  inventory.forEach((inv) => {
    const price = Number(inv.price) || 0;
    const qty = Number(inv.quantity) || 1;
    items.push({ name: String(inv.item_name || inv.upc_ean), price, quantity: qty, total: price * qty, taxable: inv.taxable !== false, type: "inventory" });
  });
  return items;
}

function extractItemsFromBike(bike: Record<string, unknown>): ItemRow[] {
  return extractItemsFromTicket({
    services: bike.services,
    custom_services: bike.custom_services,
    inventory_items: bike.inventory_items,
  });
}
