"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { usePricing, useUpdatePricing } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

export default function PricingPage() {
  const { user } = useAuthStore();
  const branchId = user?.branch_id || 0;
  const { data: pricing, isLoading } = usePricing(branchId);
  const updatePricing = useUpdatePricing();

  const [tax, setTax] = useState("");
  const [fee, setFee] = useState("");

  useEffect(() => {
    if (pricing) { setTax(String(pricing.tax)); setFee(String(pricing.service_charge)); }
  }, [pricing]);

  const handleSave = async () => {
    try {
      await updatePricing.mutateAsync({ branchId, tax: parseFloat(tax) || 0, service_charge: parseFloat(fee) || 0 });
      toast.success("Pricing updated");
    } catch { toast.error("Failed to update"); }
  };

  if (isLoading) return <BrandedLoader variant="page" text="Loading pricing..." />;

  return (
    <PageShell>
      <PageHeader title="Pricing Configuration" description="Branch tax rate and processing fee" />
      <div className="rounded-lg border bg-card p-5 max-w-md space-y-4">
        <div><Label className="text-xs">Tax Rate (%)</Label><Input type="number" step="0.1" value={tax} onChange={(e) => setTax(e.target.value)} className="mt-1 h-9 text-sm" /></div>
        <div><Label className="text-xs">Processing Fee / Service Charge (%)</Label><Input type="number" step="0.1" value={fee} onChange={(e) => setFee(e.target.value)} className="mt-1 h-9 text-sm" /></div>
        <Button onClick={handleSave} disabled={updatePricing.isPending}>{updatePricing.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save</Button>
      </div>
    </PageShell>
  );
}
