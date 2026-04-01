"use client";

import { useState, useRef } from "react";
import { Upload, Download, Trash2, Plus, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useList3pDocuments, useUpload3pDocument, useAdd3pDocument, useDelete3pDocument } from "@/hooks/use-api";
import { toast } from "sonner";

function formatSize(bytes: number) { if (bytes < 1024) return bytes + " B"; if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"; return (bytes / (1024 * 1024)).toFixed(1) + " MB"; }

export default function ThreePRestrictionsPage() {
  const { data: documents, isLoading } = useList3pDocuments();
  const uploadDoc = useUpload3pDocument();
  const addDoc = useAdd3pDocument();
  const deleteDoc = useDelete3pDocument();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [mode, setMode] = useState<"replace" | "add">("add");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("Select a file"); return; }
    const formData = new FormData(); formData.append("file", file);
    try {
      if (mode === "replace") await uploadDoc.mutateAsync(formData); else await addDoc.mutateAsync(formData);
      toast.success("Document uploaded"); setUploadOpen(false);
    } catch { toast.error("Upload failed"); }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    try { await deleteDoc.mutateAsync({ name }); toast.success("Deleted"); } catch { toast.error("Failed"); }
  };

  return (
    <PageShell>
      <PageHeader title="3P Restrictions & MAP Pricing" description="Manage Amazon 3P restriction documents" actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setMode("replace"); setUploadOpen(true); }}><Upload className="h-3.5 w-3.5 mr-1.5" />Replace File</Button>
          <Button size="sm" onClick={() => { setMode("add"); setUploadOpen(true); }}><Plus className="h-3.5 w-3.5 mr-1.5" />Add New File</Button>
        </div>
      } />

      {isLoading ? <BrandedLoader variant="inline" text="Loading documents..." /> : (
        <div className="rounded-lg border bg-card">
          {(documents || []).length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No documents uploaded</div>
          ) : (
            <div className="divide-y">
              {(documents || []).map((doc, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3"><FileText className="h-4 w-4 text-muted-foreground" /><div><p className="text-sm font-medium">{doc.name}</p><p className="text-[10px] text-muted-foreground">{formatSize(doc.size)}</p></div></div>
                  <div className="flex gap-1">
                    <a href={doc.url} target="_blank" rel="noreferrer"><Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3 w-3" /></Button></a>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(doc.name)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-base">{mode === "replace" ? "Replace File" : "Add New File"}</DialogTitle><DialogDescription className="text-xs">{mode === "replace" ? "Replace an existing document" : "Upload a new document"}</DialogDescription></DialogHeader>
          <input ref={fileRef} type="file" className="text-sm" />
          <div className="flex justify-end gap-2 pt-2"><Button variant="outline" size="sm" onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={handleUpload} disabled={uploadDoc.isPending || addDoc.isPending}>{(uploadDoc.isPending || addDoc.isPending) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Upload"}</Button></div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
