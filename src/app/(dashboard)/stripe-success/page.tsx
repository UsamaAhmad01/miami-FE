"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, Landmark, Loader2, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/primitives/page-shell";
import { StatusBadge } from "@/components/primitives/status-badge";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";

interface Capabilities {
  charges_enabled: boolean;
  payouts_enabled: boolean;
}

export default function StripeSuccessPage() {
  const { user } = useAuthStore();
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.branch_id) {
      setLoading(false);
      return;
    }

    api.get(`/stripe/onboarding/status/${user.branch_id}/`)
      .then((res) => {
        const caps = res.data?.onboarding_status?.capabilities;
        if (caps) setCapabilities(caps);
      })
      .catch(() => {
        // Silently fail — page still works without capabilities
      })
      .finally(() => setLoading(false));
  }, [user?.branch_id]);

  const branchName = user?.branch_name || "your branch";

  return (
    <PageShell>
      <div className="flex items-center justify-center py-8">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border bg-card p-8 shadow-elevated text-center">
            {/* Success icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mx-auto mb-5">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold tracking-tight">Setup Complete!</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Your Stripe Connected Account has been successfully set up for <span className="font-semibold text-foreground">{branchName}</span>.
            </p>

            {/* Success banner */}
            <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-left">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Ready for Payment Processing!</p>
              <p className="text-xs text-muted-foreground mt-1">
                You can now create POS terminals and accept card payments with automatic platform fee collection.
              </p>
            </div>

            {/* Capabilities */}
            {loading ? (
              <div className="flex items-center justify-center gap-2 mt-6 py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Checking account status...</span>
              </div>
            ) : capabilities ? (
              <div className="grid grid-cols-2 gap-3 mt-6">
                <CapabilityBox
                  icon={CreditCard}
                  label="Payment Processing"
                  enabled={capabilities.charges_enabled}
                />
                <CapabilityBox
                  icon={Landmark}
                  label="Payouts"
                  enabled={capabilities.payouts_enabled}
                />
              </div>
            ) : null}

            {/* CTA */}
            <div className="mt-8">
              <Link href={`/pos${user?.branch_id ? `?branch_id=${user.branch_id}` : ""}`}>
                <Button className="gradient-primary text-white border-0 shadow-soft">
                  <Monitor className="h-4 w-4 mr-2" />
                  Create POS Terminal
                </Button>
              </Link>
            </div>

            <p className="text-[11px] text-muted-foreground/50 mt-4">
              Setup completed successfully
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function CapabilityBox({ icon: Icon, label, enabled }: { icon: typeof CreditCard; label: string; enabled: boolean }) {
  return (
    <div className="rounded-lg border p-4 text-center">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg mx-auto mb-2 ${
        enabled ? "bg-emerald-500/10" : "bg-amber-500/10"
      }`}>
        <Icon className={`h-5 w-5 ${enabled ? "text-emerald-500" : "text-amber-500"}`} />
      </div>
      <p className="text-xs font-medium mb-1.5">{label}</p>
      <StatusBadge status={enabled ? "success" : "warning"}>
        {enabled ? "Enabled" : "Pending"}
      </StatusBadge>
    </div>
  );
}
