"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronDown, ChevronRight, Plus, Minus, Trash2, Wrench, Package, FileText,
  Loader2, ArrowLeft, ToggleLeft, ToggleRight, Zap, ScanBarcode,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { useAuthStore } from "@/stores/auth-store";
import { useServices, useMechanics, useInventoryItems, usePricing, useTicketByInvoiceNumber, useUpdateTicket, usePaymentHistory, useValidateStripe, useEnableTerminalPayment } from "@/hooks/use-api";
import { toast } from "sonner";
import { ServicesModal } from "../../new/_components/services-modal";
import { CustomItemModal } from "../../new/_components/custom-item-modal";
import { InventoryModal } from "../../new/_components/inventory-modal";
import { ScanInventoryModal } from "../../new/_components/scan-inventory-modal";
import {
  type BikeCart, type CartService, type CartCustomItem, type CartInventoryItem,
  type PaymentMethod, applyProcessingFee,
} from "../../new/_data/ticket-form-types";
import { TicketStatusBadges } from "../../_shared/status-badges";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { BikeCardsDisplay } from "../../_components/bike-cards-display";
import { OrderSummary } from "../../_components/order-summary";
import { PaymentDetailsSection } from "../../_components/payment-details-section";
import { OrderDetailsSection } from "../../_components/order-details-section";

