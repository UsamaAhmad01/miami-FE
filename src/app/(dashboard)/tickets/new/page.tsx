"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown, ChevronRight, Plus, Minus, Trash2, Wrench, Package, FileText,
  CreditCard, Banknote, Loader2, ArrowLeft, ToggleLeft, ToggleRight, Pencil, Bike, ScanBarcode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { useAuthStore } from "@/stores/auth-store";
import { useServices, useMechanics, useInventoryItems, usePricing, useCreateTicket, useRecordCashPayment } from "@/hooks/use-api";
import { toast } from "sonner";
import { ServicesModal } from "./_components/services-modal";
import { CustomItemModal } from "./_components/custom-item-modal";
import { InventoryModal } from "./_components/inventory-modal";
import { EditBikeModal } from "./_components/edit-bike-modal";
import { ScanInventoryModal } from "./_components/scan-inventory-modal";
import {
  type BikeCart, type CartCustomItem, type CartInventoryItem,
  type PaymentMethod, type CatalogInventoryItem, applyProcessingFee, calculateTotals,
} from "./_data/ticket-form-types";
import Link from "next/link";
import { OrderDetailsSection } from "../_components/order-details-section";
import { OrderSummary } from "../_components/order-summary";

export default function NewTicketPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const branchId = user?.branch_id || 0;

  const { data: servicesData } = useServices();
  const { data: mechanicsData } = useMechanics();
  const { data: inventoryData } = useInventoryItems(branchId);
  const { data: pricingData } = usePricing(branchId);
  const createTicketMutation = useCreateTicket();
  const recordCashMutation = useRecordCashPayment();

  const servicesCatalog = servicesData || [];
  const mechanics = mechanicsData || [];
  const inventoryCatalog: CatalogInventoryItem[] = (inventoryData || []).filter((i: CatalogInventoryItem) => (i.quantity || 0) > 0);
  const pricing = pricingData || { tax: 7.0, service_charge: 3.0, shipping: 0 };

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState("");
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
  const [validatedBy, setValidatedBy] = useState([user?.first_name, user?.last_name].filter(Boolean).join(" ") || "");
  const [depositAmount, setDepositAmount] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [partialCash, setPartialCash] = useState("");

  // Cart
  const [multiBike, setMultiBike] = useState(false);
  const [bikes, setBikes] = useState<BikeCart[]>([{ bike_id: 1, bike_name: "Bike 1", services: [], custom_items: [], inventory_items: [] }]);

  // Which bike's modal is open — each bike opens its own modal
  const [addingToBikeId, setAddingToBikeId] = useState<number | null>(null);
  const [modalType, setModalType] = useState<"services" | "custom" | "inventory" | "scan" | null>(null);
  const [editBikeId, setEditBikeId] = useState<number | null>(null);

  // Sections
  const [sections, setSections] = useState({ customer: true, order: true, payment: true, invoice: false });
  const toggleSection = (key: keyof typeof sections) => setSections((p) => ({ ...p, [key]: !p[key] }));
  const [submitting, setSubmitting] = useState(false);

  // Derived
  const addingBike = bikes.find((b) => b.bike_id === addingToBikeId);
  const addedServiceIds = useMemo(() => new Set(addingBike?.services.map((s) => s.service_id) || []), [addingBike]);
  const addedInventoryIds = useMemo(() => new Set(addingBike?.inventory_items.map((i) => i.item_id) || []), [addingBike]);
  const totals = useMemo(() => calculateTotals(bikes, pricing), [bikes, pricing]);
  const balanceDue = paymentMethod === "partial" ? totals.finalTotal - (parseFloat(partialCash) || 0) : 0;
  const totalItemCount = bikes.reduce((sum, b) => sum + b.services.length + b.custom_items.length + b.inventory_items.length, 0);

  // Stock helpers
  const getTotalInventoryUsed = useCallback((itemId: string): number =>
    bikes.reduce((sum, b) => sum + (b.inventory_items.find((i) => i.item_id === itemId)?.quantity || 0), 0), [bikes]);
  const getAvailableStock = useCallback((itemId: string): number =>
    inventoryCatalog.find((i) => i.id === itemId)?.quantity || 0, [inventoryCatalog]);

  // --- Open modal for a specific bike ---
  const openModal = (bikeId: number, type: "services" | "custom" | "inventory" | "scan") => {
    setAddingToBikeId(bikeId);
    setModalType(type);
  };
  const closeModal = () => { setModalType(null); setAddingToBikeId(null); };

  // --- Cart actions (always target addingToBikeId) ---
  const handleAddService = (svc: { id: number; name: string; price: number; taxable: boolean }) => {
    if (!addingToBikeId) return;
    const svcPrice = parseFloat(String(svc.price)) || 0;
    const price = applyProcessingFee(svcPrice, pricing.service_charge);
    const targetBike = bikes.find((b) => b.bike_id === addingToBikeId);
    if (targetBike?.services.some((s) => s.service_id === svc.id)) {
      toast.error(`"${svc.name}" already on ${targetBike.bike_name}`);
      return;
    }
    setBikes((prev) => prev.map((b) => b.bike_id !== addingToBikeId ? b : {
      ...b, services: [...b.services, { service_id: svc.id, name: svc.name, price, original_price: svcPrice, taxable: svc.taxable }],
    }));
    toast.success(`Added "${svc.name}"`);
  };

  const handleAddCustom = (item: { name: string; price: number; quantity: number; taxable: boolean }) => {
    if (!addingToBikeId) return;
    const itemPrice = parseFloat(String(item.price)) || 0;
    const price = applyProcessingFee(itemPrice, pricing.service_charge);
    setBikes((prev) => prev.map((b) => b.bike_id !== addingToBikeId ? b : {
      ...b, custom_items: [...b.custom_items, { id: `c-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: item.name, price, original_price: itemPrice, quantity: item.quantity, taxable: item.taxable }],
    }));
    toast.success(`Added "${item.name}"`);
  };

  const handleAddInventory = (item: CatalogInventoryItem) => {
    if (!addingToBikeId) return;
    const used = getTotalInventoryUsed(item.id);
    if (used >= item.quantity) { toast.error(`No stock left for "${item.description}"`); return; }
    const targetBike = bikes.find((b) => b.bike_id === addingToBikeId);
    if (targetBike?.inventory_items.some((i) => i.item_id === item.id)) {
      toast.error(`"${item.description}" already on ${targetBike.bike_name}`);
      return;
    }
    const unitPrice = parseFloat(String(item.unit_price)) || 0;
    const price = applyProcessingFee(unitPrice, pricing.service_charge);
    setBikes((prev) => prev.map((b) => b.bike_id !== addingToBikeId ? b : {
      ...b, inventory_items: [...b.inventory_items, { item_id: item.id, item_name: item.description, upc_ean: item.upc_ean, price, original_price: unitPrice, quantity: 1, taxable: true }],
    }));
    toast.success(`Added "${item.description}"`);
  };

  // --- Item modification ---
  const updateQty = (bikeId: number, type: "custom" | "inventory", itemId: string, delta: number) => {
    setBikes((prev) => prev.map((b) => {
      if (b.bike_id !== bikeId) return b;
      if (type === "custom") {
        const updated = b.custom_items.map((c) => c.id === itemId ? { ...c, quantity: c.quantity + delta } : c).filter((c) => c.quantity > 0);
        return { ...b, custom_items: updated };
      }
      const item = b.inventory_items.find((i) => i.item_id === itemId);
      if (!item) return b;
      const newQty = item.quantity + delta;
      if (newQty < 1) return { ...b, inventory_items: b.inventory_items.filter((i) => i.item_id !== itemId) };
      const totalUsed = getTotalInventoryUsed(itemId);
      if (totalUsed - item.quantity + newQty > getAvailableStock(itemId)) { toast.error("Max stock reached"); return b; }
      return { ...b, inventory_items: b.inventory_items.map((i) => i.item_id === itemId ? { ...i, quantity: newQty } : i) };
    }));
  };

  const updatePrice = (bikeId: number, itemId: string, val: number) => {
    if (isNaN(val) || val < 0) return; // allow 0 (free items) but block negative
    setBikes((prev) => prev.map((b) => b.bike_id !== bikeId ? b : {
      ...b, custom_items: b.custom_items.map((c) => c.id === itemId ? { ...c, price: applyProcessingFee(val, pricing.service_charge), original_price: val } : c),
    }));
  };

  const updateTax = (bikeId: number, type: "custom" | "inventory", itemId: string, taxable: boolean) => {
    setBikes((prev) => prev.map((b) => {
      if (b.bike_id !== bikeId) return b;
      if (type === "custom") return { ...b, custom_items: b.custom_items.map((c) => c.id === itemId ? { ...c, taxable } : c) };
      return { ...b, inventory_items: b.inventory_items.map((i) => i.item_id === itemId ? { ...i, taxable } : i) };
    }));
  };

  const removeSvc = (bikeId: number, svcId: number) => setBikes((p) => p.map((b) => b.bike_id === bikeId ? { ...b, services: b.services.filter((s) => s.service_id !== svcId) } : b));
  const removeCustom = (bikeId: number, itemId: string) => setBikes((p) => p.map((b) => b.bike_id === bikeId ? { ...b, custom_items: b.custom_items.filter((c) => c.id !== itemId) } : b));
  const removeInv = (bikeId: number, itemId: string) => setBikes((p) => p.map((b) => b.bike_id === bikeId ? { ...b, inventory_items: b.inventory_items.filter((i) => i.item_id !== itemId) } : b));

  // --- Bike management ---
  const addBike = () => {
    setBikes((prev) => {
      const id = Math.max(...prev.map((b) => b.bike_id), 0) + 1;
      return [...prev, { bike_id: id, bike_name: `Bike ${id}`, services: [], custom_items: [], inventory_items: [] }];
    });
    toast.success("Bike added");
  };
  const removeBike = (id: number) => { if (bikes.length <= 1) { toast.error("Can't remove last bike"); return; } setBikes((p) => p.filter((b) => b.bike_id !== id)); };
  const renameBike = (id: number, name: string) => setBikes((p) => p.map((b) => b.bike_id === id ? { ...b, bike_name: name } : b));

  const toggleMultiBike = () => {
    if (multiBike && bikes.length > 1) {
      setBikes((prev) => {
        const m: BikeCart = { ...prev[0], services: prev.flatMap((b) => b.services), custom_items: prev.flatMap((b) => b.custom_items), inventory_items: prev.flatMap((b) => b.inventory_items) };
        const seen = new Set<number>();
        m.services = m.services.filter((s) => { if (seen.has(s.service_id)) return false; seen.add(s.service_id); return true; });
        const invMap = new Map<string, CartInventoryItem>();
        for (const i of m.inventory_items) { const e = invMap.get(i.item_id); if (e) e.quantity += i.quantity; else invMap.set(i.item_id, { ...i }); }
        m.inventory_items = Array.from(invMap.values());
        return [m];
      });
      toast.info("Items merged into single cart");
    }
    setMultiBike(!multiBike);
  };

  // --- Submit ---
  const handleSubmit = async () => {
    const errs: string[] = [];
    if (!name.trim()) errs.push("Customer name is required");
    if (!phone.trim()) errs.push("Phone is required");
    if (!description.trim()) errs.push("Description is required");
    if (!deliveryDate) errs.push("Delivery date is required");
    if (totalItemCount === 0) errs.push("Add at least one item");
    if (!paymentMethod) errs.push("Select a payment method");
    if (paymentMethod === "partial") {
      const c = parseFloat(partialCash);
      if (!c || c <= 0) errs.push("Enter valid cash amount");
      else if (c >= totals.finalTotal) errs.push("Cash must be less than total");
    }
    if (errs.length > 0) { errs.forEach((e) => toast.error(e)); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", name); fd.append("phone_no", phone); fd.append("address", address);
      fd.append("email", email); fd.append("description", description); fd.append("delivery_date", deliveryDate);
      fd.append("mechanic_name", mechanic); fd.append("special_order", specialOrder ? "Yes" : "No");
      fd.append("notes", notes); fd.append("payment_option", paymentMethod);
      fd.append("validated_by", validatedBy); fd.append("credited_amount", depositAmount || "0");
      fd.append("discount_code", discountCode); fd.append("branch", user?.branch_name || "");
      fd.append("status", "Pending"); fd.append("payment_status", "Unpaid"); fd.append("is_active", "true");
      fd.append("processing_fee_on_creation", String(pricing.service_charge));
      fd.append("tax_on_creation", String(pricing.tax));
      if (invoiceNumber) fd.append("automatic_generated_invoice_number", invoiceNumber);
      fd.append("enable_multiple_bikes", String(multiBike));
      if (multiBike) {
        const bikesWithDesc = bikes.map((b) => ({ ...b, description: description.trim() }));
        fd.append("bikes", JSON.stringify(bikesWithDesc));
      }
      else {
        const svcIds = bikes[0]?.services.map((s) => s.service_id) || [];
        if (svcIds.length === 1) svcIds.push(0);
        fd.append("services", JSON.stringify(svcIds));
        fd.append("custom_services", JSON.stringify(bikes[0]?.custom_items || []));
        fd.append("inventory_items", JSON.stringify(bikes[0]?.inventory_items || []));
      }

      const result = await createTicketMutation.mutateAsync(fd);
      const inv = result?.automatic_generated_invoice_number;

      // Record partial cash payment if applicable
      if (paymentMethod === "partial" && partialCash && inv) {
        try {
          await recordCashMutation.mutateAsync({ invoiceNumber: inv, amount: parseFloat(partialCash), paymentMethod: "cash" });
        } catch {
          toast.error("Ticket created but cash payment recording failed");
        }
      }

      toast.success("Ticket created!");
      router.push(inv ? `/invoices/${inv}` : "/tickets");
    } catch (err: unknown) {
      let msg = "Failed to create ticket";
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

  // --- Render ---
  const editBikeName = bikes.find((b) => b.bike_id === editBikeId)?.bike_name || "";

  // Shared add buttons row
  const AddButtons = ({ bikeId }: { bikeId: number }) => (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => openModal(bikeId, "services")}><Wrench className="h-3 w-3 mr-1" />Services</Button>
      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => openModal(bikeId, "custom")}><Plus className="h-3 w-3 mr-1" />Custom</Button>
      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => openModal(bikeId, "inventory")}><Package className="h-3 w-3 mr-1" />Inventory</Button>
    </div>
  );

  return (
    <PageShell>
      <PageHeader title="New Ticket" description="Create a new bike repair ticket" actions={
        <Link href="/tickets"><Button variant="outline" size="sm"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Back</Button></Link>
      } />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Invoice */}
          <Section title="Invoice Number" open={sections.invoice} onToggle={() => toggleSection("invoice")}>
            <div className="max-w-xs"><Label className="text-xs">Custom Invoice # (optional)</Label><Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))} maxLength={6} className="mt-1 h-9 text-sm font-mono" /></div>
          </Section>

          {/* Customer */}
          <Section title="Customer Details" open={sections.customer} onToggle={() => toggleSection("customer")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">Name *</Label><Input value={name} onChange={(e) => setName(e.target.value.toUpperCase())} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Phone *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))} maxLength={20} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value.toUpperCase())} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-9 text-sm" /></div>
            </div>
            <div className="mt-3"><Label className="text-xs">Description *</Label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 flex w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" />
            </div>
          </Section>

          {/* Order */}
          <Section title="Order Details" open={sections.order} onToggle={() => toggleSection("order")}>
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
              createdByName={[user?.first_name, user?.last_name].filter(Boolean).join(" ") || undefined}
            />
          </Section>

          {/* ═══════ PREMIUM CART ═══════ */}
          <div className="rounded-2xl bg-card shadow-lg ring-1 ring-border/50 overflow-hidden">
            {/* Sticky cart header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-card/95 backdrop-blur-sm border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">Cart</h3>
                  <p className="text-[11px] text-muted-foreground">{totalItemCount} item{totalItemCount !== 1 ? "s" : ""} added</p>
                </div>
              </div>
              <button onClick={toggleMultiBike} className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:bg-muted/50 active:scale-[0.97]">
                {multiBike ? <ToggleRight className="h-3.5 w-3.5 text-primary" /> : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className={multiBike ? "text-primary" : "text-muted-foreground"}>Multi-Bike</span>
              </button>
            </div>

            {/* Bike cards */}
            <div className="p-4 space-y-4">
              {bikes.map((bike) => {
                const count = bike.services.length + bike.custom_items.length + bike.inventory_items.length;
                const bikeSubtotal = [...bike.services.map((s) => s.price), ...bike.custom_items.map((c) => c.price * c.quantity), ...bike.inventory_items.map((i) => i.price * i.quantity)].reduce((a, b) => a + b, 0);

                return (
                  <div key={bike.bike_id} className="rounded-xl ring-1 ring-border/40 bg-background overflow-hidden transition-shadow hover:shadow-md">
                    {/* Bike header */}
                    {multiBike && (
                      <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground/5">
                            <Bike className="h-3.5 w-3.5 text-foreground/70" />
                          </div>
                          <span className="text-[13px] font-semibold tracking-tight">{bike.bike_name}</span>
                          <span className="text-[10px] text-muted-foreground font-medium ml-1">{count} item{count !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => setEditBikeId(bike.bike_id)} className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                          {bikes.length > 1 && <button onClick={() => removeBike(bike.bike_id)} className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>}
                        </div>
                      </div>
                    )}

                    {/* Add buttons — pill group */}
                    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/30">
                      <span className="text-[10px] text-muted-foreground font-medium mr-1">Add:</span>
                      {([
                        { type: "services" as const, label: "Service", icon: Wrench },
                        { type: "custom" as const, label: "Custom", icon: FileText },
                        { type: "inventory" as const, label: "Inventory", icon: Package },
                        { type: "scan" as const, label: "Scan", icon: ScanBarcode },
                      ]).map((btn) => (
                        <button key={btn.type} onClick={() => openModal(bike.bike_id, btn.type)}
                          className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:shadow-sm transition-all active:scale-[0.97]">
                          <btn.icon className="h-3 w-3" />{btn.label}
                        </button>
                      ))}
                    </div>

                    {/* Empty state */}
                    {count === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 mb-3">
                          <Package className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground/60">No items yet</p>
                        <p className="text-[10px] text-muted-foreground/40 mt-0.5">Use the buttons above to add services or products</p>
                      </div>
                    ) : (
                      <div>
                        {/* Services */}
                        {bike.services.map((svc) => (
                          <div key={`s-${bike.bike_id}-${svc.service_id}`} className="group flex items-center gap-3 px-4 py-3 border-b border-border/15 last:border-0 hover:bg-muted/15 transition-colors">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/8 shrink-0">
                              <Wrench className="h-3.5 w-3.5 text-indigo-500/80" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium truncate">{svc.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">Service</span>
                                {svc.taxable && <span className="text-[9px] text-muted-foreground/40">+ tax</span>}
                              </div>
                            </div>
                            <span className="text-[13px] font-semibold tabular-nums shrink-0">${svc.price.toFixed(2)}</span>
                            <button onClick={() => removeSvc(bike.bike_id, svc.service_id)} className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 transition-all">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}

                        {/* Custom items */}
                        {bike.custom_items.map((item) => (
                          <div key={`c-${bike.bike_id}-${item.id}`} className="group flex items-center gap-3 px-4 py-3 border-b border-border/15 last:border-0 hover:bg-muted/15 transition-colors">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/8 shrink-0">
                              <FileText className="h-3.5 w-3.5 text-teal-500/80" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium truncate">{item.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">Custom</span>
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input type="checkbox" checked={item.taxable} onChange={(e) => updateTax(bike.bike_id, "custom", item.id, e.target.checked)} className="h-2.5 w-2.5 rounded accent-primary" />
                                  <span className="text-[9px] text-muted-foreground/40">Tax</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <input type="number" step="0.01" min="0" value={item.original_price} onChange={(e) => updatePrice(bike.bike_id, item.id, parseFloat(e.target.value) || 0)}
                                className="w-16 h-7 text-xs text-right border rounded-lg px-2 bg-muted/20 tabular-nums focus:bg-background focus:ring-1 focus:ring-primary/30 transition-all outline-none" />
                              <div className="flex items-center rounded-lg border bg-muted/15 overflow-hidden">
                                <button onClick={() => updateQty(bike.bike_id, "custom", item.id, -1)} className="h-7 w-7 flex items-center justify-center hover:bg-muted/40 transition-colors"><Minus className="h-3 w-3" /></button>
                                <span className="text-xs font-semibold w-6 text-center tabular-nums border-x border-border/30">{item.quantity}</span>
                                <button onClick={() => updateQty(bike.bike_id, "custom", item.id, 1)} className="h-7 w-7 flex items-center justify-center hover:bg-muted/40 transition-colors"><Plus className="h-3 w-3" /></button>
                              </div>
                              <span className="text-[13px] font-semibold tabular-nums w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                              <button onClick={() => removeCustom(bike.bike_id, item.id)} className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 transition-all">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Inventory */}
                        {bike.inventory_items.map((item) => (
                          <div key={`i-${bike.bike_id}-${item.item_id}`} className="group flex items-center gap-3 px-4 py-3 border-b border-border/15 last:border-0 hover:bg-muted/15 transition-colors">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/8 shrink-0">
                              <Package className="h-3.5 w-3.5 text-amber-500/80" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium truncate">{item.item_name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">Product</span>
                                <span className="text-[10px] text-muted-foreground/40 font-mono">{item.upc_ean}</span>
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input type="checkbox" checked={item.taxable} onChange={(e) => updateTax(bike.bike_id, "inventory", item.item_id, e.target.checked)} className="h-2.5 w-2.5 rounded accent-primary" />
                                  <span className="text-[9px] text-muted-foreground/40">Tax</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center rounded-lg border bg-muted/15 overflow-hidden">
                                <button onClick={() => updateQty(bike.bike_id, "inventory", item.item_id, -1)} className="h-7 w-7 flex items-center justify-center hover:bg-muted/40 transition-colors"><Minus className="h-3 w-3" /></button>
                                <span className="text-xs font-semibold w-6 text-center tabular-nums border-x border-border/30">{item.quantity}</span>
                                <button onClick={() => updateQty(bike.bike_id, "inventory", item.item_id, 1)} className="h-7 w-7 flex items-center justify-center hover:bg-muted/40 transition-colors"><Plus className="h-3 w-3" /></button>
                              </div>
                              <span className="text-[13px] font-semibold tabular-nums w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                              <button onClick={() => removeInv(bike.bike_id, item.item_id)} className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 transition-all">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Bike subtotal */}
                        {multiBike && count > 0 && (
                          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/15">
                            <span className="text-[11px] font-medium text-muted-foreground">Subtotal</span>
                            <span className="text-[13px] font-semibold tabular-nums">${bikeSubtotal.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Bike — dashed button */}
            {multiBike && (
              <div className="px-4 pb-4">
                <button onClick={addBike} className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-border/40 py-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:bg-muted/15 transition-all active:scale-[0.99]">
                  <Plus className="h-3.5 w-3.5" />Add Another Bike
                </button>
              </div>
            )}
          </div>

          {/* Payment */}
          <Section title="Payment Details" open={sections.payment} onToggle={() => toggleSection("payment")}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><Label className="text-xs">Validated By</Label><Input value={validatedBy} onChange={(e) => setValidatedBy(e.target.value)} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Deposit</Label><Input type="number" step="0.01" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="$0.00" className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Discount Code</Label><Input value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} className="mt-1 h-9 text-sm" /></div>
            </div>
            <div className="mt-4">
              <Label className="text-xs font-medium">Payment Method *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {([{ value: "cash", label: "Cash", icon: Banknote }, { value: "credit_card", label: "Card", icon: CreditCard }, { value: "zelle", label: "Zelle", icon: CreditCard }, { value: "partial", label: "Partial", icon: Banknote }] as const).map((o) => (
                  <button key={o.value} onClick={() => setPaymentMethod(o.value)} className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all active:scale-[0.97] ${paymentMethod === o.value ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20" : "hover:bg-muted/50"}`}>
                    <o.icon className="h-4 w-4" />{o.label}
                  </button>
                ))}
              </div>
            </div>
            {paymentMethod === "partial" && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Cash Amount</Label><Input type="number" step="0.01" value={partialCash} onChange={(e) => setPartialCash(e.target.value)} className="mt-1 h-9 text-sm" /></div>
                <div><Label className="text-xs">Balance Due</Label>
                  <div className={`mt-1 flex h-9 items-center rounded-lg border px-3 text-sm font-semibold ${balanceDue <= 0 ? "bg-destructive/10 text-destructive" : "bg-muted/30"}`}>${balanceDue.toFixed(2)}</div>
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* ═══ Right — Order Summary ═══ */}
        <div className="lg:col-span-1">
          <div className="sticky top-16 space-y-4">
            <OrderSummary bikes={bikes} pricing={pricing} />

            <Button className="w-full h-12 rounded-xl gradient-primary text-white border-0 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] text-sm font-semibold" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Ticket"}
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ServicesModal open={modalType === "services"} onClose={closeModal} services={servicesCatalog} addedServiceIds={addedServiceIds} multiBike={multiBike} onAdd={handleAddService} />
      <CustomItemModal open={modalType === "custom"} onClose={closeModal} processingFee={pricing.service_charge} onAdd={handleAddCustom} />
      <InventoryModal open={modalType === "inventory"} onClose={closeModal} inventory={inventoryCatalog} addedItemIds={addedInventoryIds} multiBike={multiBike} onAdd={handleAddInventory} />
      <ScanInventoryModal open={modalType === "scan"} onClose={closeModal} inventory={inventoryCatalog} addedItemIds={addedInventoryIds} multiBike={multiBike} onAdd={handleAddInventory} />
      <EditBikeModal open={!!editBikeId} onClose={() => setEditBikeId(null)} currentName={editBikeName} onSave={(n) => { if (editBikeId) renameBike(editBikeId, n); }} />
    </PageShell>
  );
}

// --- Reusable sub-components ---
function Section({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <button onClick={onToggle} className="flex items-center justify-between w-full p-4 text-left">
        <h3 className="text-sm font-semibold">{title}</h3>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 border-t pt-4">{children}</div>}
    </div>
  );
}
