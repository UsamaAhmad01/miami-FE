"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bookmark, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/primitives/status-badge";
import { PageShell } from "@/components/primitives/page-shell";
import { SectionHeader } from "@/components/primitives/section-header";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useProductDetail } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { ImageGallery } from "./_components/image-gallery";
import { VendorTable } from "./_components/vendor-table";
import { WatchlistModal } from "./_components/watchlist-modal";

export default function ProductDetailPage() {
  const params = useParams();
  const upc = params.upc as string;
  const { user } = useAuthStore();
  const { data: product, isLoading } = useProductDetail(upc, user?.id || 0);
  const [watchlistOpen, setWatchlistOpen] = useState(false);

  if (isLoading) return <BrandedLoader variant="page" text="Loading product..." />;
  if (!product) return <PageShell><div className="text-center py-12 text-sm text-muted-foreground">Product not found</div></PageShell>;

  const title = String(product.Title || "");
  const sku = String(product.id || "");
  const brand = String(product.Brand || "");
  const model = String(product.ModelId || "");
  const upcCode = String(product.UPC || "");
  const mpn = String(product.ManPartNumber || "");
  const desc = String(product.Description || "");
  const stock = Number(product.StockCount) || 0;
  const mapPrice = Number(product.MapPrice) || 0;
  const msrp = Number(product.MSRP) || 0;
  const margin = String(product.P_Margin || "0");
  const images = (product.Images || []) as string[];
  const subcategory = product.Subcategory as { Name?: string; category_name?: string } | undefined;
  const vendorProducts = (product.vendor_products || []) as Array<{ id: number; vendor: { screen_name: string }; ad_base_price: number; quantity: number }>;
  const minPrice = vendorProducts.length > 0 ? Math.min(...vendorProducts.map((v) => v.ad_base_price)) : 0;

  // Parse specifications
  let specs: Array<{ Name: string; Value: string }> = [];
  try {
    const raw = String(product.Specification || "[]").replace(/NaN/g, '"N/A"');
    specs = JSON.parse(raw);
  } catch { /* ignore */ }

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
          {subcategory?.category_name && <><ChevronRight className="h-3 w-3" /><span>{subcategory.category_name}</span></>}
          {subcategory?.Name && <><ChevronRight className="h-3 w-3" /><span>{subcategory.Name}</span></>}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{title}</span>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWatchlistOpen(true)}>
            <Bookmark className="h-3.5 w-3.5 mr-1.5" />Watch List
          </Button>
          <Link href="/products"><Button variant="ghost" size="sm"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Back</Button></Link>
        </div>
      </div>

      {/* Main content: Image + Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Images */}
        <ImageGallery images={images} />

        {/* Right — Info + Pricing */}
        <div className="space-y-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={stock > 0 ? "success" : "error"}>
                {stock > 0 ? `Available (${stock})` : "Unavailable"}
              </StatusBadge>
              {brand && <span className="text-xs text-muted-foreground bg-muted rounded px-2 py-0.5">{brand}</span>}
            </div>
          </div>

          {/* Product details */}
          <div className="grid grid-cols-2 gap-3">
            <DetailItem label="SKU" value={sku} mono />
            <DetailItem label="UPC" value={upcCode} mono />
            <DetailItem label="Model" value={model} />
            <DetailItem label="MPN" value={mpn} />
            {subcategory && (
              <DetailItem label="Category" value={`${subcategory.category_name || ""} > ${subcategory.Name || ""}`} />
            )}
          </div>

          <Separator />

          {/* Pricing */}
          <div>
            <SectionHeader title="Pricing" className="mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <PriceBlock label="MAP Price" value={mapPrice} />
              <PriceBlock label="MSRP" value={msrp} highlight />
              <PriceBlock label="Min Price" value={minPrice} />
              <div className="rounded-md border p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Margin</p>
                <p className="text-sm font-semibold">{margin}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      {specs.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b"><SectionHeader title="Specifications" /></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {specs.map((spec, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-2.5 text-xs font-medium text-muted-foreground w-1/3">{spec.Name}</td>
                    <td className="px-4 py-2.5 text-sm">{spec.Value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vendor / Warehouse Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b"><SectionHeader title="Warehouse Stock" /></div>
        <VendorTable sku={sku} vendorProducts={vendorProducts} totalStock={stock} />
      </div>

      {/* Description */}
      {desc && (
        <div className="rounded-lg border bg-card p-5">
          <SectionHeader title="Description" className="mb-3" />
          <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: desc }} />
        </div>
      )}

      {/* Watchlist Modal */}
      <WatchlistModal open={watchlistOpen} onClose={() => setWatchlistOpen(false)} upc={upcCode} />
    </PageShell>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-sm mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</p>
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