export default function EditTicketPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  const { user } = useAuthStore();
  const branchId = user?.branch_id || 0;

  // Fetch ticket data from API
  const { data: ticketData, isLoading: ticketLoading } = useTicketByInvoiceNumber(ticketId);
  const { data: servicesData } = useServices();
  const { data: mechanicsData } = useMechanics();
  const { data: inventoryData } = useInventoryItems(branchId);
  const { data: pricingData } = usePricing(branchId);
  const { data: paymentRecords } = usePaymentHistory(ticketId);

  const services = servicesData || [];
  const mechanics = mechanicsData || [];
  const inventory = (inventoryData || []).filter((i: { quantity?: number }) => (i.quantity || 0) > 0);

  // Use saved pricing from ticket if available, fallback to branch pricing
  const pricing = {
    tax: ticketData?.tax_on_creation ?? pricingData?.tax ?? 7.0,
    service_charge: ticketData?.processing_fee_on_creation ?? pricingData?.service_charge ?? 3.0,
    shipping: 0,
  };

  const pricingSource: "saved" | "current" =
    ticketData?.tax_on_creation != null && ticketData?.processing_fee_on_creation != null
      ? "saved"
      : "current";

  const hasExistingPayments = (paymentRecords?.payments || []).length > 0;
  const ticketDbId = ticketData?.id || 0;

  const updateTicketMutation = useUpdateTicket(ticketDbId);
  const validateStripeMutation = useValidateStripe();
  const enableTerminalMutation = useEnableTerminalPayment();

  // Form state — pre-filled from API data
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [mechanic, setMechanic] = useState("");
  const [specialOrder, setSpecialOrder] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [validatedBy, setValidatedBy] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [ticketStatus, setTicketStatus] = useState("");
  const [paymentStatusState, setPaymentStatusState] = useState("");
  const [multiBike, setMultiBike] = useState(false);
  const [bikes, setBikes] = useState<BikeCart[]>([{ bike_id: 1, bike_name: "Bike 1", services: [], custom_items: [], inventory_items: [] }]);
  const [initialized, setInitialized] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);

  // Populate form when ticket data loads
  if (ticketData && !initialized) {
    // Form fields
    setName(String(ticketData.name || ""));
    setPhone(String(ticketData.phone_no || ""));
    setAddress(String(ticketData.address || ""));
    setEmail(String(ticketData.email || ""));
    setDescription(String(ticketData.description || ""));
    setDeliveryDate(String(ticketData.delivery_date || ""));
    setMechanic(String(ticketData.mechanic || ""));
    setSpecialOrder(ticketData.special_order === "Yes");
    setNotes(String(ticketData.notes || ""));
    setPaymentMethod((ticketData.payment_option || "") as PaymentMethod);
    setValidatedBy(String(ticketData.validated_by || ""));
    setDepositAmount(String(ticketData.credited_amount || ""));
    setDiscountCode(String(ticketData.discount_code || ""));
    setTicketStatus(String(ticketData.status || "Pending"));
    setPaymentStatusState(String(ticketData.payment_status || "Unpaid"));
    setMultiBike(ticketData.enable_multiple_bikes === true);

    // Helper to safely parse numbers from API (which may return strings)
    const num = (v: unknown): number => Number(v) || 0;

    // Load existing cart items — bikes_data is the correct API field (NOT bikes)
    const bikesArray = ticketData.bikes_data?.bikes as Array<Record<string, unknown>> | undefined;

    if (bikesArray && bikesArray.length > 0 && ticketData.enable_multiple_bikes) {
      // Multi-bike mode
      setBikes(bikesArray.map((b, i) => ({
        bike_id: num(b.bike_id) || i + 1,
        bike_name: String(b.bike_name || `Bike ${i + 1}`),
        services: ((b.services as Array<Record<string, unknown>>) || []).map((s) => ({
          service_id: num(s.id || s.service_id),
          name: String(s.name || ""),
          price: num(s.total_price || s.price),
          original_price: num(s.price),
          taxable: (s.taxable as boolean) ?? true,
        })),
        custom_items: ((b.custom_services as Array<Record<string, unknown>>) || []).map((c, ci) => ({
          id: `custom-${ci}`,
          name: String(c.name || ""),
          price: num(c.price),
          original_price: num(c.price),
          quantity: num(c.quantity) || 1,
          taxable: (c.taxable as boolean) ?? false,
        })),
        inventory_items: ((b.inventory_items as Array<Record<string, unknown>>) || []).map((inv) => ({
          item_id: String(inv.item_id || ""),
          item_name: String(inv.item_name || inv.name || ""),
          upc_ean: String(inv.upc_ean || ""),
          price: num(inv.price),
          original_price: num(inv.price),
          quantity: num(inv.quantity) || 1,
          taxable: (inv.taxable as boolean) ?? true,
        })),
      })));
    } else {
      // Single bike mode — load from flat arrays
      const svcList = (ticketData.services || []) as Array<Record<string, unknown>>;
      const customList = (ticketData.custom_services || []) as Array<Record<string, unknown>>;
      const invList = (ticketData.inventory_items || []) as Array<Record<string, unknown>>;

      const singleBike: BikeCart = {
        bike_id: 1,
        bike_name: "Bike 1",
        services: svcList.map((s) => ({
          service_id: num(s.id),
          name: String(s.name || ""),
          price: num(s.total_price || s.price),
          original_price: num(s.price),
          taxable: (s.taxable as boolean) ?? true,
        })),
        custom_items: customList.map((c, ci) => ({
          id: `custom-${ci}`,
          name: String(c.name || ""),
          price: num(c.price),
          original_price: num(c.price),
          quantity: num(c.quantity) || 1,
          taxable: (c.taxable as boolean) ?? false,
        })),
        inventory_items: invList.map((inv) => ({
          item_id: String(inv.item_id || ""),
          item_name: String(inv.item_name || inv.name || ""),
          upc_ean: String(inv.upc_ean || ""),
          price: num(inv.price),
          original_price: num(inv.price),
          quantity: num(inv.quantity) || 1,
          taxable: (inv.taxable as boolean) ?? true,
        })),
      };
      setBikes([singleBike]);
    }

    if (ticketData.terminal_payment_enabled) setStripeEnabled(true);
    setInitialized(true);
  }

  // Modals
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);

  // Sections
  const [sections, setSections] = useState({ customer: true, order: true, payment: true });
  const toggleSection = (key: keyof typeof sections) => setSections((p) => ({ ...p, [key]: !p[key] }));

  const [submitting, setSubmitting] = useState(false);
  const activeBikeIdx = 0;

  const addedServiceIds = useMemo(() => new Set(bikes[activeBikeIdx]?.services.map((s) => s.service_id) || []), [bikes, activeBikeIdx]);
  const addedInventoryIds = useMemo(() => new Set(bikes[activeBikeIdx]?.inventory_items.map((i) => i.item_id) || []), [bikes, activeBikeIdx]);
  const totalItemCount = bikes.reduce((sum, b) => sum + b.services.length + b.custom_items.length + b.inventory_items.length, 0);

  // Track unsaved changes — any cart or form modification sets dirty
  const updateBikes = (updater: (prev: BikeCart[]) => BikeCart[]) => {
    setBikes(updater);
    if (initialized) setDirty(true);
  };

  // Cart actions (same as create)
  if (ticketLoading) return <BrandedLoader variant="page" text="Loading ticket..." />;

  const addService = (svc: { id: number; name: string; price: number; taxable: boolean }) => {
    const price = applyProcessingFee(svc.price, pricing.service_charge);
    updateBikes((prev) => prev.map((b, i) => i === activeBikeIdx ? { ...b, services: [...b.services, { service_id: svc.id, name: svc.name, price, original_price: svc.price, taxable: svc.taxable }] } : b));
  };
  const addCustomItem = (item: { name: string; price: number; quantity: number; taxable: boolean }) => {
    const price = applyProcessingFee(item.price, pricing.service_charge);
    updateBikes((prev) => prev.map((b, i) => i === activeBikeIdx ? { ...b, custom_items: [...b.custom_items, { id: `custom-${Date.now()}`, name: item.name, price, original_price: item.price, quantity: item.quantity, taxable: item.taxable }] } : b));
  };
  const addInventoryItem = (item: { id: string; description: string; upc_ean: string; unit_price: number }) => {
    const price = applyProcessingFee(item.unit_price, pricing.service_charge);
    updateBikes((prev) => prev.map((b, i) => i === activeBikeIdx ? { ...b, inventory_items: [...b.inventory_items, { item_id: item.id, item_name: item.description, upc_ean: item.upc_ean, price, original_price: item.unit_price, quantity: 1, taxable: true }] } : b));
  };
  const removeService = (bikeIdx: number, serviceId: number) => updateBikes((prev) => prev.map((b, i) => i === bikeIdx ? { ...b, services: b.services.filter((s) => s.service_id !== serviceId) } : b));
  const removeCustomItem = (bikeIdx: number, itemId: string) => updateBikes((prev) => prev.map((b, i) => i === bikeIdx ? { ...b, custom_items: b.custom_items.filter((c) => c.id !== itemId) } : b));
  const removeInventoryItem = (bikeIdx: number, itemId: string) => updateBikes((prev) => prev.map((b, i) => i === bikeIdx ? { ...b, inventory_items: b.inventory_items.filter((inv) => inv.item_id !== itemId) } : b));

  // Quantity update — auto-remove at 0, stock validation for inventory
  const updateQty = (bikeIdx: number, type: "custom" | "inventory", itemId: string, delta: number) => {
    updateBikes((prev) => prev.map((b, i) => {
      if (i !== bikeIdx) return b;
      if (type === "custom") {
        const updated = b.custom_items.map((c) => c.id === itemId ? { ...c, quantity: c.quantity + delta } : c).filter((c) => c.quantity > 0);
        return { ...b, custom_items: updated };
      }
      const item = b.inventory_items.find((inv) => inv.item_id === itemId);
      if (!item) return b;
      const newQty = item.quantity + delta;
      if (newQty < 1) return { ...b, inventory_items: b.inventory_items.filter((inv) => inv.item_id !== itemId) };
      // For increases: validate against current available stock
      if (delta > 0) {
        const catalogItem = inventory.find((inv: { id: string; quantity?: number }) => inv.id === itemId);
        const available = catalogItem?.quantity || 0;
        const totalUsed = bikes.reduce((sum, bk) => sum + (bk.inventory_items.find((inv) => inv.item_id === itemId)?.quantity || 0), 0);
        if (totalUsed - item.quantity + newQty > available) {
          toast.error(`Max stock: ${available}. Currently used: ${totalUsed - item.quantity}`);
          return b;
        }
      }
      return { ...b, inventory_items: b.inventory_items.map((inv) => inv.item_id === itemId ? { ...inv, quantity: newQty } : inv) };
    }));
  };

  // Price update for custom items
  const updatePrice = (bikeIdx: number, itemId: string, val: number) => {
    if (isNaN(val) || val < 0) return;
    const priceWithFee = applyProcessingFee(val, pricing.service_charge);
    updateBikes((prev) => prev.map((b, i) => i !== bikeIdx ? b : {
      ...b, custom_items: b.custom_items.map((c) => c.id === itemId ? { ...c, price: priceWithFee, original_price: val } : c),
    }));
  };

  // Taxable toggle for custom and inventory items
  const updateTax = (bikeIdx: number, type: "custom" | "inventory", itemId: string, taxable: boolean) => {
    updateBikes((prev) => prev.map((b, i) => {
      if (i !== bikeIdx) return b;
      if (type === "custom") return { ...b, custom_items: b.custom_items.map((c) => c.id === itemId ? { ...c, taxable } : c) };
      return { ...b, inventory_items: b.inventory_items.map((inv) => inv.item_id === itemId ? { ...inv, taxable } : inv) };
    }));
  };

  const handleSubmit = async () => {
    // ── Validation ──
    const errs: string[] = [];
    if (!name.trim()) errs.push("Customer name is required");
    if (!phone.trim()) errs.push("Phone is required");
    if (!description.trim()) errs.push("Description is required");
    if (!deliveryDate) errs.push("Delivery date is required");
    if (totalItemCount === 0) errs.push("Add at least one item");
    if (!hasExistingPayments && !paymentMethod) errs.push("Please select a payment method");
    if (errs.length > 0) { errs.forEach((e) => toast.error(e)); return; }

    setSubmitting(true);
    try {
      // ── Build FormData ──
      const formData = new FormData();

      // Customer
      formData.append("name", name);
      formData.append("phone_no", phone);
      formData.append("address", address);
      formData.append("email", email);
      formData.append("description", description);

      // Order details
      formData.append("delivery_date", deliveryDate);
      formData.append("mechanic_name", mechanic);
      formData.append("special_order", specialOrder ? "Yes" : "No");
      formData.append("notes", notes);

      // Payment — only send payment_option when no existing payments
      if (!hasExistingPayments && paymentMethod) {
        formData.append("payment_option", paymentMethod);
      }
      formData.append("validated_by", validatedBy);
      formData.append("credited_amount", depositAmount || "0");
      formData.append("discount_code", discountCode);

      // Config — use current status values (may have been changed via status modals)
      formData.append("branch", user?.branch_name || "");
      formData.append("status", ticketStatus);
      formData.append("payment_status", paymentStatusState);
      formData.append("processing_fee_on_creation", String(pricing.service_charge));
      formData.append("tax_on_creation", String(pricing.tax));

      // Cart items — mode-specific payload
      formData.append("enable_multiple_bikes", String(multiBike));

      if (multiBike) {
        const bikesWithDesc = bikes.map((b) => ({ ...b, description: description.trim() }));
        formData.append("bikes", JSON.stringify(bikesWithDesc));
      } else {
        // Single-bike mode: send flat arrays + explicit empty bikes to clear bikes_data
        formData.append("bikes", JSON.stringify([]));

        const svcIds = bikes[0]?.services.map((s) => s.service_id) || [];
        if (svcIds.length === 1) svcIds.push(0); // Backend expects 2+ entries
        formData.append("services", JSON.stringify(svcIds));
        formData.append("custom_services", JSON.stringify(bikes[0]?.custom_items || []));
        formData.append("inventory_items", JSON.stringify(bikes[0]?.inventory_items || []));
      }

      // ── PATCH request ──
      const response = await updateTicketMutation.mutateAsync(formData);
      setDirty(false);
      toast.success("Ticket updated successfully!");

      // Redirect to edit page with fresh data (uses response invoice number
      // in case it was changed, otherwise same ticket)
      const invoiceNum = (response as Record<string, unknown>)?.automatic_generated_invoice_number || ticketId;
      router.push(`/tickets/${invoiceNum}/edit`);
    } catch (err: unknown) {
      // ── Error handling — parse various response formats ──
      let msg = "Failed to update ticket";
      if (err && typeof err === "object" && "response" in err) {
        const r = (err as { response?: { data?: Record<string, unknown> } }).response;
        if (r?.data) {
          if (typeof r.data.detail === "string") msg = r.data.detail;
          else if (typeof r.data.error === "string") msg = r.data.error;
          else msg = JSON.stringify(r.data);
        }
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStripePayout = async () => {
    if (!user?.id || !user?.branch_id) return;

    // Guard: block if unsaved changes exist
    if (dirty) {
      toast.error("Please save the ticket first before enabling Stripe Payout");
      return;
    }

    setStripeLoading(true);
    try {
      // Step 1: Validate Stripe account is set up
      const stripeResult = await validateStripeMutation.mutateAsync({
        userId: String(user.id), branchId: String(user.branch_id),
      });
      if (!stripeResult.valid) {
        toast.error(stripeResult.message || "Please complete Stripe account setup in POS settings");
        return;
      }

      // Step 2: Enable terminal payment for this ticket
      await enableTerminalMutation.mutateAsync(ticketId);
      setStripeEnabled(true);
      toast.success("Stripe Payout enabled permanently!");

      // Redirect to invoice page after brief delay
      setTimeout(() => router.push(`/invoices/${ticketId}`), 1000);
    } catch {
      toast.error("Unable to enable terminal payment. Please try again.");
    } finally {
      setStripeLoading(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Edit Ticket"
        description={`Editing ticket ${ticketId}`}
        actions={
          <div className="flex items-center gap-2">
            <TicketStatusBadges
              ticketStatus={ticketStatus}
              paymentStatus={paymentStatusState}
              invoiceNumber={ticketId}
              onStatusChange={setTicketStatus}
              onPaymentStatusChange={setPaymentStatusState}
            />
            <Link href="/tickets">
              <Button variant="outline" size="sm"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Back</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer */}
          <CollapsibleSection title="Customer Details" open={sections.customer} onToggle={() => toggleSection("customer")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">Name *</Label><Input value={name} onChange={(e) => setName(e.target.value.toUpperCase())} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Phone *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))} maxLength={20} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value.toUpperCase())} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-9 text-sm" /></div>
            </div>
            <div className="mt-3">
              <Label className="text-xs">Description *</Label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 flex w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" />
            </div>
          </CollapsibleSection>

          {/* Order */}
          <CollapsibleSection title="Order Details" open={sections.order} onToggle={() => toggleSection("order")}>
            <OrderDetailsSection
              deliveryDate={deliveryDate}
              onDeliveryDateChange={setDeliveryDate}
              mechanic={mechanic}
              onMechanicChange={setMechanic}
              mechanics={mechanics}
              specialOrder={specialOrder}
              onSpecialOrderChange={setSpecialOrder}
              notes={notes}
              onNotesChange={setNotes}
              createdByName={user ? `${user.first_name} ${user.last_name}`.trim() : undefined}
            />
          </CollapsibleSection>

          {/* Cart */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold">Cart</h3>
                <span className="text-xs text-muted-foreground">{totalItemCount} items</span>
              </div>
              <button onClick={() => setMultiBike(!multiBike)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {multiBike ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                Multiple Bikes
              </button>
            </div>
            <div className="flex items-center gap-2 p-4 border-b bg-muted/20">
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setServicesModalOpen(true)}><Wrench className="h-3 w-3 mr-1" />Services</Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setCustomModalOpen(true)}><Plus className="h-3 w-3 mr-1" />Custom</Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setInventoryModalOpen(true)}><Package className="h-3 w-3 mr-1" />Inventory</Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setScanModalOpen(true)}><ScanBarcode className="h-3 w-3 mr-1" />Scan</Button>
            </div>
          </div>

          {multiBike ? (
            /* ── Multi-Bike Mode: per-bike cards with rename, remove, stock validation ── */
            <BikeCardsDisplay
              bikes={bikes}
              pricing={pricing}
              inventory={inventory}
              onBikesChange={updateBikes}
            />
          ) : (
            /* ── Single-Bike Mode: flat item list for bikes[0] ── */
            <div className="rounded-lg border bg-card overflow-hidden">
              {bikes[0] && bikes[0].services.length === 0 && bikes[0].custom_items.length === 0 && bikes[0].inventory_items.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground">No items added yet</div>
              )}
              {bikes[0]?.services.map((svc) => (
                <div key={svc.service_id} className="flex items-center justify-between px-4 py-2.5 border-b hover:bg-muted/20">
                  <div className="flex items-center gap-2"><Wrench className="h-3 w-3 text-muted-foreground" /><span className="text-sm">{svc.name}</span>{svc.taxable && <span className="text-[9px] text-muted-foreground bg-muted px-1 rounded">TAX</span>}</div>
                  <div className="flex items-center gap-3"><span className="text-sm font-medium">${svc.price.toFixed(2)}</span><button onClick={() => removeService(0, svc.service_id)} className="text-muted-foreground/40 hover:text-destructive"><Trash2 className="h-3 w-3" /></button></div>
                </div>
              ))}
              {bikes[0]?.custom_items.map((item) => (
                <div key={item.id} className="group flex items-center gap-3 px-4 py-2.5 border-b hover:bg-muted/20">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate">{item.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">Custom</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={item.taxable} onChange={(e) => updateTax(0, "custom", item.id, e.target.checked)} className="h-2.5 w-2.5 rounded accent-primary" />
                        <span className="text-[9px] text-muted-foreground/40">Tax</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input type="number" step="0.01" min="0" value={item.original_price} onChange={(e) => updatePrice(0, item.id, parseFloat(e.target.value) || 0)}
                      className="w-16 h-7 text-xs text-right border rounded-md px-2 bg-muted/20 tabular-nums" />
                    <div className="flex items-center rounded-lg border bg-muted/15 overflow-hidden">
                      <button onClick={() => updateQty(0, "custom", item.id, -1)} className="h-7 w-7 flex items-center justify-center hover:bg-muted transition-colors"><Minus className="h-3 w-3" /></button>
                      <span className="text-xs font-semibold w-6 text-center tabular-nums border-x">{item.quantity}</span>
                      <button onClick={() => updateQty(0, "custom", item.id, 1)} className="h-7 w-7 flex items-center justify-center hover:bg-muted transition-colors"><Plus className="h-3 w-3" /></button>
                    </div>
                    <span className="text-sm font-medium w-16 text-right tabular-nums">${(item.price * item.quantity).toFixed(2)}</span>
                    <button onClick={() => removeCustomItem(0, item.id)} className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
              {bikes[0]?.inventory_items.map((item) => (
                <div key={item.item_id} className="group flex items-center gap-3 px-4 py-2.5 border-b hover:bg-muted/20">
                  <Package className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate">{item.item_name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">Product</span>
                      <span className="text-[10px] text-muted-foreground/40 font-mono">{item.upc_ean}</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={item.taxable} onChange={(e) => updateTax(0, "inventory", item.item_id, e.target.checked)} className="h-2.5 w-2.5 rounded accent-primary" />
                        <span className="text-[9px] text-muted-foreground/40">Tax</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center rounded-lg border bg-muted/15 overflow-hidden">
                      <button onClick={() => updateQty(0, "inventory", item.item_id, -1)} className="h-7 w-7 flex items-center justify-center hover:bg-muted transition-colors"><Minus className="h-3 w-3" /></button>
                      <span className="text-xs font-semibold w-6 text-center tabular-nums border-x">{item.quantity}</span>
                      <button onClick={() => updateQty(0, "inventory", item.item_id, 1)} className="h-7 w-7 flex items-center justify-center hover:bg-muted transition-colors"><Plus className="h-3 w-3" /></button>
                    </div>
                    <span className="text-sm font-medium w-16 text-right tabular-nums">${(item.price * item.quantity).toFixed(2)}</span>
                    <button onClick={() => removeInventoryItem(0, item.item_id)} className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payment */}
          <CollapsibleSection title="Payment Details" open={sections.payment} onToggle={() => toggleSection("payment")}>
            <PaymentDetailsSection
              hasExistingPayments={hasExistingPayments}
              invoiceNumber={ticketId}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              validatedBy={validatedBy}
              onValidatedByChange={setValidatedBy}
              depositAmount={depositAmount}
              onDepositAmountChange={setDepositAmount}
              discountCode={discountCode}
              onDiscountCodeChange={setDiscountCode}
            />
          </CollapsibleSection>
        </div>

        {/* Right — Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-16 space-y-4">
            <OrderSummary bikes={bikes} pricing={pricing} pricingSource={pricingSource} />

            <Button className="w-full h-11 gradient-primary text-white border-0 shadow-soft" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Ticket"}
            </Button>

            <Button
              variant={stripeEnabled ? "default" : "outline"}
              className={`w-full ${stripeEnabled ? "bg-blue-600 hover:bg-blue-600 text-white cursor-default opacity-80" : ""}`}
              onClick={handleStripePayout}
              disabled={stripeEnabled || stripeLoading}
            >
              {stripeLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {stripeEnabled ? "Stripe Payout Enabled" : stripeLoading ? "Enabling..." : "Enable Stripe Payout"}
            </Button>
          </div>
        </div>
      </div>

      {/* Modals — pass multiBike so "Added" buttons are never disabled in multi-bike mode */}
      <ServicesModal open={servicesModalOpen} onClose={() => setServicesModalOpen(false)} services={services} addedServiceIds={addedServiceIds} multiBike={multiBike} onAdd={addService} />
      <CustomItemModal open={customModalOpen} onClose={() => setCustomModalOpen(false)} processingFee={pricing.service_charge} onAdd={addCustomItem} />
      <InventoryModal open={inventoryModalOpen} onClose={() => setInventoryModalOpen(false)} inventory={inventory} addedItemIds={addedInventoryIds} multiBike={multiBike} onAdd={addInventoryItem} />
      <ScanInventoryModal open={scanModalOpen} onClose={() => setScanModalOpen(false)} inventory={inventory} addedItemIds={addedInventoryIds} multiBike={multiBike} onAdd={addInventoryItem} />
    </PageShell>
  );
}

function CollapsibleSection({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card">
      <button onClick={onToggle} className="flex items-center justify-between w-full p-4 text-left">
        <h3 className="text-sm font-semibold">{title}</h3>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
