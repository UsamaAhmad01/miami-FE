"use client";

import { useState, useRef } from "react";
import { Loader2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { useSubmitSupportTicket } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

export default function SupportPage() {
  const { user } = useAuthStore();
  const mutation = useSubmitSupportTicket();
  const [name, setName] = useState(user?.first_name || "");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) { toast.error("All fields required"); return; }
    const formData = new FormData();
    formData.append("name", name); formData.append("email", email); formData.append("subject", subject); formData.append("message", message); formData.append("user_id", String(user?.id || ""));
    if (fileRef.current?.files?.[0]) formData.append("screenshot", fileRef.current.files[0]);
    try { await mutation.mutateAsync(formData); toast.success("Support ticket submitted!"); setSubject(""); setMessage(""); } catch { toast.error("Failed to submit"); }
  };

  return (
    <PageShell>
      <PageHeader title="Help & Support" description="Submit a bug report or support request" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Full Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Email *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-9 text-sm" /></div>
            </div>
            <div><Label className="text-xs">Subject *</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 h-9 text-sm" /></div>
            <div><Label className="text-xs">Message *</Label><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="mt-1 flex w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" /></div>
            <div><Label className="text-xs">Screenshot (optional)</Label><input ref={fileRef} type="file" accept="image/*" className="mt-1 text-sm" /></div>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Submit Ticket</Button>
          </form>
        </div>
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Contact Us</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground uppercase">Hotline</p><p className="text-sm font-medium">786-942-0721</p></div></div>
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground uppercase">Email</p><p className="text-sm font-medium">sales@miami-bikes.com</p></div></div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
