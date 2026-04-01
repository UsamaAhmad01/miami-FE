"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, Trash2, Wrench, CreditCard, Banknote, Loader2, Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/primitives/status-badge";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/auth-store";
import { useServices, usePricing, useValidateStripe, useCreatePosTicket } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { toast } from "sonner";

type PaymentMethod = "cash" | "card" | "split";
interface CartItem { id: string; name: string; price: number; originalPrice: number; quantity: number; taxable: boolean; type: "inventory" | "custom" | "service"; upc?: string; }

const ALLOWED_ROLES = ["Superadmin", "SiteOwner"];

export default function POSPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const branchId = user?.branch_id || 0;
  const upcRef = useRef<HTMLInputElement>(null);

  const { data: servicesData } = useServices();
  const { data: pricingData } = usePricing(branchId);
  const validateStripe = useValidateStripe();
  const createPos = useCreatePosTicket();

  const services = servicesData || [];
  const pricing = pricingData || { tax: 7, service_charge: 3, shipping: 0 };
  const taxRate = pricing.tax / 100;
  const feeRate = pricing.service_charge / 100;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [cardAmount, setCardAmount] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [upcInput, setUpcInput] = useState("");
  const [servicesModal, setServicesModal] = useState(false);
  const [customModal, setCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [serviceSearch, setServiceSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [stripeChecked, setStripeChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Role + Stripe check on load
  useEffect(() => {
    if (!user) return;
    if (!ALLOWED_ROLES.includes(user.role)) {
      router.push("/access-denied?error=pos_access_denied");
      return;
    }
    validateStripe.mutateAsync({ userId: String(user.id), branchId: String(branchId) })
      .then((r) => { if (!r.valid) router.push("/stripe-setup"); else { setStripeChecked(true); setLoading(false); } })
      .catch(() => { router.push("/stripe-setup"); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading || !stripeChecked) return <BrandedLoader variant="fullscreen" text="Verifying POS access..." />;

  // Cart calculations
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const taxTotal = cart.filter((i) => i.taxable).reduce((s, i) => s + i.price * i.quantity, 0) * taxRate;
  const finalTotal = subtotal + taxTotal;

  const addUpc = async () => {
    if (!upcInput.trim()) return;
    if (cart.find((i) => i.upc === upcInput)) { toast.warning("Already in cart"); setUpcInput(""); return; }
    try {
      const { data } = await api.get(`/inventory/inventory-by-upc/${upcInput}/${branchId}/${user?.id}/`);
      const items = data as Array<{ id: number; description: string; unit_price: number; upc_ean: string; quantity: number }>;
      if (!items.length) { toast.error("Product not found"); return; }
      const item = items[0];
      const price = item.unit_price + item.unit_price * feeRate;
      setCart((prev) => [...prev, { id: `inv-${item.id}`, name: item.description, price, originalPrice: item.unit_price, quantity: 1, taxable: true, type: "inventory", upc: item.upc_ean }]);
      toast.success(`Added: ${item.description}`);
      setUpcInput("");
      upcRef.current?.focus();
    } catch { toast.error("Failed to look up UPC"); }
  };

  const addService = (svc: { id: number; name: string; price: number; taxable: boolean }) => {
    if (cart.find((i) => i.id === `svc-${svc.id}`)) return;
    const price = svc.price + svc.price * feeRate;
    setCart((prev) => [...prev, { id: `svc-${svc.id}`, name: svc.name, price, originalPrice: svc.price, quantity: 1, taxable: svc.taxable, type: "service" }]);
  };

  const addCustomItem = () => {
    const p = parseFloat(customPrice);
    if (!customName.trim() || !p) return;
    const price = p + p * feeRate;
    setCart((prev) => [...prev, { id: `custom-${Date.now()}`, name: customName, price, originalPrice: p, quantity: parseInt(customQty) || 1, taxable: false, type: "custom" }]);
    setCustomName(""); setCustomPrice(""); setCustomQty("1");
    setCustomModal(false);
  };

  const updateQty = (id: string, delta: number) => setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));
  const toggleTaxable = (id: string) => setCart((prev) => prev.map((i) => i.id === id ? { ...i, taxable: !i.taxable } : i));

  const handleSubmit = async () => {
    if (!customerName.trim()) { toast.error("Customer name required"); return; }
    if (!customerPhone.trim()) { toast.error("Phone required"); return; }
    if (!customerEmail.trim()) { toast.error("Email required"); return; }
    if (cart.length === 0) { toast.error("Add items to cart"); return; }
    if (!paymentMethod) { toast.error("Select payment method"); return; }
    if (paymentMethod === "split") {
      const ca = parseFloat(cardAmount) || 0;
      const cs = parseFloat(cashAmount) || 0;
      if (Math.abs(ca + cs - finalTotal) > 0.01) { toast.error("Card + Cash must equal total"); return; }
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("name", customerName);
    formData.append("phone_no", customerPhone);
    formData.append("email", customerEmail);
    formData.append("description", description);
    formData.append("is_pos", "true");
    formData.append("active", "true");
    formData.append("branch", user?.branch_name || "");
    formData.append("user_id", String(user?.id || ""));
    formData.append("total_price", String(subtotal));
    formData.append("notes", notes);
    formData.append("validated_by", user?.first_name || "");
    formData.append("processing_fee_on_creation", String(pricing.service_charge));
    formData.append("tax_on_creation", String(pricing.tax));
    formData.append("payment_method", paymentMethod === "card" ? "credit_card" : paymentMethod);
    if (paymentMethod === "split") {
      formData.append("card_amount", cardAmount);
      formData.append("cash_amount", cashAmount);
    }
    formData.append("inventory_items", JSON.stringify(cart.filter((i) => i.type === "inventory").map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity, taxable: i.taxable, upc_ean: i.upc }))));
    formData.append("custom_services", JSON.stringify(cart.filter((i) => i.type === "custom").map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, taxable: i.taxable }))));
    formData.append("pos_services", JSON.stringify(cart.filter((i) => i.type === "service").map((i) => ({ service_id: parseInt(i.id.replace("svc-", "")), name: i.name, price: i.price, taxable: i.taxable }))));

    try {
      const result = await createPos.mutateAsync(formData);
      toast.success("POS transaction created!");
      router.push(`/pos/invoices/${result.automatic_generated_invoice_number}`);
    } catch (err: unknown) {
      let msg = "Failed to create POS transaction";
      if (err && typeof err === "object" && "response" in err) {
        const r = (err as { response?: { data?: Record<string, unknown> } }).response;
        if (r?.data) {
          if (typeof r.data.detail === "string") msg = r.data.detail;
          else if (typeof r.data.error === "string") msg = r.data.error;
        }
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServices = services.filter((s) => s.name.toLowerCase().includes(serviceSearch.toLowerCase()));
  const addedServiceIds = new Set(cart.filter((i) => i.type === "service").map((i) => i.id));

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-5">
      {/* Left — Items */}
      <div className="flex-1 flex flex-col border-r overflow-hidden">
        {/* Customer */}
        <div className="p-4 border-b bg-muted/10 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Name *" className="h-9 text-sm" />
            <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, ""))} maxLength={20} placeholder="Phone *" className="h-9 text-sm" />
            <Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email *" className="h-9 text-sm" />
          </div>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (e.g., Bike tune-up, Flat tire repair)" className="h-9 text-sm" />
        </div>

        {/* UPC Scan */}
        <div className="flex items-center gap-2 p-4 border-b">
          <Input ref={upcRef} value={upcInput} onChange={(e) => setUpcInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addUpc(); }} placeholder="Scan UPC barcode..." className="h-10 text-sm font-mono flex-1" autoFocus />
          <Button onClick={addUpc} className="h-10">Add</Button>
          <Button variant="outline" onClick={() => setServicesModal(true)} className="h-10"><Wrench className="h-4 w-4 mr-1" />Services</Button>
          <Button variant="outline" onClick={() => setCustomModal(true)} className="h-10"><Plus className="h-4 w-4 mr-1" />Custom</Button>
        </div>

        {/* Cart */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Scan a UPC or add items to get started</div>
          ) : (
            <div className="divide-y">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 capitalize">{item.type}</span>
                      {item.upc && <span className="text-[10px] font-mono text-muted-foreground">{item.upc}</span>}
                      <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
                        <input type="checkbox" checked={item.taxable} onChange={() => toggleTaxable(item.id)} className="h-3 w-3 rounded accent-primary" />TAX
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(item.id, -1)} className="h-7 w-7 rounded border flex items-center justify-center hover:bg-muted"><Minus className="h-3 w-3" /></button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="h-7 w-7 rounded border flex items-center justify-center hover:bg-muted"><Plus className="h-3 w-3" /></button>
                  </div>
                  <span className="text-sm font-medium w-20 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                  <button onClick={() => removeItem(item.id)} className="text-muted-foreground/40 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right — Payment */}
      <div className="w-[380px] flex flex-col bg-card">
        <div className="p-4 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax ({pricing.tax}%)</span><span>${taxTotal.toFixed(2)}</span></div>
            <Separator />
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span>${finalTotal.toFixed(2)}</span></div>
          </div>

          {/* Payment method */}
          <div className="grid grid-cols-3 gap-2">
            {([["cash", "Cash", Banknote], ["card", "Card", CreditCard], ["split", "Split", CreditCard]] as const).map(([val, label, Icon]) => (
              <button key={val} onClick={() => setPaymentMethod(val)} className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-colors ${paymentMethod === val ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/50"}`}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </div>

          {paymentMethod === "split" && (
            <div className="space-y-2">
              <div><Label className="text-xs">Card Amount</Label><Input type="number" step="0.01" value={cardAmount} onChange={(e) => { setCardAmount(e.target.value); setCashAmount((finalTotal - (parseFloat(e.target.value) || 0)).toFixed(2)); }} className="mt-1 h-8 text-sm" /></div>
              <div><Label className="text-xs">Cash Amount</Label><Input type="number" step="0.01" value={cashAmount} onChange={(e) => { setCashAmount(e.target.value); setCardAmount((finalTotal - (parseFloat(e.target.value) || 0)).toFixed(2)); }} className="mt-1 h-8 text-sm" /></div>
            </div>
          )}

          <div><Label className="text-xs">Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" className="mt-1 h-8 text-sm" /></div>
        </div>

        <div className="p-4 border-t space-y-2">
          <Button className="w-full h-11 gradient-primary text-white border-0 shadow-soft" onClick={handleSubmit} disabled={submitting || cart.length === 0}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Create POS — $${finalTotal.toFixed(2)}`}
          </Button>
          {ALLOWED_ROLES.includes(user?.role || "") && (
            <Button variant="outline" className="w-full text-xs" onClick={() => window.open(`/crm/express-dashboard-login/${branchId}/`, "_blank")}>
              <ExternalLink className="h-3 w-3 mr-1" />Manage Stripe
            </Button>
          )}
        </div>
      </div>

      {/* Services Modal */}
      <Dialog open={servicesModal} onOpenChange={setServicesModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="text-base">Select Services</DialogTitle><DialogDescription className="text-xs">Add services to POS</DialogDescription></DialogHeader>
          <Input value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} placeholder="Search..." className="h-9 text-sm" />
          <div className="max-h-64 overflow-y-auto divide-y">
            {filteredServices.map((svc) => {
              const added = addedServiceIds.has(`svc-${svc.id}`);
              return (
                <div key={svc.id} className="flex items-center justify-between px-2 py-2.5">
                  <div><p className="text-sm">{svc.name}</p><p className="text-xs text-muted-foreground">${svc.price.toFixed(2)}</p></div>
                  <Button size="sm" variant={added ? "ghost" : "outline"} className="h-7 text-xs" disabled={added} onClick={() => addService(svc)}>
                    {added ? <><Check className="h-3 w-3 mr-1" />Added</> : "Add"}
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Item Modal */}
      <Dialog open={customModal} onOpenChange={setCustomModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Add Custom Item</DialogTitle><DialogDescription className="text-xs">Add a custom product or service</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name</Label><Input value={customName} onChange={(e) => setCustomName(e.target.value)} className="mt-1 h-9 text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Price</Label><Input type="number" step="0.01" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Qty</Label><Input type="number" min="1" value={customQty} onChange={(e) => setCustomQty(e.target.value)} className="mt-1 h-9 text-sm" /></div>
            </div>
            {parseFloat(customPrice) > 0 && <p className="text-[11px] text-muted-foreground">With {pricing.service_charge}% fee: <span className="font-medium text-foreground">${(parseFloat(customPrice) * (1 + feeRate)).toFixed(2)}</span></p>}
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setCustomModal(false)}>Cancel</Button><Button size="sm" onClick={addCustomItem}>Add</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
