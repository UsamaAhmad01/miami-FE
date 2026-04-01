"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useOrderDetail, useUpdateOrder, useVendorsByUpc } from "@/hooks/use-api";
import { toast } from "sonner";

interface EditItem {
  sku: string;
  name: string;
  warehouse: string;
  upc: string;
  cost: number;
  quantity: number;
  quantity_received: number;
  product_id: string;
}

interface NewItem {
  id: number;
  upc: string;
  quantity: string;
  warehouse: string;
}

export default function OrderEditPage() {
  const { id } = useParams();
  const orderId = id as string;
  const router = useRouter();
  const { data: order, isLoading } = useOrderDetail(orderId);
  const updateOrder = useUpdateOrder();

  const [items, setItems] = useState<EditItem[]>([]);
  const [newItems, setNewItems] = useState<NewItem[]>([]);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [shipping, setShipping] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [vendorModal, setVendorModal] = useState<{ productId: string; upc: string } | null>(null);
  const [newItemCounter, setNewItemCounter] = useState(0);

  // Initialize from API data
  if (order && !initialized) {
    const orderItems = (order.items || []) as Array<Record<string, unknown>>;
    setItems(orderItems.map((item) => ({
      sku: String(item.sku || item.upc || ""),
      name: String(item.name || ""),
      warehouse: String(item.vendor || ""),
      upc: String(item.upc || ""),
      cost: Number(item.cost) || 0,
      quantity: Number(item.quantity) || 0,
      quantity_received: 0,
      product_id: String(item.product_id || item.sku || ""),
    })));
    setDeliveryNote(String(order.delivery_note || ""));
    setShipping(String(order.shipping || ""));
    setInitialized(true);
  }

  const handleQuantityChange = (idx: number, field: "quantity" | "quantity_received", value: string) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: parseInt(value) || 0 } : item));
  };

  const handleRemoveItem = (idx: number) => {
    if (!confirm("Remove this item?")) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addNewItemRow = () => {
    setNewItemCounter((c) => c + 1);
    setNewItems((prev) => [...prev, { id: newItemCounter + 1, upc: "", quantity: "1", warehouse: "" }]);
  };

  const updateNewItem = (id: number, field: keyof NewItem, value: string) => {
    setNewItems((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeNewItem = (id: number) => {
    setNewItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    try {
      await updateOrder.mutateAsync({
        order: orderId,
        delivery_note: deliveryNote,
        shippingCharges: parseFloat(shipping) || 0,
        items: items.map((item) => ({
          sku: item.sku,
          warehouse: item.warehouse,
          product_id: item.product_id,
          quantity: item.quantity,
          quantity_org: item.quantity_received,
        })),
        additems: newItems.filter((ni) => ni.upc).map((ni) => ({
          upc: ni.upc,
          quantity: parseInt(ni.quantity) || 1,
          warehouse: ni.warehouse,
        })),
      });
      toast.success("Order updated");
      router.refresh();
    } catch {
      toast.error("Failed to update order");
    }
  };

  if (isLoading) return <BrandedLoader variant="page" text="Loading order..." />;
  if (!order) return <PageShell><div className="text-center py-12 text-sm text-muted-foreground">Order not found</div></PageShell>;

  return (
    <PageShell>
      <PageHeader
        title={`Edit Order ${orderId}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/orders/${orderId}/wholesale`}><Button variant="outline" size="sm"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Back</Button></Link>
            <Button size="sm" onClick={() => setAddModalOpen(true)}><Plus className="h-3.5 w-3.5 mr-1.5" />Add Product</Button>
          </div>
        }
      />

      {/* Existing items */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2 w-8">#</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2">Item</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2">Warehouse</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2">UPC</th>
              <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2">Cost</th>
              <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2 w-20">Qty</th>
              <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2 w-24">Received</th>
              <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2">Remaining</th>
              <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2">Total</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{i + 1}</td>
                <td className="px-3 py-2.5 text-sm font-medium">{item.name}</td>
                <td className="px-3 py-2.5">
                  <button onClick={() => setVendorModal({ productId: item.product_id, upc: item.upc })} className="text-xs text-primary hover:underline">
                    {item.warehouse || "Select"}
                  </button>
                </td>
                <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{item.upc}</td>
                <td className="px-3 py-2.5 text-sm text-right">${item.cost.toFixed(2)}</td>
                <td className="px-3 py-2.5"><Input type="number" min={0} value={item.quantity} onChange={(e) => handleQuantityChange(i, "quantity", e.target.value)} className="h-7 w-16 text-sm text-center ml-auto" /></td>
                <td className="px-3 py-2.5"><Input type="number" min={0} value={item.quantity_received} onChange={(e) => handleQuantityChange(i, "quantity_received", e.target.value)} className="h-7 w-16 text-sm text-center ml-auto" /></td>
                <td className="px-3 py-2.5 text-sm text-right">{item.quantity - item.quantity_received}</td>
                <td className="px-3 py-2.5 text-sm font-medium text-right">${(item.cost * item.quantity).toFixed(2)}</td>
                <td className="px-3 py-2.5"><button onClick={() => handleRemoveItem(i)} className="text-muted-foreground/40 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes + Shipping + Save */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Label className="text-xs">Delivery Notes</Label>
          <textarea value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} rows={2} className="mt-1 flex w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" />
        </div>
        <div>
          <Label className="text-xs">Shipping ($)</Label>
          <Input type="number" step="0.01" value={shipping} onChange={(e) => setShipping(e.target.value)} className="mt-1 h-9 text-sm" />
        </div>
      </div>

      <Button onClick={handleSave} disabled={updateOrder.isPending} className="gradient-primary text-white border-0 shadow-soft">
        {updateOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save Changes
      </Button>

      {/* Add Product Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Add Products</DialogTitle>
            <DialogDescription className="text-xs">Add new products to this order</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {newItems.map((ni) => (
              <div key={ni.id} className="flex items-center gap-2">
                <Input value={ni.upc} onChange={(e) => updateNewItem(ni.id, "upc", e.target.value)} placeholder="UPC" className="h-8 text-sm flex-1" />
                <Input type="number" value={ni.quantity} onChange={(e) => updateNewItem(ni.id, "quantity", e.target.value)} placeholder="Qty" className="h-8 text-sm w-16" />
                <Input value={ni.warehouse} onChange={(e) => updateNewItem(ni.id, "warehouse", e.target.value)} placeholder="Warehouse" className="h-8 text-sm w-24" />
                <button onClick={() => removeNewItem(ni.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={addNewItemRow}><Plus className="h-3 w-3 mr-1" />Add Row</Button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { setAddModalOpen(false); handleSave(); }}>Submit</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vendor Selection Modal */}
      {vendorModal && <VendorSelectModal upc={vendorModal.upc} onSelect={(vendor) => {
        setItems((prev) => prev.map((item) => item.product_id === vendorModal.productId ? { ...item, warehouse: vendor } : item));
        setVendorModal(null);
      }} onClose={() => setVendorModal(null)} />}
    </PageShell>
  );
}

function VendorSelectModal({ upc, onSelect, onClose }: { upc: string; onSelect: (vendor: string) => void; onClose: () => void }) {
  const { data } = useVendorsByUpc(upc);
  const vendors = data?.vendors || [];

  return (
    <Dialog open={true} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base">Select Vendor</DialogTitle>
          <DialogDescription className="text-xs">Choose a warehouse for this product</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          {vendors.map((v, i) => (
            <button key={i} onClick={() => onSelect(v.screen_name)} className="flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-muted/50 transition-colors text-left">
              <span className="text-sm font-medium">{v.screen_name}</span>
              <span className="text-xs text-muted-foreground">{v.quantity} available</span>
            </button>
          ))}
          {vendors.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No vendors found</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
