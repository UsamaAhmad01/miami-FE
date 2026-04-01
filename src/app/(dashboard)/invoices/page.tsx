"use client";

import { useState } from "react";
import { FileText, Download, Mail, Search, DollarSign, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { KpiCard } from "@/components/primitives/kpi-card";
import { StatusBadge } from "@/components/primitives/status-badge";

interface Invoice {
  id: string;
  invoice_number: string;
  customer: string;
  type: "ticket" | "pos";
  total: number;
  tax: number;
  status: "paid" | "unpaid" | "partial";
  created: string;
}

const MOCK_INVOICES: Invoice[] = [
  { id: "1", invoice_number: "INV-100042", customer: "James Rodriguez", type: "ticket", total: 199.80, tax: 14.80, status: "partial", created: "2026-03-24T09:30:00" },
  { id: "2", invoice_number: "INV-100041", customer: "Sarah Chen", type: "ticket", total: 129.60, tax: 9.60, status: "unpaid", created: "2026-03-24T08:15:00" },
  { id: "3", invoice_number: "INV-100040", customer: "Mike Thompson", type: "ticket", total: 102.60, tax: 7.60, status: "paid", created: "2026-03-23T14:00:00" },
  { id: "4", invoice_number: "INV-100039", customer: "Emma Davis", type: "ticket", total: 162.00, tax: 12.00, status: "unpaid", created: "2026-03-23T11:00:00" },
  { id: "5", invoice_number: "INV-100038", customer: "Carlos Mendez", type: "pos", total: 70.20, tax: 5.20, status: "paid", created: "2026-03-22T16:00:00" },
  { id: "6", invoice_number: "INV-100037", customer: "Lisa Park", type: "ticket", total: 226.80, tax: 16.80, status: "unpaid", created: "2026-03-24T10:45:00" },
  { id: "7", invoice_number: "INV-100035", customer: "Ana Gutierrez", type: "ticket", total: 367.20, tax: 27.20, status: "partial", created: "2026-03-23T09:00:00" },
];

const statusConfig = { paid: { label: "Paid", color: "success" as const }, unpaid: { label: "Unpaid", color: "error" as const }, partial: { label: "Partial", color: "warning" as const } };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function InvoicesPage() {
  const [search, setSearch] = useState("");

  const totalUnpaid = MOCK_INVOICES.filter((i) => i.status !== "paid").reduce((s, i) => s + i.total, 0);
  const totalPaid = MOCK_INVOICES.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);

  const filtered = MOCK_INVOICES.filter((i) =>
    i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    i.customer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageShell>
      <PageHeader title="Invoices" description="All invoices and payment records" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard title="Total Invoices" value={String(MOCK_INVOICES.length)} icon={FileText} />
        <KpiCard title="Paid" value={`$${totalPaid.toFixed(0)}`} trend="up" icon={DollarSign} />
        <KpiCard title="Outstanding" value={`$${totalUnpaid.toFixed(0)}`} trend="down" change="Needs collection" icon={DollarSign} />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
      </div>

      <div className="rounded-lg border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Invoice</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Customer</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Type</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Total</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-medium">{inv.invoice_number}</td>
                <td className="px-4 py-3 text-sm">{inv.customer}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{inv.type}</td>
                <td className="px-4 py-3"><StatusBadge status={statusConfig[inv.status].color}>{statusConfig[inv.status].label}</StatusBadge></td>
                <td className="px-4 py-3 text-sm font-medium text-right">${inv.total.toFixed(2)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(inv.created)}</td>
                <td className="px-4 py-3 flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Download PDF"><Download className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Email"><Mail className="h-3 w-3" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
