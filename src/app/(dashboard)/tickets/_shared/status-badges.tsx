"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/primitives/status-badge";
import { useBulkUpdateStatus, useBulkUpdatePaymentStatus } from "@/hooks/use-api";
import { toast } from "sonner";

const TICKET_STATUSES = ["Pending", "In Progress", "Ready for Pickup", "Completed", "Cancelled"] as const;
const PAYMENT_STATUSES = ["Unpaid", "Partial", "Paid", "Refunded"] as const;

const statusColorMap: Record<string, "info" | "warning" | "success" | "error" | "neutral"> = {
  Pending: "warning",
  "In Progress": "info",
  "Ready for Pickup": "info",
  Completed: "success",
  Cancelled: "error",
  Unpaid: "error",
  Partial: "warning",
  Paid: "success",
  Refunded: "info",
};

interface TicketStatusBadgesProps {
  ticketStatus: string;
  paymentStatus: string;
  invoiceNumber: string;
  onStatusChange: (newStatus: string) => void;
  onPaymentStatusChange: (newStatus: string) => void;
}

export function TicketStatusBadges({ ticketStatus, paymentStatus, invoiceNumber, onStatusChange, onPaymentStatusChange }: TicketStatusBadgesProps) {
  const [statusModal, setStatusModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [newStatus, setNewStatus] = useState(ticketStatus);
  const [newPaymentStatus, setNewPaymentStatus] = useState(paymentStatus);

  const statusMutation = useBulkUpdateStatus();
  const paymentMutation = useBulkUpdatePaymentStatus();

  const handleStatusUpdate = async () => {
    try {
      const result = await statusMutation.mutateAsync({ ticketIds: invoiceNumber, status: newStatus });
      onStatusChange(newStatus);
      toast.success(`Status updated to ${newStatus}`);
      // Check for SMS failures (backend sends SMS on status change)
      if (result?.sms_error_message || result?.sms_errors?.length > 0) {
        setTimeout(() => toast.warning(result.sms_error_message || "SMS notification failed to send"), 2000);
      }
      setStatusModal(false);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handlePaymentUpdate = async () => {
    try {
      await paymentMutation.mutateAsync({ ticketIds: invoiceNumber, status: newPaymentStatus });
      onPaymentStatusChange(newPaymentStatus);
      toast.success(`Payment status updated to ${newPaymentStatus}`);
      setPaymentModal(false);
    } catch {
      toast.error("Failed to update payment status");
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button onClick={() => { setNewStatus(ticketStatus); setStatusModal(true); }}>
          <StatusBadge status={statusColorMap[ticketStatus] || "neutral"}>{ticketStatus}</StatusBadge>
        </button>
        <button onClick={() => { setNewPaymentStatus(paymentStatus); setPaymentModal(true); }}>
          <StatusBadge status={statusColorMap[paymentStatus] || "neutral"}>{paymentStatus}</StatusBadge>
        </button>
        <span className="text-xs text-muted-foreground font-mono ml-1">{invoiceNumber}</span>
      </div>

      {/* Status Modal */}
      <Dialog open={statusModal} onOpenChange={setStatusModal}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">Update Status</DialogTitle>
            <DialogDescription className="text-xs">Change ticket status for #{invoiceNumber}</DialogDescription>
          </DialogHeader>
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
            {TICKET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setStatusModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleStatusUpdate} disabled={statusMutation.isPending}>
              {statusMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Status Modal */}
      <Dialog open={paymentModal} onOpenChange={setPaymentModal}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">Update Payment Status</DialogTitle>
            <DialogDescription className="text-xs">Change payment status for #{invoiceNumber}</DialogDescription>
          </DialogHeader>
          <select value={newPaymentStatus} onChange={(e) => setNewPaymentStatus(e.target.value)} className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setPaymentModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handlePaymentUpdate} disabled={paymentMutation.isPending}>
              {paymentMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
