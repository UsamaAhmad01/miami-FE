"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { StatusBadge } from "@/components/primitives/status-badge";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useOrders } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";

const STATUS_COLORS: Record<string, "info" | "warning" | "success" | "error"> = {
  Processing: "info", Shipped: "warning", Delivered: "success", Cancelled: "error",
};

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function OrderReceivingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: apiOrders, isLoading } = useOrders(user?.id || 0);
  const orders = (apiOrders || []) as Array<Record<string, unknown>>;

  return (
    <PageShell>
      <PageHeader title="Order Receiving" description="Process incoming orders" />

      {isLoading ? (
        <BrandedLoader variant="inline" text="Loading orders..." />
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-3">Order ID</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-3">Date</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-3">Ship To</th>
                <th className="text-right text-[11px] font-medium text-muted-foreground px-4 py-3">Total</th>
                <th className="text-right text-[11px] font-medium text-muted-foreground px-4 py-3 w-32">Update</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={String(order.order_id)}
                  onClick={() => router.push(`/orders/${order.order_id}/wholesale`)}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium">{String(order.order_id)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(String(order.created_at || ""))}</td>
                  <td className="px-4 py-3"><StatusBadge status={STATUS_COLORS[String(order.order_status)] || "neutral"}>{String(order.order_status)}</StatusBadge></td>
                  <td className="px-4 py-3 text-sm">{String(order.ship_to || "—")}</td>
                  <td className="px-4 py-3 text-sm font-medium text-right">${Number(order.total || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/orders/${order.order_id}/edit`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">Update Order</Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No orders in receiving</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
