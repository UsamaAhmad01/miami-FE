"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/primitives/status-badge";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminOrders, useUpdateAdminOrderStatus, useDeleteAdminOrder, useUpdateAdminOrderPaymentStatus, useAssignOrder } from "@/hooks/use-api";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, "info" | "warning" | "success" | "error"> = { Processing: "info", Shipped: "warning", Delivered: "success", Cancelled: "error" };

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: ordersData, isLoading } = useAdminOrders(user?.branch_id || 0, user?.id || 0);
  const orders = ordersData?.data || [];

  const updateStatus = useUpdateAdminOrderStatus();
  const updatePayment = useUpdateAdminOrderPaymentStatus();
  const deleteOrder = useDeleteAdminOrder();
  const assignOrder = useAssignOrder();

  const [statusModal, setStatusModal] = useState<{ orderId: string; current: string } | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ orderId: string; current: string } | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [newPayment, setNewPayment] = useState("");

  const handleStatusUpdate = async () => {
    if (!statusModal) return;
    try { await updateStatus.mutateAsync({ order_id: statusModal.orderId, status: newStatus }); toast.success("Status updated"); setStatusModal(null); } catch { toast.error("Failed"); }
  };

  const handlePaymentUpdate = async () => {
    if (!paymentModal) return;
    try { await updatePayment.mutateAsync({ order_id: paymentModal.orderId, status: newPayment }); toast.success("Payment status updated"); setPaymentModal(null); } catch { toast.error("Failed"); }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm("Delete this order?")) return;
    try { await deleteOrder.mutateAsync({ order_id: orderId }); toast.success("Order deleted"); } catch { toast.error("Failed"); }
  };

  return (
    <PageShell>
      <PageHeader title="Orders Manager" description="Admin wholesale order management" />

      {isLoading ? <BrandedLoader variant="inline" text="Loading orders..." /> : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b">
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Order ID</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Date</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Status</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Billing</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Shipping</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Payment</th>
              <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2.5">Total</th>
              <th className="w-10"></th>
            </tr></thead>
            <tbody>
              {orders.map((order) => {
                const oid = String(order.order_id || "");
                const status = String(order.order_status || "");
                const payment = String(order.payment_status || "");
                return (
                  <tr key={oid} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-xs font-medium cursor-pointer text-primary hover:underline" onClick={() => router.push(`/orders/${oid}/wholesale`)}>{oid}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{String(order.created_at || "").split("T")[0]}</td>
                    <td className="px-3 py-2.5"><button onClick={() => { setStatusModal({ orderId: oid, current: status }); setNewStatus(status); }}><StatusBadge status={STATUS_COLORS[status] || "neutral"}>{status}</StatusBadge></button></td>
                    <td className="px-3 py-2.5 text-xs max-w-[150px] truncate">{String(order.billing_address || "—")}</td>
                    <td className="px-3 py-2.5 text-xs max-w-[150px] truncate">{String(order.shipping_address || "—")}</td>
                    <td className="px-3 py-2.5"><button onClick={() => { setPaymentModal({ orderId: oid, current: payment }); setNewPayment(payment); }}><StatusBadge status={payment === "Paid" ? "success" : "warning"}>{payment || "Unpaid"}</StatusBadge></button></td>
                    <td className="px-3 py-2.5 text-sm font-medium text-right">${Number(order.grand_total || 0).toFixed(2)}</td>
                    <td className="px-3 py-2.5"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(oid)}><Trash2 className="h-3 w-3 text-destructive/60" /></Button></td>
                  </tr>
                );
              })}
              {orders.length === 0 && <tr><td colSpan={8} className="px-3 py-12 text-center text-sm text-muted-foreground">No orders</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Status Modal */}
      <Dialog open={!!statusModal} onOpenChange={() => setStatusModal(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle className="text-base">Update Order Status</DialogTitle><DialogDescription className="text-xs">Order {statusModal?.orderId}</DialogDescription></DialogHeader>
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
            <option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option>
          </select>
          <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setStatusModal(null)}>Cancel</Button><Button size="sm" onClick={handleStatusUpdate} disabled={updateStatus.isPending}>{updateStatus.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Update"}</Button></div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={!!paymentModal} onOpenChange={() => setPaymentModal(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle className="text-base">Update Payment Status</DialogTitle><DialogDescription className="text-xs">Order {paymentModal?.orderId}</DialogDescription></DialogHeader>
          <select value={newPayment} onChange={(e) => setNewPayment(e.target.value)} className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
            <option>Unpaid</option><option>Paid</option><option>Refunded</option>
          </select>
          <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setPaymentModal(null)}>Cancel</Button><Button size="sm" onClick={handlePaymentUpdate} disabled={updatePayment.isPending}>{updatePayment.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Update"}</Button></div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
