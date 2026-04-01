"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useBranchUsers } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";

export default function TaxCertificatesPage() {
  const { user } = useAuthStore();
  const { data: users, isLoading } = useBranchUsers(user?.branch_id || 0);
  const [search, setSearch] = useState("");

  const filtered = (users || []).filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.email.toLowerCase().includes(q) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
      (u.rs_tax || "").toLowerCase().includes(q);
  });

  return (
    <PageShell>
      <PageHeader title="Resale Tax Certificates" description="All branch users and their tax certificates" />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search by name, email, or certificate..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
      </div>

      {isLoading ? (
        <BrandedLoader variant="inline" text="Loading users..." />
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-3">Email</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-3">Name</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-3">Resale Tax Certificate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm">{u.email}</td>
                  <td className="px-4 py-3 text-sm font-medium">{u.first_name} {u.last_name}</td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{u.rs_tax || "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
