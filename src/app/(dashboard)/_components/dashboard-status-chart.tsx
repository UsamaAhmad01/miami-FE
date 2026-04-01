"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { SectionHeader } from "@/components/primitives/section-header";
import { useAuthStore } from "@/stores/auth-store";
import { useExpectVsActual } from "@/hooks/use-api";
import { BrandedLoader } from "@/components/brand/branded-loader";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function DashboardStatusChart() {
  const { user } = useAuthStore();
  const branch = user?.branch_name || "";
  const currentYear = new Date().getFullYear();
  const statusData = useExpectVsActual(currentYear - 1, currentYear, branch);

  const chartData = MONTHS.map((month, i) => {
    const key = String(i + 1);
    const d = statusData.data?.[key];
    return {
      month,
      completed: d?.completed_total || 0,
      pending: d?.pending_total || 0,
    };
  });

  return (
    <div className="rounded-lg border bg-card p-5">
      <SectionHeader title="Expected vs Actual Income" className="mb-4" />
      {statusData.isLoading ? (
        <BrandedLoader variant="inline" text="Loading chart..." />
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [`$${Number(v).toLocaleString()}`, ""]} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="completed" name="Actual (Completed)" fill="var(--primary)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="pending" name="Expected (Pending)" fill="var(--destructive)" radius={[3, 3, 0, 0]} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
