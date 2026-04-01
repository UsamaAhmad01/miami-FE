"use client";

import { useState, useRef } from "react";
import { Upload, Eye, Trash2, Download, Loader2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUploadInvoice, useGetInvoices, useDeleteInvoice } from "@/hooks/use-api";
import { toast } from "sonner";

interface InvoiceManagerProps {
  orderId: string;
}

export function InvoiceManager({ orderId }: InvoiceManagerProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadInvoice();
  const deleteMutation = useDeleteInvoice();
  const { data: invoiceData, refetch } = useGetInvoices(orderId);
  const invoices = invoiceData?.invoices || [];

  const handleUpload = async () => {
    const files = fileRef.current?.files;
    if (!files || files.length === 0) { toast.error("Select files to upload"); return; }
    const formData = new FormData();
    formData.append("order_id", orderId);
    Array.from(files).forEach((f) => formData.append("files", f));
    try {
      await uploadMutation.mutateAsync(formData);
      toast.success("Invoice uploaded");
      setUploadOpen(false);
      if (fileRef.current) fileRef.current.value = "";
    } catch { toast.error("Failed to upload"); }
  };

  const handleDelete = async (path: string) => {
    if (!confirm("Delete this invoice?")) return;
    try {
      await deleteMutation.mutateAsync({ invoicePath: path, orderId });
      toast.success("Invoice deleted");
      refetch();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <>
      {/* Trigger buttons */}
      <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}><Upload className="h-3.5 w-3.5 mr-1.5" />Upload Invoice</Button>
      <Button variant="outline" size="sm" onClick={() => { setViewOpen(true); refetch(); }}><Eye className="h-3.5 w-3.5 mr-1.5" />View Invoices</Button>

      {/* Upload Modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Upload Invoice</DialogTitle>
            <DialogDescription className="text-xs">Upload invoice files for order {orderId}</DialogDescription>
          </DialogHeader>
          <input ref={fileRef} type="file" multiple className="text-sm" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleUpload} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Upload"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Invoices</DialogTitle>
            <DialogDescription className="text-xs">Uploaded invoices for order {orderId}</DialogDescription>
          </DialogHeader>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No invoices uploaded</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{inv.original_name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={inv.url} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3 w-3" /></Button>
                    </a>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(inv.path)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
