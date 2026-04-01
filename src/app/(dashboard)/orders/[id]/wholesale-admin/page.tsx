"use client";

import { useParams } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/primitives/page-shell";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useOrderDetail, useDownloadOrderItemsCsv } from "@/hooks/use-api";
import { OrderDetailLayout } from "../../_components/order-detail-layout";
import { InvoiceManager } from "./_components/invoice-manager";

export default function OrderDetailWholesaleAdminPage() {
  const { id } = useParams();
  const orderId = id as string;
  const { data: order, isLoading } = useOrderDetail(orderId);
  const downloadItems = useDownloadOrderItemsCsv();

  if (isLoading) return <BrandedLoader variant="page" text="Loading order..." />;
  if (!order) return <PageShell><div className="text-center py-12 text-sm text-muted-foreground">Order not found</div></PageShell>;

  return (
    <PageShell>
      <OrderDetailLayout
        order={order}
        feeLabel="MB-Service Charge (3%)"
        extraButtons={
          <>
            <Button variant="outline" size="sm" onClick={() => downloadItems.mutate(orderId)}>
              <Download className="h-3.5 w-3.5 mr-1.5" />Order Items
            </Button>
            <InvoiceManager orderId={orderId} />
          </>
        }
      />
    </PageShell>
  );
}
