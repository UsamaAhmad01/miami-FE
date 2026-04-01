"use client";

import { ArrowRight, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTransferHistory } from "@/hooks/use-api";
import { BrandedLoader } from "@/components/brand/branded-loader";

interface HistoryModalProps { open: boolean; onClose: () => void; partNumber: string; }

export function HistoryModal({ open, onClose, partNumber }: HistoryModalProps) {
  const { data: history, isLoading, isError } = useTransferHistory(partNumber);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Transfer History</DialogTitle>
          <DialogDescription className="text-xs font-mono">{partNumber}</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <BrandedLoader variant="inline" text="Loading history..." />
        ) : isError || !history?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">No history found</p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 rounded-md border p-3 text-xs">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">
                    {h.quantity_transferred} units: {h.source_location} <ArrowRight className="h-3 w-3 inline mx-1" /> {h.destination_location}
                  </p>
                  <p className="text-muted-foreground mt-0.5">{new Date(h.transferred_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
