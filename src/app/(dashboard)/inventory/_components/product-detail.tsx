"use client";

import { Package, DollarSign, Barcode, Tag, Truck, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/primitives/status-badge";
import { type Product, getStockStatus } from "../_data/mock-products";

interface ProductDetailProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductDetail({ product, onClose }: ProductDetailProps) {
  return (
    <Sheet open={!!product} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        {product && <ProductDetailContent product={product} />}
      </SheetContent>
    </Sheet>
  );
}

function ProductDetailContent({ product }: { product: Product }) {
  const stock = getStockStatus(product.stock_count);
  const margin = ((product.msrp - product.base_price) / product.msrp * 100).toFixed(1);

  return (
    <>
      <SheetHeader className="p-5 pb-0">
        <div className="flex items-center gap-2">
          <SheetTitle className="text-lg">{product.title}</SheetTitle>
        </div>
        <SheetDescription className="sr-only">Product detail for {product.title}</SheetDescription>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
          <StatusBadge status={stock.color}>{stock.label}</StatusBadge>
          {product.shopify_synced && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[var(--success)]">
              <ExternalLink className="h-2.5 w-2.5" />Shopify
            </span>
          )}
        </div>
      </SheetHeader>

      <div className="flex gap-2 px-5 py-3">
        <Button size="sm" variant="default" className="text-xs h-7">Edit Product</Button>
        <Button size="sm" variant="outline" className="text-xs h-7">Sync to Shopify</Button>
      </div>

      <Separator />

      <div className="p-5 space-y-4">
        {/* Info */}
        <div className="grid grid-cols-2 gap-3">
          <InfoBlock icon={Tag} label="Brand" value={product.brand} />
          <InfoBlock icon={Package} label="Category" value={`${product.category} → ${product.subcategory}`} />
          <InfoBlock icon={Barcode} label="UPC" value={product.upc} />
          <InfoBlock icon={Package} label="Stock" value={`${product.stock_count} units`} />
        </div>

        <Separator />

        {/* Pricing */}
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Pricing</p>
          <div className="grid grid-cols-3 gap-3">
            <PriceBlock label="Cost" value={product.base_price} />
            <PriceBlock label="MAP" value={product.map_price} />
            <PriceBlock label="MSRP" value={product.msrp} highlight />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Margin: <span className="font-medium text-foreground">{margin}%</span></p>
        </div>

        <Separator />

        {/* Vendor Products */}
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Vendor Stock</p>
          <div className="space-y-2">
            {product.vendor_products.map((vp, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{vp.vendor}</p>
                    <p className="text-xs text-muted-foreground">Cost: ${vp.base_price.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{vp.quantity}</p>
                  <p className="text-[10px] text-muted-foreground">units</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <>
            <Separator />
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function InfoBlock({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function PriceBlock({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-md border p-2.5 text-center ${highlight ? "bg-primary/5 border-primary/20" : ""}`}>
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? "text-primary" : ""}`}>${value.toFixed(2)}</p>
    </div>
  );
}
