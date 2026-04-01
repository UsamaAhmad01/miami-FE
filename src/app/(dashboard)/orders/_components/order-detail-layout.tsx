"use client";

import { useRef } from "react";
import { Printer, Download, Mail, FileSpreadsheet, ArrowLeft, User, Phone, Mail as MailIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/primitives/status-badge";
import { useDownloadOrderCsv, useGenerateOrderPdf, useSendPdfEmail } from "@/hooks/use-api";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, "info" | "warning" | "success" | "error"> = {
  Processing: "info",
  Shipped: "warning",
  Delivered: "success",
  Cancelled: "error",
};

interface OrderDetailLayoutProps {
  order: Record<string, unknown>;
  feeLabel: string;
  children?: React.ReactNode; // extra content (invoice manager for admin)
  extraButtons?: React.ReactNode;
}

export function OrderDetailLayout({ order, feeLabel, children, extraButtons }: OrderDetailLayoutProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const orderId = String(order.order_id || "");
  const status = String(order.order_status || "");
  const date = String(order.created_at || "");
  const customerName = String(order.customer_name || "");
  const email = String(order.email || "");
  const phone = String(order.phone || "");
  const items = (order.items || []) as Array<{ name: string; vendor: string; upc: string; cost: number; quantity: number; total: number }>;
  const subtotal = Number(order.subtotal) || 0;
  const tax = Number(order.tax) || 0;
  const shipping = Number(order.shipping) || 0;
  const grandTotal = Number(order.grand_total) || 0;

  const downloadCsv = useDownloadOrderCsv();
  const downloadPdf = useGenerateOrderPdf();
  const sendEmail = useSendPdfEmail();

  const handlePrint = () => window.print();
  const handlePdf = () => downloadPdf.mutate(orderId);
  const handleCsv = () => downloadCsv.mutate(orderId);
  const handleEmail = async () => {
    if (!email) { toast.error("No customer email"); return; }
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const el = invoiceRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2 });
      const pdf = new jsPDF("p", "mm", "a4");
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, w, h);
      await sendEmail.mutateAsync({ file: pdf.output("datauristring"), receiver: email, invoiceNumber: orderId });
      toast.success("Email sent to " + email);
    } catch { toast.error("Failed to send email"); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/orders"><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Order {orderId}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={STATUS_COLORS[status] || "neutral"}>{status}</StatusBadge>
              <span className="text-xs text-muted-foreground">{date}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {extraButtons}
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-3.5 w-3.5 mr-1.5" />Print</Button>
          <Button variant="outline" size="sm" onClick={handlePdf}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
          <Button variant="outline" size="sm" onClick={handleEmail}><Mail className="h-3.5 w-3.5 mr-1.5" />Email</Button>
          <Button variant="outline" size="sm" onClick={handleCsv}><FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />CSV</Button>
        </div>
      </div>

      {/* Printable content */}
      <div ref={invoiceRef} className="rounded-lg border bg-card p-6 space-y-5 print:border-0 print:p-0">
        {/* Customer info */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Customer</p>
          <div className="flex flex-wrap gap-6">
            {customerName && <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm">{customerName}</span></div>}
            {email && <div className="flex items-center gap-2"><MailIcon className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm">{email}</span></div>}
            {phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm">{phone}</span></div>}
          </div>
        </div>

        <Separator />

        {/* Items table */}
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2 w-8">#</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2">Item</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2">Warehouse</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2">UPC</th>
              <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2">Cost</th>
              <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2">Qty</th>
              <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{i + 1}</td>
                <td className="px-3 py-2.5 text-sm font-medium">{item.name}</td>
                <td className="px-3 py-2.5 text-xs">{item.vendor}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{item.upc}</td>
                <td className="px-3 py-2.5 text-sm text-right">${Number(item.cost).toFixed(2)}</td>
                <td className="px-3 py-2.5 text-sm text-right">{item.quantity}</td>
                <td className="px-3 py-2.5 text-sm font-medium text-right">${Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Separator />

        {/* Totals */}
        <div className="space-y-2 text-sm max-w-xs ml-auto">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{feeLabel}</span><span>${tax.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>${shipping.toFixed(2)}</span></div>
          <Separator />
          <div className="flex justify-between text-lg font-bold"><span>Grand Total</span><span>${grandTotal.toFixed(2)}</span></div>
        </div>
      </div>

      {children}
    </div>
  );
}
