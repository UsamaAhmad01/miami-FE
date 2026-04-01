"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, Mail, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { KpiCard } from "@/components/primitives/kpi-card";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useAuthStore } from "@/stores/auth-store";
import { useBulkEmailLists, useUploadBulkEmailList, useDeleteBulkEmailLists, useSendBulkEmailToLists } from "@/hooks/use-api";
import { toast } from "sonner";

export default function BulkEmailPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?.id || 0;
  const { data: lists, isLoading } = useBulkEmailLists(userId);
  const uploadMutation = useUploadBulkEmailList();
  const deleteMutation = useDeleteBulkEmailLists();
  const sendMutation = useSendBulkEmailToLists();

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const allLists = lists || [];
  const totalContacts = allLists.reduce((s, l) => s + l.total_customers, 0);
  const allSelected = allLists.length > 0 && allLists.every((l) => selectedRows.has(l.id));

  const toggleRow = (id: number) => setSelectedRows((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelectedRows(allSelected ? new Set() : new Set(allLists.map((l) => l.id)));

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("Select a CSV file"); return; }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("file_name", file.name);
    formData.append("user_id", String(userId));
    try { await uploadMutation.mutateAsync(formData); toast.success("List uploaded"); setImportOpen(false); } catch { toast.error("Upload failed"); }
  };

  const handleDelete = async () => {
    if (selectedRows.size === 0) { toast.error("Select lists to delete"); return; }
    try { await deleteMutation.mutateAsync({ idarray: Array.from(selectedRows), userId: String(userId) }); toast.success("Lists deleted"); setSelectedRows(new Set()); } catch { toast.error("Delete failed"); }
  };

  const handleSendEmail = async () => {
    if (selectedRows.size === 0) { toast.error("Select lists first"); return; }
    if (!emailSubject.trim()) { toast.error("Subject required"); return; }
    const formData = new FormData();
    formData.append("subject", emailSubject);
    formData.append("emailContent", emailBody);
    formData.append("selectedIds", JSON.stringify(Array.from(selectedRows)));
    try { await sendMutation.mutateAsync(formData); toast.success("Emails sent!"); setEmailOpen(false); setEmailSubject(""); setEmailBody(""); } catch { toast.error("Failed to send"); }
  };

  return (
    <PageShell>
      <PageHeader title="Bulk Email" description="Manage contact lists and campaigns" actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Upload className="h-3.5 w-3.5 mr-1.5" />Import List</Button>
          {selectedRows.size > 0 && <>
            <Button variant="outline" size="sm" onClick={handleDelete}><Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete ({selectedRows.size})</Button>
            <Button size="sm" onClick={() => setEmailOpen(true)}><Mail className="h-3.5 w-3.5 mr-1.5" />Send Email</Button>
          </>}
        </div>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard title="Total Lists" value={String(allLists.length)} icon={Users} />
        <KpiCard title="Total Contacts" value={String(totalContacts)} icon={Mail} />
        <KpiCard title="Selected" value={String(selectedRows.size)} icon={Users} />
      </div>

      {isLoading ? <BrandedLoader variant="inline" text="Loading lists..." /> : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b">
              <th className="w-10 px-3 py-2.5"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-3.5 w-3.5 rounded accent-primary" /></th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">List Name</th>
              <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2.5">Leads</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Created</th>
            </tr></thead>
            <tbody>
              {allLists.map((list) => (
                <tr key={list.id} className={`border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors ${selectedRows.has(list.id) ? "bg-primary/5" : ""}`}>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedRows.has(list.id)} onChange={() => toggleRow(list.id)} className="h-3.5 w-3.5 rounded accent-primary" /></td>
                  <td className="px-3 py-2.5 text-sm font-medium text-primary hover:underline" onClick={() => router.push(`/bulk-email/${list.id}`)}>{list.ListName}</td>
                  <td className="px-3 py-2.5 text-sm text-right">{list.total_customers}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{list.created_on}</td>
                </tr>
              ))}
              {allLists.length === 0 && <tr><td colSpan={4} className="px-3 py-12 text-center text-sm text-muted-foreground">No email lists</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Import Modal */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Import List (CSV)</DialogTitle><DialogDescription className="text-xs">Upload a CSV file with contacts</DialogDescription></DialogHeader>
          <input ref={fileRef} type="file" accept=".csv" className="text-sm" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleUpload} disabled={uploadMutation.isPending}>{uploadMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Upload"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-base">Send Email to Lists</DialogTitle><DialogDescription className="text-xs">Sending to {selectedRows.size} list(s)</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Subject</Label><Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="mt-1 h-9 text-sm" /></div>
            <div><Label className="text-xs">Body</Label><textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={6} className="mt-1 flex w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEmailOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSendEmail} disabled={sendMutation.isPending}>{sendMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
