"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Upload, Trash2, Mail, Pencil, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useAuthStore } from "@/stores/auth-store";
import { useBulkEmailCustomers, useAddBulkEmailEntry, useEditBulkEmailListName, useUploadBulkEmailCsv, useDeleteBulkEmailRecords, useSendEmailToCustomers } from "@/hooks/use-api";
import { toast } from "sonner";

export default function BulkEmailListDetailPage() {
  const { listId } = useParams();
  const lid = Number(listId);
  const { user } = useAuthStore();
  const userId = String(user?.id || "");
  const { data: customerData, isLoading } = useBulkEmailCustomers(lid);
  const customers = customerData?.data || [];
  const listName = customerData?.list_name || `List #${lid}`;

  const addEntry = useAddBulkEmailEntry();
  const editName = useEditBulkEmailListName();
  const uploadCsv = useUploadBulkEmailCsv();
  const deleteRecords = useDeleteBulkEmailRecords();
  const sendEmail = useSendEmailToCustomers();

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [addForm, setAddForm] = useState({ name: "", firstName: "", lastName: "", company: "", email: "" });
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!displayName && listName) setDisplayName(listName);

  const allSelected = customers.length > 0 && customers.every((c) => selectedRows.has(c.id));
  const toggleRow = (id: number) => setSelectedRows((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelectedRows(allSelected ? new Set() : new Set(customers.map((c) => c.id)));

  const handleAddEntry = async () => {
    const formData = new FormData();
    formData.append("list_id", String(lid));
    formData.append("user_id", userId);
    Object.entries(addForm).forEach(([k, v]) => formData.append(k, v));
    try { await addEntry.mutateAsync(formData); toast.success("Entry added"); setAddOpen(false); setAddForm({ name: "", firstName: "", lastName: "", company: "", email: "" }); } catch { toast.error("Failed"); }
  };

  const handleEditName = async () => {
    if (!newName.trim()) return;
    const formData = new FormData();
    formData.append("list_id", String(lid));
    formData.append("user_id", userId);
    formData.append("new_name", newName);
    try { await editName.mutateAsync(formData); setDisplayName(newName); toast.success("Name updated"); setNameOpen(false); } catch { toast.error("Failed"); }
  };

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("csv_file", file);
    formData.append("user_id", userId);
    try { await uploadCsv.mutateAsync(formData); toast.success("CSV imported"); setImportOpen(false); } catch { toast.error("Failed"); }
  };

  const handleDelete = async () => {
    if (selectedRows.size === 0) return;
    try { await deleteRecords.mutateAsync({ idarray: Array.from(selectedRows), userId }); toast.success("Records deleted"); setSelectedRows(new Set()); } catch { toast.error("Failed"); }
  };

  const handleSendEmail = async () => {
    if (selectedRows.size === 0) { toast.error("Select customers"); return; }
    const formData = new FormData();
    formData.append("subject", emailSubject);
    formData.append("emailContent", emailBody);
    formData.append("selectedIds", JSON.stringify(Array.from(selectedRows)));
    try { await sendEmail.mutateAsync(formData); toast.success("Emails sent!"); setEmailOpen(false); } catch { toast.error("Failed"); }
  };

  return (
    <PageShell>
      <PageHeader title={displayName} description={`${customers.length} contacts`} actions={
        <div className="flex items-center gap-2">
          <Link href="/bulk-email"><Button variant="outline" size="sm"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Back</Button></Link>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}><Plus className="h-3.5 w-3.5 mr-1.5" />Add</Button>
          <Button variant="outline" size="sm" onClick={() => { setNewName(displayName); setNameOpen(true); }}><Pencil className="h-3.5 w-3.5 mr-1.5" />Rename</Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Upload className="h-3.5 w-3.5 mr-1.5" />Import</Button>
          {selectedRows.size > 0 && <>
            <Button variant="outline" size="sm" onClick={handleDelete}><Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete ({selectedRows.size})</Button>
            <Button size="sm" onClick={() => setEmailOpen(true)}><Mail className="h-3.5 w-3.5 mr-1.5" />Email</Button>
          </>}
        </div>
      } />

      {isLoading ? <BrandedLoader variant="inline" text="Loading contacts..." /> : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b">
              <th className="w-10 px-3 py-2.5"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-3.5 w-3.5 rounded accent-primary" /></th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">First Name</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Last Name</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Company</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Email</th>
            </tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${selectedRows.has(c.id) ? "bg-primary/5" : ""}`}>
                  <td className="px-3 py-2.5"><input type="checkbox" checked={selectedRows.has(c.id)} onChange={() => toggleRow(c.id)} className="h-3.5 w-3.5 rounded accent-primary" /></td>
                  <td className="px-3 py-2.5 text-sm">{c.FirstName}</td>
                  <td className="px-3 py-2.5 text-sm">{c.LastName}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{c.CompanyName || "—"}</td>
                  <td className="px-3 py-2.5 text-sm">{c.Email}</td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan={5} className="px-3 py-12 text-center text-sm text-muted-foreground">No contacts in this list</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Entry Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Add Contact</DialogTitle><DialogDescription className="text-xs">Add a single entry</DialogDescription></DialogHeader>
          <div className="space-y-3">
            {(["name", "firstName", "lastName", "company", "email"] as const).map((k) => (
              <div key={k}><Label className="text-xs capitalize">{k.replace(/([A-Z])/g, " $1")}</Label><Input value={addForm[k]} onChange={(e) => setAddForm((p) => ({ ...p, [k]: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button><Button size="sm" onClick={handleAddEntry} disabled={addEntry.isPending}>{addEntry.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}</Button></div>
        </DialogContent>
      </Dialog>

      {/* Edit Name Modal */}
      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle className="text-base">Edit List Name</DialogTitle><DialogDescription className="text-xs">Change the name of this list</DialogDescription></DialogHeader>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="h-9 text-sm" />
          <div className="flex justify-end gap-2 pt-2"><Button variant="outline" size="sm" onClick={() => setNameOpen(false)}>Cancel</Button><Button size="sm" onClick={handleEditName} disabled={editName.isPending}>Update</Button></div>
        </DialogContent>
      </Dialog>

      {/* Import Modal */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Import Contacts (CSV)</DialogTitle><DialogDescription className="text-xs">Upload contacts to this list</DialogDescription></DialogHeader>
          <input ref={fileRef} type="file" accept=".csv" className="text-sm" />
          <div className="flex justify-end gap-2 pt-2"><Button variant="outline" size="sm" onClick={() => setImportOpen(false)}>Cancel</Button><Button size="sm" onClick={handleImport} disabled={uploadCsv.isPending}>{uploadCsv.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Upload"}</Button></div>
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-base">Send Email</DialogTitle><DialogDescription className="text-xs">Email {selectedRows.size} contact(s)</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Subject</Label><Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="mt-1 h-9 text-sm" /></div>
            <div><Label className="text-xs">Body</Label><textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={6} className="mt-1 flex w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="outline" size="sm" onClick={() => setEmailOpen(false)}>Cancel</Button><Button size="sm" onClick={handleSendEmail} disabled={sendEmail.isPending}>{sendEmail.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send"}</Button></div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
