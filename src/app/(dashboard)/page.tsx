"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, CreditCard, Package, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/primitives/page-shell";
import { Reveal } from "@/components/effects/reveal";
import { useAuthStore } from "@/stores/auth-store";
import { DashboardKpis } from "./_components/dashboard-kpis";
import { DashboardTables } from "./_components/dashboard-tables";
import { DashboardRevenueChart } from "./_components/dashboard-revenue-chart";
import { DashboardStatusChart } from "./_components/dashboard-status-chart";
import { DashboardCalendar } from "./_components/dashboard-calendar";
import { StatusUpdateModal } from "./_components/status-update-modal";

type Period = "weekly" | "monthly" | "yearly";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const quickActions = [
  { label: "New Ticket", href: "/tickets/new", icon: Plus, color: "bg-blue-500/10 text-blue-600" },
  { label: "Open POS", href: "/pos", icon: CreditCard, color: "bg-emerald-500/10 text-emerald-600" },
  { label: "Inventory", href: "/inventory", icon: Package, color: "bg-amber-500/10 text-amber-600" },
  { label: "Reports", href: "/reporting", icon: BarChart3, color: "bg-purple-500/10 text-purple-600" },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<Period>("yearly");
  const [statusModalInvoice, setStatusModalInvoice] = useState<string | null>(null);

  return (
    <PageShell>
      {/* Header: Greeting + Quick Actions + Tabs + Create POS */}
      <Reveal>
        <div className="flex flex-col gap-4">
          {/* Row 1: Greeting + Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {getGreeting()}, {user?.first_name || "there"}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {user?.branch_name || "Miami Bikes"} — Here&apos;s your shop overview.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium hover-lift hover:border-border transition-all"
                >
                  <div className={`flex h-6 w-6 items-center justify-center rounded-md ${action.color}`}>
                    <action.icon className="h-3 w-3" />
                  </div>
                  <span className="hidden sm:inline">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Row 2: Period Tabs + Create POS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center rounded-md border bg-muted/40 p-0.5">
              {(["weekly", "monthly", "yearly"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-sm px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                    period === p ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <Link href="/pos">
              <Button size="sm" className="gradient-primary text-white border-0 shadow-soft">
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                Create POS
              </Button>
            </Link>
          </div>
        </div>
      </Reveal>

      {/* KPI Cards */}
      <Reveal>
        <DashboardKpis period={period} />
      </Reveal>

      {/* Tables: Scheduled Repairs + Special Orders */}
      <Reveal>
        <DashboardTables period={period} onStatusClick={setStatusModalInvoice} />
      </Reveal>

      {/* Charts: Revenue + Expect vs Actual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Reveal>
          <DashboardRevenueChart />
        </Reveal>
        <Reveal delay={100}>
          <DashboardStatusChart />
        </Reveal>
      </div>

      {/* Calendar */}
      <Reveal>
        <DashboardCalendar />
      </Reveal>

      {/* Status Update Modal */}
      <StatusUpdateModal invoice={statusModalInvoice} onClose={() => setStatusModalInvoice(null)} />
    </PageShell>
  );
}
