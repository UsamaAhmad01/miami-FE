"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBulkDelete, useBulkUpdateStatus, useBulkUpdatePaymentStatus, useBulkAddNotes, useBulkEmail } from "@/hooks/use-api";
import { toast } from "sonner";

interface BaseProps {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
}

// Delete
export function BulkDeleteModal({ open, onClose, selectedIds }: BaseProps & { onSuccess: () => void }) {
  const mutation = useBulkDelete();
  const handleConfirm = async () => {
    try {
      await mutation.mutateAsync(selectedIds.join(","));
      toast.success(`${selectedIds.length} ticket(s) deleted`);
      onClose();
    } catch { toast.error("Failed to delete tickets"); }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />Delete Tickets</DialogTitle>
          <DialogDescription className="text-xs">Are you sure you want to delete {selectedIds.length} ticket{selectedIds.length > 1 ? "s" : ""}? This cannot be undone.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={handleConfirm} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Status
export function BulkStatusModal({ open, onClose, selectedIds }: BaseProps) {
  const [status, setStatus] = useState("Pending");
  const mutation = useBulkUpdateStatus();
  const handleConfirm = async () => {
    try {
      await mutation.mutateAsync({ ticketIds: selectedIds.join(","), status });
      toast.success(`Status updated to ${status}`);
      onClose();
    } catch { toast.error("Failed to update status"); }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base">Update Status</DialogTitle>
          <DialogDescription className="text-xs">Change status for {selectedIds.length} ticket{selectedIds.length > 1 ? "s" : ""}</DialogDescription>
        </DialogHeader>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
          <option>Pending</option><option>Cancelled</option><option>Completed</option>
        </select>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleConfirm} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Payment Status
export function BulkPaymentModal({ open, onClose, selectedIds }: BaseProps) {
  const [status, setStatus] = useState("Unpaid");
  const mutation = useBulkUpdatePaymentStatus();
  const handleConfirm = async () => {
    try {
      await mutation.mutateAsync({ ticketIds: selectedIds.join(","), status });
      toast.success("Payment status updated");
      onClose();
    } catch { toast.error("Failed to update payment status"); }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base">Update Payment Status</DialogTitle>
          <DialogDescription className="text-xs">Change payment status for {selectedIds.length} ticket{selectedIds.length > 1 ? "s" : ""}</DialogDescription>
        </DialogHeader>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
          <option>Unpaid</option><option value="partially_paid">Partially Paid</option><option value="fully_paid">Fully Paid</option><option>Paid</option><option>Refunded</option>
        </select>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleConfirm} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Notes
export function BulkNotesModal({ open, onClose, selectedIds }: BaseProps) {
  const [note, setNote] = useState("");
  const mutation = useBulkAddNotes();
  const handleConfirm = async () => {
    try {
      await mutation.mutateAsync({ ticketIds: selectedIds.join(","), note });
      toast.success("Notes added");
      setNote("");
      onClose();
    } catch { toast.error("Failed to add notes"); }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Add Notes</DialogTitle>
          <DialogDescription className="text-xs">Add a note to {selectedIds.length} ticket{selectedIds.length > 1 ? "s" : ""}</DialogDescription>
        </DialogHeader>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Enter note..." rows={3} className="flex w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!note.trim() || mutation.isPending} onClick={handleConfirm}>
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Email
export function BulkEmailModal({ open, onClose, selectedIds }: BaseProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const mutation = useBulkEmail();
  const handleConfirm = async () => {
    const formData = new FormData();
    formData.append("recipient", JSON.stringify(selectedIds));
    formData.append("subject", subject);
    formData.append("message", body);
    try {
      await mutation.mutateAsync(formData);
      toast.success("Email sent");
      setSubject(""); setBody("");
      onClose();
    } catch { toast.error("Failed to send email"); }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Send Email</DialogTitle>
          <DialogDescription className="text-xs">Email {selectedIds.length} customer{selectedIds.length > 1 ? "s" : ""}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" className="mt-1 h-9 text-sm" /></div>
          <div><Label className="text-xs">Message</Label><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Email body..." rows={4} className="mt-1 flex w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" /></div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!subject.trim() || !body.trim() || mutation.isPending} onClick={handleConfirm}>
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
