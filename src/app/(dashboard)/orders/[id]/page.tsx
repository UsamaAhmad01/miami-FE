"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/primitives/page-shell";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useOrderDetail } from "@/hooks/use-api";
import { OrderDetailLayout } from "../_components/order-detail-layout";

export default function OrderDetailRetailPage() {
  const { id } = useParams();
  const { data: order, isLoading } = useOrderDetail(id as string);

  if (isLoading) return <BrandedLoader variant="page" text="Loading order..." />;
  if (!order) return <PageShell><div className="text-center py-12 text-sm text-muted-foreground">Order not found</div></PageShell>;

  return (
    <PageShell>
      <OrderDetailLayout order={order} feeLabel="Tax (7%)" />
    </PageShell>
  );
}
