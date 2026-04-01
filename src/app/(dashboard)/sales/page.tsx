"use client";

import { useRouter } from "next/navigation";
import { DollarSign, Wrench } from "lucide-react";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { KpiCard } from "@/components/primitives/kpi-card";
import { StatusBadge } from "@/components/primitives/status-badge";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useSalesData } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";

export default function SalesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: salesData, isLoading } = useSalesData(user?.id || 0, user?.branch_id || 0);
  const tickets = salesData?.data?.tickets || [];

  const totalCount = tickets.length;
  const totalRevenue = tickets.reduce((s, t) => s + (Number(t.total_price) || 0), 0);
  const isStaffUser = user?.role === "StaffUser";

  const handleRowClick = (ticket: Record<string, unknown>) => {
    const inv = String(ticket.automatic_generated_invoice_number || "");
    if (ticket.is_pos) {
      router.push(`/pos/${inv}`);
    } else {
      router.push(`/tickets/${inv}`);
    }
  };

  return (
    <PageShell>
      <PageHeader title="Sales" description="Completed tickets and POS transactions" />

      <div className="grid grid-cols-2 gap-4">
        <KpiCard title="Total Completed Tickets" value={String(totalCount)} icon={Wrench} />
        {!isStaffUser && <KpiCard title="Total Revenue" value={`$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} icon={DollarSign} trend="up" />}
      </div>

      {isLoading ? (
        <BrandedLoader variant="inline" text="Loading sales..." />
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Type</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Invoice #</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Customer</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Phone</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Branch</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Mechanic</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Services</th>
                <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2.5">Total</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5">Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket, i) => (
                <tr key={i} onClick={() => handleRowClick(ticket)} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                  <td className="px-3 py-2.5">
                    <StatusBadge status={ticket.is_pos ? "info" : "neutral"} dot={false}>
                      {ticket.is_pos ? "POS" : "BIKE"}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs font-medium">{String(ticket.automatic_generated_invoice_number || "")}</td>
                  <td className="px-3 py-2.5 text-sm">{String(ticket.name || "")}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{String(ticket.phone_no || "")}</td>
                  <td className="px-3 py-2.5 text-xs">{String(ticket.branch_name || "")}</td>
                  <td className="px-3 py-2.5 text-xs">{String(ticket.mechanic_name || "—")}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] bg-muted rounded-full px-2 py-0.5">{String(ticket.services_summary || "0 service(s)")}</span>
                  </td>
                  <td className="px-3 py-2.5 text-sm font-semibold text-primary text-right">${Number(ticket.total_price || 0).toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{String(ticket.created_date || "")} {String(ticket.created_time || "")}</td>
                </tr>
              ))}
              {tickets.length === 0 && <tr><td colSpan={9} className="px-3 py-12 text-center text-sm text-muted-foreground">No completed sales found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
