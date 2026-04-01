"use client";

import { useState, useRef } from "react";
import { Upload, Eye, Trash2, Download, Loader2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUploadTaxCert, useGetTaxCerts, useDeleteTaxCert } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

export function TaxCertManager() {
  const { user } = useAuthStore();
  const userId = user?.id || 0;
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadTaxCert();
  const deleteMutation = useDeleteTaxCert();
  const { data: certData, refetch } = useGetTaxCerts(userId);
  const certs = certData?.tax_files || [];

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("Select a file"); return; }
    const formData = new FormData();
    formData.append("user_id", String(userId));
    formData.append("tax_certificate_file", file);
    try {
      await uploadMutation.mutateAsync(formData);
      toast.success("Certificate uploaded");
      setUploadOpen(false);
      if (fileRef.current) fileRef.current.value = "";
    } catch { toast.error("Failed to upload"); }
  };

  const handleDelete = async (path: string) => {
    if (!confirm("Delete this certificate?")) return;
    try {
      await deleteMutation.mutateAsync({ taxPath: path, userId: String(userId) });
      toast.success("Certificate deleted");
      refetch();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}><Upload className="h-3.5 w-3.5 mr-1.5" />Upload Certificate</Button>
      <Button variant="outline" size="sm" onClick={() => { setViewOpen(true); refetch(); }}><Eye className="h-3.5 w-3.5 mr-1.5" />View Certificates</Button>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Upload Tax Certificate</DialogTitle><DialogDescription className="text-xs">Upload your resale tax certificate</DialogDescription></DialogHeader>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.png" className="text-sm" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleUpload} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Upload"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-base">Tax Certificates</DialogTitle><DialogDescription className="text-xs">Your uploaded certificates</DialogDescription></DialogHeader>
          {certs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No certificates uploaded</p>
          ) : (
            <div className="space-y-2">
              {certs.map((cert, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{cert.original_name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={cert.url} target="_blank" rel="noreferrer"><Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3 w-3" /></Button></a>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(cert.path)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
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
