"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, Users, Wrench, Package, Download, Calendar } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, ResponsiveContainer, CartesianGrid, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { KpiCard } from "@/components/primitives/kpi-card";
import { SectionHeader } from "@/components/primitives/section-header";
import { useThemeColors } from "@/hooks/use-theme-colors";

const revenueData = [
  { month: "Oct", revenue: 18400, tickets: 12200 },
  { month: "Nov", revenue: 21600, tickets: 14800 },
  { month: "Dec", revenue: 24200, tickets: 16100 },
  { month: "Jan", revenue: 19800, tickets: 13500 },
  { month: "Feb", revenue: 22400, tickets: 15200 },
  { month: "Mar", revenue: 26800, tickets: 18400 },
];

const employeeData = [
  { name: "Marco Silva", revenue: 8420, tickets: 34, hours: 160, rpm: 52.63 },
  { name: "Alex Torres", revenue: 7280, tickets: 29, hours: 155, rpm: 46.97 },
  { name: "Jordan Lee", revenue: 5640, tickets: 22, hours: 140, rpm: 40.29 },
];

const topProducts = [
  { name: "Continental GP5000", sold: 42, revenue: 3358 },
  { name: "Tube PV 26x1.5", sold: 85, revenue: 679 },
  { name: "Shimano 105 Chain", sold: 28, revenue: 980 },
  { name: "Bar Tape (Lizard)", sold: 24, revenue: 960 },
  { name: "Brake Pads", sold: 36, revenue: 900 },
];

const paymentMethods = [
  { method: "Card (Terminal)", amount: 15200, pct: 57 },
  { method: "Cash", amount: 6800, pct: 25 },
  { method: "Credit Card", amount: 3600, pct: 13 },
  { method: "Zelle", amount: 1200, pct: 5 },
];

type Period = "week" | "month" | "year";

export default function ReportingPage() {
  const [period, setPeriod] = useState<Period>("month");
  const { color1, color2 } = useThemeColors();

  return (
    <PageShell>
      <PageHeader
        title="Reporting"
        description="Analytics, performance, and financial reports"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border bg-muted/40 p-0.5">
              {(["week", "month", "year"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-sm px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    period === p ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1.5" />Export</Button>
          </div>
        }
      />

      {/* Executive KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Net Revenue" value="$26,800" change="+19.6%" trend="up" icon={DollarSign} />
        <KpiCard title="Tickets Closed" value="85" change="+12" trend="up" icon={Wrench} />
        <KpiCard title="Avg. Ticket" value="$315" change="+$18" trend="up" icon={TrendingUp} />
        <KpiCard title="Products Sold" value="215" change="+8%" trend="up" icon={Package} />
        <KpiCard title="Active Customers" value="64" change="+6" trend="up" icon={Users} />
      </div>

      {/* Revenue Chart */}
      <div className="rounded-lg border bg-card p-5">
        <SectionHeader title="Revenue Trend" className="mb-4" />
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="rptRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color1} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={color1} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
              <Area type="monotone" dataKey="revenue" stroke={color1} strokeWidth={2} fill="url(#rptRev)" name="Revenue" />
              <Area type="monotone" dataKey="tickets" stroke={color2} strokeWidth={1.5} fill="none" strokeDasharray="4 2" name="Ticket Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Employee Performance */}
        <div className="rounded-lg border bg-card p-5">
          <SectionHeader title="Employee Performance" className="mb-4" />
          <div className="space-y-3">
            {employeeData.map((emp, i) => (
              <div key={emp.name} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{emp.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground">{emp.tickets} tickets</span>
                    <span className="text-xs text-muted-foreground">{emp.hours}h logged</span>
                    <span className="text-xs font-medium">${emp.rpm}/hr</span>
                  </div>
                </div>
                <span className="text-sm font-semibold">${emp.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-lg border bg-card p-5">
          <SectionHeader title="Top Products" className="mb-4" />
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sold} units sold</p>
                </div>
                <span className="text-sm font-semibold">${p.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="rounded-lg border bg-card p-5">
        <SectionHeader title="Payment Methods" className="mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {paymentMethods.map((pm) => (
            <div key={pm.method} className="text-center p-3 rounded-md border">
              <p className="text-xs text-muted-foreground">{pm.method}</p>
              <p className="text-lg font-semibold mt-1">${pm.amount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{pm.pct}%</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
