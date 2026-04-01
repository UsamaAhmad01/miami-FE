"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Printer, Building2, User, Phone, Mail, MapPin, Calendar, Shield, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageShell } from "@/components/primitives/page-shell";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { usePosInvoice, useBranchData } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { PosItemsTable } from "./_components/pos-items-table";
import { PosPaymentFlow } from "./_components/pos-payment-flow";

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function PosInvoicePage() {
  const params = useParams();
  const invoiceNumber = params.id as string;
  const { user } = useAuthStore();

  const { data: invoice, isLoading } = usePosInvoice(invoiceNumber);
  const { data: branchData } = useBranchData(user?.branch_name || "");

  if (isLoading) return <BrandedLoader variant="page" text="Loading POS invoice..." />;
  if (!invoice) return <PageShell><div className="text-center py-12 text-sm text-muted-foreground">POS invoice not found</div></PageShell>;

  const customer = (invoice.customer || {}) as Record<string, string>;
  const subtotal = Number(invoice.total_price) || 0;
  const tax = Number(invoice.tax_price) || 0;
  const taxRate = Number(invoice.tax_on_creation) || 7;
  const total = subtotal + tax;
  const splitPayment = (invoice.split_payment || {}) as { cash_amount?: number; card_amount?: number };
  // Show payment section if terminal enabled OR partial payment was selected
  const terminalEnabled = invoice.terminal_payment_enabled === true;
  const isPartialPayment = String(invoice.payment_method || invoice.payment_option || "") === "partial";
  const showPaymentSection = terminalEnabled || isPartialPayment;

  return (
    <PageShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">POS Invoice</h1>
          <p className="text-xs text-muted-foreground font-mono">{invoiceNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/pos/${invoiceNumber}`}>
            <Button variant="outline" size="sm"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />POS Detail</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5 mr-1.5" />Print
          </Button>
          {showPaymentSection && (
            <PosPaymentFlow
              invoiceNumber={invoiceNumber}
              totalAmount={total}
              customerEmail={customer.email || ""}
            />
          )}
        </div>
      </div>

      {/* Printable invoice */}
      <div id="invoice_ticket" className="rounded-lg border bg-card p-6 space-y-6 print:border-0 print:shadow-none print:p-0">
        {/* From / To */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">From</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm font-medium">{branchData?.name || branchData?.branch_name || user?.branch_name || "Miami Bikes"}</span></div>
              {branchData?.address && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm text-muted-foreground">{branchData.address}</span></div>}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">To</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm font-medium">{customer.name || "Walk-in Customer"}</span></div>
              {customer.phone_no && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm text-muted-foreground">{customer.phone_no}</span></div>}
              {customer.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm text-muted-foreground">{customer.email}</span></div>}
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5"><FileText className="h-3 w-3 text-muted-foreground" /><p className="text-[10px] text-muted-foreground uppercase">Invoice ID</p></div>
            <p className="text-sm font-mono">{invoiceNumber}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5"><Calendar className="h-3 w-3 text-muted-foreground" /><p className="text-[10px] text-muted-foreground uppercase">Created</p></div>
            <p className="text-sm">{formatDate(String(invoice.created_at || ""))}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5"><Shield className="h-3 w-3 text-muted-foreground" /><p className="text-[10px] text-muted-foreground uppercase">Validated By</p></div>
            <p className="text-sm">{String(invoice.validated_by || "—")}</p>
          </div>
        </div>

        <Separator />

        {/* Items */}
        <PosItemsTable invoice={invoice} />

        <Separator />

        {/* Totals */}
        <div className="space-y-2 text-sm max-w-xs ml-auto">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">${subtotal.toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">(Processing fee included in item prices)</p>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax ({taxRate}%)</span>
            <span className="tabular-nums">${tax.toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">(On taxable items only)</p>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="tabular-nums">${total.toFixed(2)}</span>
          </div>
          {Number(splitPayment.cash_amount) > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Cash Payment</span>
              <span className="tabular-nums">${Number(splitPayment.cash_amount).toFixed(2)}</span>
            </div>
          )}
          {Number(splitPayment.card_amount) > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>Card Payment</span>
              <span className="tabular-nums">${Number(splitPayment.card_amount).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Print footer */}
      <div className="hidden print:flex justify-between text-[10px] text-muted-foreground mt-8">
        <span>2026 &copy; Miami Bikes</span>
        <span>Designed &amp; Developed by BrainsLogic</span>
      </div>
    </PageShell>
  );
}
