"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBulkUpdateStatus } from "@/hooks/use-api";
import { toast } from "sonner";

interface StatusUpdateModalProps {
  invoice: string | null;
  onClose: () => void;
}

const STATUSES = ["Pending", "Cancelled", "Completed"] as const;

export function StatusUpdateModal({ invoice, onClose }: StatusUpdateModalProps) {
  const [status, setStatus] = useState<string>("Pending");
  const mutation = useBulkUpdateStatus();

  const handleUpdate = async () => {
    if (!invoice) return;
    try {
      await mutation.mutateAsync({ ticketIds: invoice, status });
      toast.success(`Ticket ${invoice} updated to ${status}`);
      onClose();
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <Dialog open={!!invoice} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Update Status</DialogTitle>
          <DialogDescription className="text-xs">
            Change status for ticket #{invoice}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <label className="text-xs font-medium">New Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleUpdate} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
