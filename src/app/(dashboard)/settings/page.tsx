"use client";

import { Building2, CreditCard, DollarSign, Shield, Users } from "lucide-react";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { SectionHeader } from "@/components/primitives/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/primitives/status-badge";

export default function SettingsPage() {
  return (
    <PageShell>
      <PageHeader title="Settings" description="Branch settings, pricing, and integrations" />

      {/* Branch Info */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <SectionHeader title="Branch Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label className="text-xs">Branch Name</Label><Input defaultValue="Miami Main" className="mt-1" /></div>
          <div><Label className="text-xs">Phone</Label><Input defaultValue="(305) 555-0100" className="mt-1" /></div>
          <div><Label className="text-xs">Address</Label><Input defaultValue="1234 Ocean Drive, Miami Beach, FL 33139" className="mt-1" /></div>
          <div><Label className="text-xs">Email</Label><Input defaultValue="info@miamibikes.com" className="mt-1" /></div>
        </div>
        <Button size="sm">Save Changes</Button>
      </div>

      {/* Pricing */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <SectionHeader title="Pricing & Tax" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><Label className="text-xs">Tax Rate (%)</Label><Input type="number" defaultValue="7.0" className="mt-1" /></div>
          <div><Label className="text-xs">Service Charge (%)</Label><Input type="number" defaultValue="0" className="mt-1" /></div>
          <div><Label className="text-xs">Shipping Default ($)</Label><Input type="number" defaultValue="15.00" className="mt-1" /></div>
        </div>
        <Button size="sm">Update Pricing</Button>
      </div>

      {/* Stripe */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader title="Stripe Connect" />
          <StatusBadge status="success">Connected</StatusBadge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Account Status</p>
            <p className="font-medium mt-0.5">Active — Payments Enabled</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Terminal</p>
            <p className="font-medium mt-0.5">Verifone P400 — Connected</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">Open Stripe Dashboard</Button>
          <Button size="sm" variant="outline">Register Terminal</Button>
        </div>
      </div>

      {/* Team */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <SectionHeader title="Team Members" action={<Button size="sm" variant="outline">Add Member</Button>} />
        <div className="space-y-2">
          {[
            { name: "Marco Silva", role: "Technician", status: "active" },
            { name: "Alex Torres", role: "Technician", status: "active" },
            { name: "Jordan Lee", role: "Technician", status: "active" },
          ].map((member) => (
            <div key={member.name} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
              <StatusBadge status="success">{member.status}</StatusBadge>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
