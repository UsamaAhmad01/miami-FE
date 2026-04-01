"use client";

import { useState } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddToCart } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

interface VendorProduct {
  id: number;
  vendor: { screen_name: string };
  ad_base_price: number;
  quantity: number;
}

interface VendorTableProps {
  sku: string;
  vendorProducts: VendorProduct[];
  totalStock: number;
}

export function VendorTable({ sku, vendorProducts, totalStock }: VendorTableProps) {
  const { user } = useAuthStore();
  const addToCart = useAddToCart();
  const [quantities, setQuantities] = useState<Record<number, number>>(
    Object.fromEntries(vendorProducts.map((vp) => [vp.id, 1]))
  );
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleAdd = async (vp: VendorProduct) => {
    const qty = quantities[vp.id] || 1;
    if (qty <= 0 || qty > totalStock) {
      toast.error(`Quantity must be between 1 and ${totalStock}`);
      return;
    }
    setLoadingId(vp.id);
    try {
      await addToCart.mutateAsync({
        user_id: String(user?.id || ""),
        items: [{ sku, quantity: qty, distributorId: String(vp.id) }],
      });
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setLoadingId(null);
    }
  };

  if (vendorProducts.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No vendors available</p>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2">Warehouse</th>
          <th className="text-right text-[11px] font-medium text-muted-foreground px-4 py-2">Cost</th>
          <th className="text-right text-[11px] font-medium text-muted-foreground px-4 py-2">Available</th>
          <th className="text-right text-[11px] font-medium text-muted-foreground px-4 py-2 w-48">Action</th>
        </tr>
      </thead>
      <tbody>
        {vendorProducts.map((vp) => (
          <tr key={vp.id} className="border-b last:border-0">
            <td className="px-4 py-2.5 text-sm font-medium">{vp.vendor.screen_name}</td>
            <td className="px-4 py-2.5 text-sm text-right">${vp.ad_base_price.toFixed(2)}</td>
            <td className="px-4 py-2.5 text-sm text-right">{vp.quantity}</td>
            <td className="px-4 py-2.5">
              <div className="flex items-center gap-2 justify-end">
                <Input
                  type="number"
                  min={1}
                  max={totalStock}
                  value={quantities[vp.id] || 1}
                  onChange={(e) => setQuantities((p) => ({ ...p, [vp.id]: parseInt(e.target.value) || 1 }))}
                  className="h-8 w-16 text-sm text-center"
                />
                <Button size="sm" className="h-8 text-xs" onClick={() => handleAdd(vp)} disabled={loadingId === vp.id}>
                  {loadingId === vp.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><ShoppingCart className="h-3 w-3 mr-1" />Add</>}
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
