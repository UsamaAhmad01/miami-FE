"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CreditCard, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/primitives/page-shell";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";
import { toast } from "sonner";

const ALLOWED_ROLES = ["Superadmin", "SiteOwner"];

const BENEFITS = [
  "Accept card payments through Stripe Terminal",
  "Process POS transactions",
  "Track payments and payouts",
  "Manage your business finances",
];

function StripeSetupContent() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const urlError = searchParams.get("error");

  // Role gate
  useEffect(() => {
    if (user && !ALLOWED_ROLES.includes(user.role)) {
      toast.error("Access Denied: Only Superadmin and Site Owner can setup Stripe.");
      router.push("/");
    }
  }, [user, router]);

  const startSetup = async () => {
    if (!user?.id || !user?.branch_id) {
      toast.error("Missing user or branch information. Please log in again.");
      router.push("/login");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post(`/stripe/onboarding/start/${user.branch_id}/`, {
        user_id: String(user.id),
      });

      if (response.data.success && response.data.onboarding_url) {
        window.location.href = response.data.onboarding_url;
      } else {
        toast.error(response.data.message || response.data.error || "Failed to start Stripe setup");
        setIsLoading(false);
      }
    } catch {
      toast.error("Failed to connect to server. Please try again.");
      setIsLoading(false);
    }
  };

  if (!user || !ALLOWED_ROLES.includes(user.role)) return null;

  return (
    <PageShell>
      <div className="flex items-center justify-center py-8">
        <div className="w-full max-w-lg">
          {/* Card */}
          <div className="rounded-2xl border bg-card p-8 shadow-elevated text-center">
            {/* Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 mx-auto mb-5">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold tracking-tight">Stripe Account Setup Required</h1>

            {/* Error banner */}
            {urlError && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {urlError}
              </div>
            )}

            {/* Description */}
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              The branch <span className="font-semibold text-foreground">{user.branch_name || "Your Branch"}</span> needs
              a Stripe Connected Account to process payments. As a <span className="font-semibold text-foreground">{user.role}</span>,
              you can set this up now.
            </p>

            {/* Benefits */}
            <div className="mt-6 rounded-lg border bg-blue-500/5 border-blue-500/20 p-4 text-left">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-3">With Stripe Connect you can:</p>
              <div className="space-y-2">
                {BENEFITS.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="text-sm text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 mt-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Starting Stripe onboarding...</p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 mt-8">
                <Button variant="outline" onClick={() => router.push("/")}>
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Back to Dashboard
                </Button>
                <Button onClick={startSetup} className="gradient-primary text-white border-0 shadow-soft">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Start Stripe Setup
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default function StripeSetupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    }>
      <StripeSetupContent />
    </Suspense>
  );
}
