"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useCartItems, useViewBranchUser, useSaveBranchUser, usePlaceOrder, useEmptyCart } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?.id || 0;
  const { data: cartData } = useCartItems(userId);
  const { data: userInfo, isLoading: userLoading } = useViewBranchUser(userId);
  const saveBranchUser = useSaveBranchUser();
  const placeOrderMutation = usePlaceOrder();
  const emptyCartMutation = useEmptyCart();

  const [form, setForm] = useState({
    first_name: "", last_name: "", phone_number: "", email: "",
    address_1: "", address_2: "", city: "", state: "", zip: "", notes: "",
  });
  const [initialized, setInitialized] = useState(false);

  // Pre-fill from user info
  useEffect(() => {
    if (userInfo && !initialized) {
      setForm({
        first_name: String(userInfo.first_name || ""),
        last_name: String(userInfo.last_name || ""),
        phone_number: String(userInfo.phone_number || userInfo.phone || ""),
        email: String(userInfo.email || ""),
        address_1: String(userInfo.address_1 || userInfo.address || ""),
        address_2: String(userInfo.address_2 || ""),
        city: String(userInfo.city || ""),
        state: String(userInfo.state || ""),
        zip: String(userInfo.zip || ""),
        notes: "",
      });
      setInitialized(true);
    }
  }, [userInfo, initialized]);

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const cartItems = (cartData?.cart_items || []) as Array<Record<string, unknown>>;
  const grandTotal = cartData?.grand_total_item_price || 0;
  const subtotal = cartData?.total_cart_price || 0;
  const serviceChargeAmount = grandTotal - subtotal;

  const handleSaveInfo = async () => {
    try {
      await saveBranchUser.mutateAsync({ user_id: String(userId), ...form });
      toast.success("Information saved");
    } catch { toast.error("Failed to save"); }
  };

  const handlePlaceOrder = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.phone_number || !form.address_1 || !form.city || !form.state || !form.zip) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      const result = await placeOrderMutation.mutateAsync({
        user_id: String(userId),
        ...form,
        delivery_note: form.notes,
      });
      await emptyCartMutation.mutateAsync(String(userId));
      toast.success("Order placed!");
      router.push(`/orders/${result.order_id}/wholesale`);
    } catch { toast.error("Failed to place order"); }
  };

  if (userLoading) return <BrandedLoader variant="page" text="Loading checkout..." />;

  return (
    <PageShell>
      <PageHeader title="Checkout" actions={<Link href="/cart"><Button variant="outline" size="sm"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Return to Cart</Button></Link>} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">First Name *</Label><Input value={form.first_name} onChange={(e) => update("first_name", e.target.value)} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Last Name *</Label><Input value={form.last_name} onChange={(e) => update("last_name", e.target.value)} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Phone *</Label><Input value={form.phone_number} onChange={(e) => update("phone_number", e.target.value)} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Email *</Label><Input value={form.email} onChange={(e) => update("email", e.target.value)} className="mt-1 h-9 text-sm" /></div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold">Shipping Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><Label className="text-xs">Address 1 *</Label><Input value={form.address_1} onChange={(e) => update("address_1", e.target.value)} className="mt-1 h-9 text-sm" /></div>
              <div className="sm:col-span-2"><Label className="text-xs">Address 2</Label><Input value={form.address_2} onChange={(e) => update("address_2", e.target.value)} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">City *</Label><Input value={form.city} onChange={(e) => update("city", e.target.value)} className="mt-1 h-9 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">State *</Label><Input value={form.state} onChange={(e) => update("state", e.target.value)} className="mt-1 h-9 text-sm" /></div>
                <div><Label className="text-xs">ZIP *</Label><Input value={form.zip} onChange={(e) => update("zip", e.target.value)} className="mt-1 h-9 text-sm" /></div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <Label className="text-xs">Order Notes (optional)</Label>
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} placeholder="Special delivery instructions..." className="mt-1 flex w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveInfo} disabled={saveBranchUser.isPending}>
              {saveBranchUser.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}Save this information
            </Button>
          </div>
        </div>

        {/* Right — Order summary */}
        <div>
          <div className="sticky top-16 rounded-lg border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold">Order Summary</h3>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {cartItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {Array.isArray(item.images) && item.images[0] ? <img src={String(item.images[0])} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-muted" />}
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground px-1">{String(item.quantity || 1)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{String(item.title || "")}</p>
                  </div>
                  <span className="text-xs font-medium">${Number(item.total_item_price || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sub-Total</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">MB-Service Charge</span><span>${serviceChargeAmount.toFixed(2)}</span></div>
              <Separator />
              <div className="flex justify-between text-base font-bold"><span>Grand Total</span><span>${grandTotal.toFixed(2)}</span></div>
            </div>
            <Button className="w-full gradient-primary text-white border-0 shadow-soft" onClick={handlePlaceOrder} disabled={placeOrderMutation.isPending}>
              {placeOrderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete Order"}
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
