"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/primitives/section-header";
import { StatusBadge } from "@/components/primitives/status-badge";
import { useAuthStore } from "@/stores/auth-store";
import { useScheduledRepairs, useSpecialOrders } from "@/hooks/use-api";
import { BrandedLoader } from "@/components/brand/branded-loader";

interface RepairRow {
  invoice: string;
  description: string;
  dueDate: string;
  mechanic: string;
  status: string;
}

const STATUS_MAP: Record<string, "warning" | "success" | "error"> = {
  Pending: "warning",
  Completed: "success",
  Cancelled: "error",
};

type Period = "weekly" | "monthly" | "yearly";

function getDateRange(period: Period): { startDate: string; endDate: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDay();

  if (period === "weekly") {
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { startDate: monday.toISOString().split("T")[0], endDate: sunday.toISOString().split("T")[0] };
  }

  if (period === "monthly") {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { startDate: firstDay.toISOString().split("T")[0], endDate: lastDay.toISOString().split("T")[0] };
  }

  return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
}

interface DashboardTablesProps {
  period: Period;
  onStatusClick: (invoice: string) => void;
}

export function DashboardTables({ period, onStatusClick }: DashboardTablesProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const branch = user?.branch_name || "";
  const { startDate, endDate } = useMemo(() => getDateRange(period), [period]);

  const repairs = useScheduledRepairs(branch, startDate, endDate);
  const specials = useSpecialOrders(branch, startDate, endDate);

  const handleRowClick = (invoice: string) => {
    router.push(`/tickets/${invoice}/edit`);
  };

  const repairRows: RepairRow[] = (repairs.data || []).map((r) => ({
    invoice: r.automatic_generated_invoice_number,
    description: r.description,
    dueDate: r.delivery_date,
    mechanic: r.mechanic_name || "—",
    status: r.status,
  }));

  const specialRows: RepairRow[] = (specials.data || []).map((r) => ({
    invoice: r.automatic_generated_invoice_number,
    description: r.description,
    dueDate: r.delivery_date,
    mechanic: r.mechanic_name || "—",
    status: r.status,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <RepairTable title="Scheduled Repairs" data={repairRows} loading={repairs.isLoading} onStatusClick={onStatusClick} onRowClick={handleRowClick} />
      <RepairTable title="Special Orders" data={specialRows} loading={specials.isLoading} onStatusClick={onStatusClick} onRowClick={handleRowClick} />
    </div>
  );
}

function RepairTable({ title, data, loading, onStatusClick, onRowClick }: { title: string; data: RepairRow[]; loading: boolean; onStatusClick: (invoice: string) => void; onRowClick: (invoice: string) => void }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <SectionHeader title={title} />
      </div>
      {loading ? (
        <BrandedLoader variant="inline" text="Loading..." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5">Description</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5">Due Date</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5">Mechanic</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.invoice} onClick={() => onRowClick(row.invoice)} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                  <td className="px-4 py-2.5 text-sm">{row.description}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{row.dueDate}</td>
                  <td className="px-4 py-2.5 text-xs">{row.mechanic}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={(e) => { e.stopPropagation(); onStatusClick(row.invoice); }}>
                      <StatusBadge status={STATUS_MAP[row.status] || "neutral"}>{row.status}</StatusBadge>
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-muted-foreground">No items</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
