"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { SectionHeader } from "@/components/primitives/section-header";
import { useAuthStore } from "@/stores/auth-store";
import { useRevenueByMonth } from "@/hooks/use-api";
import { BrandedLoader } from "@/components/brand/branded-loader";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function DashboardRevenueChart() {
  const { user } = useAuthStore();
  const branch = user?.branch_name || "";
  const currentYear = new Date().getFullYear();
  const revenue = useRevenueByMonth(String(currentYear - 1), String(currentYear), branch);

  const chartData = MONTHS.map((month, i) => ({
    month,
    currentYear: revenue.data?.total_by_month_year_two?.[i]?.total_price_month || 0,
    previousYear: revenue.data?.total_by_month_year_one?.[i]?.total_price_month || 0,
  }));

  return (
    <div className="rounded-lg border bg-card p-5">
      <SectionHeader title="Revenue Comparison" className="mb-4" />
      {revenue.isLoading ? (
        <BrandedLoader variant="inline" text="Loading chart..." />
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="dashRev1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dashRev2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [`$${Number(v).toLocaleString()}`, ""]} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Area type="monotone" dataKey="currentYear" name={`${currentYear}`} stroke="var(--primary)" strokeWidth={2} fill="url(#dashRev1)" />
              <Area type="monotone" dataKey="previousYear" name={`${currentYear - 1}`} stroke="var(--destructive)" strokeWidth={1.5} fill="url(#dashRev2)" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
