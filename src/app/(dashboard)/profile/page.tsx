"use client";

import { useState } from "react";
import { Pencil, Lock, User, Phone, Mail, MapPin, Building2, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useViewBranchUser } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { EditProfileModal } from "./_components/edit-profile-modal";
import { ChangePasswordModal } from "./_components/change-password-modal";
import { TaxCertManager } from "./_components/tax-cert-manager";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useViewBranchUser(user?.id || 0);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  if (isLoading) return <BrandedLoader variant="page" text="Loading profile..." />;
  if (!profile) return <PageShell><div className="text-center py-12 text-sm text-muted-foreground">Profile not found</div></PageShell>;

  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "—";

  return (
    <PageShell>
      <PageHeader
        title="Profile"
        description="Your account information"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Pencil className="h-3.5 w-3.5 mr-1.5" />Edit Profile</Button>
            <Button variant="outline" size="sm" onClick={() => setPasswordOpen(true)}><Lock className="h-3.5 w-3.5 mr-1.5" />Change Password</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Personal Info */}
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Personal Information</h3>
          <div className="space-y-3">
            <InfoRow icon={User} label="Full Name" value={fullName} />
            <InfoRow icon={Phone} label="Phone" value={String(profile.phone_number || "—")} />
            <InfoRow icon={Phone} label="Phone 2" value={String(profile.phone_number_2 || "Not provided")} />
            <InfoRow icon={Mail} label="Email" value={String(profile.email || "—")} />
          </div>
        </div>

        {/* Address */}
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Address</h3>
          <div className="space-y-3">
            <InfoRow icon={MapPin} label="Address 1" value={String(profile.address_1 || "—")} />
            <InfoRow icon={MapPin} label="Address 2" value={String(profile.address_2 || "—")} />
            <InfoRow icon={MapPin} label="City" value={String(profile.city || "—")} />
            <InfoRow icon={MapPin} label="State" value={String(profile.state || "—")} />
            <InfoRow icon={MapPin} label="ZIP" value={String(profile.zip || "—")} />
          </div>
        </div>

        {/* Business Info */}
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Business Information</h3>
          <div className="space-y-3">
            <InfoRow icon={Building2} label="Company" value={String(profile.company_name || "Not provided")} />
            <InfoRow icon={ShieldCheck} label="Amazon Account" value={String(profile.amazon_account_name || "—")} />
            <InfoRow icon={FileText} label="Resale Tax #" value={String(profile.rs_tax || "—")} />
          </div>
        </div>

        {/* Tax Certificates */}
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Tax Certificates</h3>
          <div className="flex items-center gap-2">
            <TaxCertManager />
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} profile={profile} />
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </PageShell>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm mt-0.5">{value}</p>
      </div>
    </div>
  );
}
