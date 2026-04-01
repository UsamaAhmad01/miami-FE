"use client";

import { useMemo } from "react";
import { DollarSign, CalendarCheck, Clock, CreditCard } from "lucide-react";
import { KpiCard } from "@/components/primitives/kpi-card";
import { useAuthStore } from "@/stores/auth-store";
import { usePendingTicketsCount, usePaidTicketsCount, useCompletedTotal, useTotalTicketsAmount } from "@/hooks/use-api";

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
    return {
      startDate: monday.toISOString().split("T")[0],
      endDate: sunday.toISOString().split("T")[0],
    };
  }

  if (period === "monthly") {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      startDate: firstDay.toISOString().split("T")[0],
      endDate: lastDay.toISOString().split("T")[0],
    };
  }

  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
}

interface DashboardKpisProps {
  period: Period;
}

export function DashboardKpis({ period }: DashboardKpisProps) {
  const { user } = useAuthStore();
  const branch = user?.branch_name || "";
  const isStaffUser = user?.role === "StaffUser";

  // Memoize date range so it doesn't create new references on every render
  const { startDate, endDate } = useMemo(() => getDateRange(period), [period]);

  const pending = usePendingTicketsCount(branch, startDate, endDate);
  const paid = usePaidTicketsCount(branch, startDate, endDate);
  const completed = useCompletedTotal(branch, startDate, endDate);
  const scheduled = useTotalTicketsAmount(branch);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${isStaffUser ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4`}>
      {!isStaffUser && (
        <KpiCard
          title="Net Sales"
          value={completed.data !== undefined ? `$${completed.data.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
          icon={DollarSign}
          trend="up"
          change="vs previous period"
        />
      )}
      <KpiCard
        title="Schedule For Completion (Today)"
        value={scheduled.data !== undefined ? String(scheduled.data) : "—"}
        icon={CalendarCheck}
      />
      <KpiCard
        title="Pending Orders"
        value={pending.data !== undefined ? String(pending.data) : "—"}
        icon={Clock}
        trend={pending.data && pending.data > 10 ? "down" : "flat"}
        change={pending.data && pending.data > 10 ? "Needs attention" : "On track"}
      />
      <KpiCard
        title="Paid Orders"
        value={paid.data !== undefined ? String(paid.data) : "—"}
        icon={CreditCard}
        trend="up"
        change="Completed"
      />
    </div>
  );
}
