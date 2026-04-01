"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Search, Users, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { KpiCard } from "@/components/primitives/kpi-card";
import { type ApiCustomer } from "./_data/api-types";
import { useCustomers } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { toast } from "sonner";
import { api } from "@/lib/api";

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchBy, setSearchBy] = useState<"email" | "name">("email");
  const [exporting, setExporting] = useState(false);
  const { user } = useAuthStore();
  const branchId = String(user?.branch_id || "");
  const { data: apiCustomers, isLoading } = useCustomers(branchId);

  const customers: ApiCustomer[] = (apiCustomers || []) as unknown as ApiCustomer[];
  const totalCustomers = customers.length;
  const totalTickets = customers.reduce((s, c) => s + (c.total_tickets || 0), 0);

  // Filter by search
  const filtered = search.trim()
    ? customers.filter((c) => {
        const term = search.toLowerCase();
        return (c.name || "").toLowerCase().includes(term) ||
          (c.email || "").toLowerCase().includes(term) ||
          (c.most_recent_phone_number || "").includes(term) ||
          (c.most_recent_ticket_name || "").toLowerCase().includes(term);
      })
    : customers;

  const handleRowClick = (customer: ApiCustomer) => {
    const key = searchBy === "email" ? customer.email : customer.name;
    if (!key) return;
    router.push(`/customers/${encodeURIComponent(key)}/tickets?by=${searchBy}`);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get("/crm/customers/", {
        params: { option: searchBy, branch: branchId, csv: "True" },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(response.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "customers.csv";
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Customers exported");
    } catch {
      toast.error("Failed to export customers");
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Customers"
        description={`${totalCustomers} customers across all tickets`}
        actions={
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className="h-3.5 w-3.5 mr-1.5" />{exporting ? "Exporting..." : "Export CSV"}
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <KpiCard title="Total Customers" value={String(totalCustomers)} icon={Users} />
        <KpiCard title="Total Tickets" value={String(totalTickets)} icon={Ticket} />
      </div>

      {/* Search + Group By */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search by name, phone, or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Group by:</span>
          <select value={searchBy} onChange={(e) => setSearchBy(e.target.value as "email" | "name")} className="rounded-md border bg-background px-2 py-1 text-xs">
            <option value="email">Email</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? <BrandedLoader variant="inline" text="Loading customers..." /> : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5">{searchBy === "email" ? "Email" : "Name"}</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5">Last Ticket Name</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5">Phone</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5">Phone 2</th>
                <th className="text-right text-[11px] font-medium text-muted-foreground px-4 py-2.5">Total Tickets</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5">Last Ticket Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} onClick={() => handleRowClick(c)} className="border-b last:border-0 cursor-pointer hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 text-sm">{searchBy === "email" ? (c.email || "N/A") : (c.name || "N/A")}</td>
                  <td className="px-4 py-2.5 text-sm font-medium">{c.most_recent_ticket_name || "N/A"}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">{c.most_recent_phone_number || "—"}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">{c.most_recent_phone_number2 || "—"}</td>
                  <td className="px-4 py-2.5 text-sm font-medium text-right tabular-nums">{c.total_tickets}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(c.most_recent_ticket)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
