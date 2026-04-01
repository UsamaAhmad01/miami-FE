"use client";

import { useRef } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useImportCart } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

interface ImportModalProps { open: boolean; onClose: () => void; }

export function ImportModal({ open, onClose }: ImportModalProps) {
  const { user } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const mutation = useImportCart();

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("Select a CSV file"); return; }
    const formData = new FormData();
    formData.append("csv_file", file);
    formData.append("user_id", String(user?.id || ""));
    try {
      const result = await mutation.mutateAsync(formData);
      // Store error stats if any
      if (Array.isArray(result) && result.length > 0) {
        localStorage.setItem("importErrors", JSON.stringify(result));
        toast.warning("Import completed with errors");
      } else {
        toast.success("Cart imported successfully");
      }
      onClose();
    } catch { toast.error("Failed to import"); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Import Cart (CSV)</DialogTitle>
          <DialogDescription className="text-xs">Format: UPC, Quantity, Warehouse (one per line)</DialogDescription>
        </DialogHeader>
        <input ref={fileRef} type="file" accept=".csv" className="text-sm" />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleUpload} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
