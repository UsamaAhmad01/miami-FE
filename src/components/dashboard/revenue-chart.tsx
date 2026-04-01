"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionHeader } from "@/components/primitives/section-header";
import { useThemeColors } from "@/hooks/use-theme-colors";

const data = [
  { month: "Jan", revenue: 4200, tickets: 3100 },
  { month: "Feb", revenue: 4800, tickets: 3400 },
  { month: "Mar", revenue: 5100, tickets: 3800 },
  { month: "Apr", revenue: 4600, tickets: 3200 },
  { month: "May", revenue: 5800, tickets: 4100 },
  { month: "Jun", revenue: 6200, tickets: 4500 },
  { month: "Jul", revenue: 7100, tickets: 5200 },
  { month: "Aug", revenue: 6800, tickets: 4800 },
  { month: "Sep", revenue: 7400, tickets: 5500 },
  { month: "Oct", revenue: 6900, tickets: 5100 },
  { month: "Nov", revenue: 7800, tickets: 5700 },
  { month: "Dec", revenue: 8200, tickets: 6100 },
];

export function RevenueChart() {
  const { color1, color2 } = useThemeColors();

  return (
    <div className="rounded-lg border bg-card p-5">
      <SectionHeader title="Revenue Overview" className="mb-4" />
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color1} stopOpacity={0.15} />
                <stop offset="100%" stopColor={color1} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="tkt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color2} stopOpacity={0.1} />
                <stop offset="100%" stopColor={color2} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(v) => `$${v / 1000}k`}
              dx={-4}
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]}
            />
            <Area type="monotone" dataKey="revenue" stroke={color1} strokeWidth={2} fill="url(#rev)" name="Revenue" />
            <Area type="monotone" dataKey="tickets" stroke={color2} strokeWidth={1.5} fill="url(#tkt)" name="Tickets" strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
