"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, RefreshCw, ShoppingCart, Upload, Zap, AlertTriangle, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useViewCart, useDeleteCartItemPost, useUpdateCart, useEmptyCart, useViewBranchUser, usePlaceOrder } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { ImportModal } from "./_components/import-modal";
import { QuickOrderModal } from "./_components/quick-order-modal";
import { ErrorLogModal } from "./_components/error-log-modal";
import { PlaceOrderModal } from "./_components/place-order-modal";
import { toast } from "sonner";

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?.id || 0;
  const { data: cartData, isLoading, refetch } = useViewCart(userId);
  const { data: userInfo } = useViewBranchUser(userId);
  const deleteItem = useDeleteCartItemPost();
  const updateCart = useUpdateCart();
  const emptyCart = useEmptyCart();
  const placeOrder = usePlaceOrder();

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [importOpen, setImportOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [errorLogOpen, setErrorLogOpen] = useState(false);
  const [placeOrderOpen, setPlaceOrderOpen] = useState(false);
  const [placing, setPlacing] = useState(false);

  const cartItems = (cartData?.cart_items || []) as Array<Record<string, unknown>>;
  const subtotal = Number(cartData?.total_cart_price) || 0;
  const grandTotal = Number(cartData?.grand_total_item_price) || 0;
  const serviceCharge = grandTotal - subtotal;

  const getQty = (item: Record<string, unknown>) => {
    const key = String(item.vendor_product_id || item.upc || "");
    return quantities[key] ?? (Number(item.quantity) || 1);
  };

  const handleDelete = async (vpId: string) => {
    try {
      await deleteItem.mutateAsync({ vendorProductId: vpId, userId: String(userId) });
      toast.success("Item removed");
      refetch();
    } catch { toast.error("Failed to remove"); }
  };

  const handleUpdateCart = async () => {
    const items = cartItems.map((item) => ({
      sku: String(item.vendor_product_id || ""),
      quantity: getQty(item),
    }));
    try {
      await updateCart.mutateAsync({ user_id: String(userId), items });
      toast.success("Cart updated");
      refetch();
    } catch { toast.error("Failed to update cart"); }
  };

  const handleEmptyCart = async () => {
    if (!confirm("Empty your entire cart?")) return;
    try {
      await emptyCart.mutateAsync(String(userId));
      toast.success("Cart emptied");
      refetch();
    } catch { toast.error("Failed to empty cart"); }
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) { toast.error("Cart is empty"); return; }
    setPlacing(true);
    try {
      const info = userInfo || {};
      const result = await placeOrder.mutateAsync({
        user_id: String(userId),
        first_name: String(info.first_name || ""),
        last_name: String(info.last_name || ""),
        phone_number: String(info.phone_number || info.phone || ""),
        email: String(info.email || ""),
        address_1: String(info.address_1 || info.address || ""),
        city: String(info.city || ""),
        state: String(info.state || ""),
        zip: String(info.zip || ""),
      });
      await emptyCart.mutateAsync(String(userId));
      toast.success("Order placed!");
      setPlaceOrderOpen(false);
      router.push(`/orders/${result.order_id}/wholesale`);
    } catch { toast.error("Failed to place order"); setPlacing(false); }
  };

  if (isLoading) return <BrandedLoader variant="page" text="Loading cart..." />;

  return (
    <PageShell>
      <PageHeader
        title="Shopping Cart"
        description={`${cartItems.length} item${cartItems.length !== 1 ? "s" : ""} in cart`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Upload className="h-3.5 w-3.5 mr-1.5" />Import CSV</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickOpen(true)}><Zap className="h-3.5 w-3.5 mr-1.5" />Quick Order</Button>
            <Button variant="outline" size="sm" onClick={() => setErrorLogOpen(true)}><AlertTriangle className="h-3.5 w-3.5 mr-1.5" />Errors</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Cart table */}
        <div className="lg:col-span-2">
          {cartItems.length === 0 ? (
            <div className="rounded-lg border bg-card p-12 text-center">
              <ShoppingCart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Your cart is empty</p>
              <Link href="/products?stock=yes"><Button variant="outline" size="sm" className="mt-4">Continue Shopping</Button></Link>
            </div>
          ) : (
            <div className="rounded-lg border bg-card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5 w-14">Image</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">UPC</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Product</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Warehouse</th>
                    <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2.5 w-20">Qty</th>
                    <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2.5">Price</th>
                    <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2.5">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => {
                    const vpId = String(item.vendor_product_id || "");
                    const images = (item.images || []) as string[];
                    const qty = getQty(item);
                    const price = Number(item.base_price) || 0;
                    return (
                      <tr key={vpId} className="border-b last:border-0">
                        <td className="px-3 py-2.5">
                          {images[0] ? <img src={images[0]} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-muted" />}
                        </td>
                        <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{String(item.upc || "")}</td>
                        <td className="px-3 py-2.5">
                          <Link href={`/products/${item.upc}`} className="text-sm font-medium hover:text-primary transition-colors">{String(item.title || "")}</Link>
                        </td>
                        <td className="px-3 py-2.5 text-xs">{String(item.vendor || "")}</td>
                        <td className="px-3 py-2.5">
                          <Input type="number" min={1} value={qty} onChange={(e) => setQuantities((p) => ({ ...p, [vpId]: parseInt(e.target.value) || 1 }))} className="h-8 w-16 text-sm text-center ml-auto" />
                        </td>
                        <td className="px-3 py-2.5 text-sm text-right">${price.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-sm font-medium text-right">${(Number(item.total_item_price) || price * qty).toFixed(2)}</td>
                        <td className="px-3 py-2.5">
                          <button onClick={() => handleDelete(vpId)} className="text-muted-foreground/40 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {cartItems.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={handleUpdateCart} disabled={updateCart.isPending}>
                {updateCart.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}Update Cart
              </Button>
              <Button variant="outline" size="sm" onClick={handleEmptyCart}>Empty Cart</Button>
              <Link href="/products?stock=yes"><Button variant="outline" size="sm"><Package className="h-3.5 w-3.5 mr-1.5" />Continue Shopping</Button></Link>
            </div>
          )}
        </div>

        {/* Right — Order summary */}
        <div>
          <div className="sticky top-16 rounded-lg border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sub-Total</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">MB-Service Charge</span><span>${serviceCharge.toFixed(2)}</span></div>
              <Separator />
              <div className="flex justify-between text-lg font-bold"><span>Grand Total</span><span>${grandTotal.toFixed(2)}</span></div>
            </div>
            {cartItems.length > 0 && (
              <Button className="w-full gradient-primary text-white border-0 shadow-soft" onClick={() => setPlaceOrderOpen(true)}>
                Place Order
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ImportModal open={importOpen} onClose={() => { setImportOpen(false); refetch(); }} />
      <QuickOrderModal open={quickOpen} onClose={() => { setQuickOpen(false); refetch(); }} />
      <ErrorLogModal open={errorLogOpen} onClose={() => setErrorLogOpen(false)} />
      <PlaceOrderModal open={placeOrderOpen} onClose={() => setPlaceOrderOpen(false)} userInfo={userInfo} onConfirm={handlePlaceOrder} loading={placing} />
    </PageShell>
  );
}
