"use client";

import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/primitives/status-badge";

interface ProductRow {
  id?: string;
  Sku?: string;
  UPC?: string;
  Title?: string;
  MSRP?: number;
  tmb_price?: number;
  P_Margin?: number;
  StockCount?: number;
  Images?: string[];
  vendor_products?: Array<{ screen_name?: string }>;
  [key: string]: unknown;
}

interface ProductsDataTableProps {
  data: ProductRow[];
  selectedRows: Set<string>;
  onToggleRow: (sku: string) => void;
  onToggleAll: () => void;
  loading?: boolean;
}

export function ProductsDataTable({ data, selectedRows, onToggleRow, onToggleAll, loading }: ProductsDataTableProps) {
  const router = useRouter();
  const allSelected = data.length > 0 && data.every((p) => selectedRows.has(p.id || p.Sku || ""));

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="w-10 px-3 py-2.5" data-no-nav>
              <input type="checkbox" checked={allSelected} onChange={onToggleAll} className="h-3.5 w-3.5 rounded accent-primary" />
            </th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5 w-16">Image</th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">UPC</th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">SKU</th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Title</th>
            <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2.5">MSRP</th>
            <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2.5">Min Price</th>
            <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2.5">Margin</th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Qty</th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Warehouse</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const sku = row.id || row.Sku || "";
            const isSelected = selectedRows.has(sku);
            const stock = Number(row.StockCount) || 0;
            const vendors = (row.vendor_products || []).map((v) => v.screen_name).filter(Boolean).join(", ");
            const img = row.Images?.[0];

            return (
              <tr
                key={sku}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("[data-no-nav]")) return;
                  router.push(`/products/${row.UPC || sku}`);
                }}
                className={`border-b last:border-0 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/30"}`}
              >
                <td className="px-3 py-2.5" data-no-nav>
                  <input type="checkbox" checked={isSelected} onChange={() => onToggleRow(sku)} className="h-3.5 w-3.5 rounded accent-primary" />
                </td>
                <td className="px-3 py-2.5">
                  {img ? (
                    <img src={img} alt="" className="h-10 w-10 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/image-coming-soon.jpeg"; }} />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-[9px] text-muted-foreground">No img</div>
                  )}
                </td>
                <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{row.UPC || "—"}</td>
                <td className="px-3 py-2.5 text-xs font-mono">{sku}</td>
                <td className="px-3 py-2.5 text-sm font-medium">{row.Title || "—"}</td>
                <td className="px-3 py-2.5 text-sm text-right">{row.MSRP ? `$${Number(row.MSRP).toFixed(2)}` : "—"}</td>
                <td className="px-3 py-2.5 text-sm text-right">{row.tmb_price ? `$${Number(row.tmb_price).toFixed(2)}` : "—"}</td>
                <td className="px-3 py-2.5 text-sm text-right">{row.P_Margin !== undefined ? `${Number(row.P_Margin).toFixed(1)}%` : "—"}</td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={stock > 0 ? "success" : "error"} dot>
                    {stock > 0 ? `In stock (${stock})` : "Out of stock"}
                  </StatusBadge>
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[150px] truncate">{vendors || "—"}</td>
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr><td colSpan={10} className="px-3 py-12 text-center text-sm text-muted-foreground">No products found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
