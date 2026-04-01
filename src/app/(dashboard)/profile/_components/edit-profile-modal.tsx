"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateCustomer } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: Record<string, unknown>;
}

export function EditProfileModal({ open, onClose, profile }: EditProfileModalProps) {
  const { user } = useAuthStore();
  const mutation = useUpdateCustomer();
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: String(profile.first_name || ""),
        last_name: String(profile.last_name || ""),
        amazon_account_name: String(profile.amazon_account_name || ""),
        company_name: String(profile.company_name || ""),
        email: String(profile.email || ""),
        address_1: String(profile.address_1 || ""),
        address_2: String(profile.address_2 || ""),
        phone_number: String(profile.phone_number || ""),
        phone_number_2: String(profile.phone_number_2 || ""),
        city: String(profile.city || ""),
        state: String(profile.state || ""),
        zip: String(profile.zip || ""),
        rs_tax: String(profile.rs_tax || ""),
      });
    }
  }, [profile]);

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    if (!form.company_name?.trim()) { toast.error("Company name is required"); return; }
    if (!form.phone_number?.trim()) { toast.error("Phone number is required"); return; }
    try {
      await mutation.mutateAsync({ user_id: String(user?.id || ""), ...form });
      toast.success("Profile updated");
      onClose();
    } catch { toast.error("Failed to update profile"); }
  };

  const fields: Array<{ key: string; label: string; span?: boolean }> = [
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "company_name", label: "Company Name *" },
    { key: "amazon_account_name", label: "Amazon Account" },
    { key: "email", label: "Email" },
    { key: "phone_number", label: "Phone *" },
    { key: "phone_number_2", label: "Phone 2" },
    { key: "address_1", label: "Address 1", span: true },
    { key: "address_2", label: "Address 2", span: true },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "zip", label: "ZIP" },
    { key: "rs_tax", label: "Resale Tax #" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Edit Profile</DialogTitle>
          <DialogDescription className="text-xs">Update your account information</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.key} className={f.span ? "col-span-2" : ""}>
              <Label className="text-xs">{f.label}</Label>
              <Input value={form[f.key] || ""} onChange={(e) => update(f.key, e.target.value)} className="mt-1 h-8 text-sm" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
