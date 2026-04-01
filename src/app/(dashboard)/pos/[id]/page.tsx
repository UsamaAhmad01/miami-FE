"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Printer, ArrowLeft, User, Phone, Mail, MapPin, Calendar, Building2, Shield, CreditCard, Banknote, Receipt, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/primitives/status-badge";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { usePosInvoice } from "@/hooks/use-api";

function maskCard(num: string) { return num ? "*".repeat(Math.max(0, num.length - 4)) + num.slice(-4) : "****"; }
function maskCvc(cvc: string) { return "*".repeat(cvc?.length || 3); }
function formatPayment(m: string): string {
  const map: Record<string, string> = { cash: "Cash", credit_card: "Credit Card", split: "Split Payment", card: "Card" };
  return map[m] || m || "N/A";
}

const TYPE_TAGS: Record<string, { label: string; color: string }> = {
  inventory: { label: "Inventory", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  custom: { label: "Custom", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  service: { label: "POS Service", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400" },
};

export default function PosDetailsPage() {
  const { id } = useParams();
  const invoiceNumber = id as string;
  const { data: invoice, isLoading } = usePosInvoice(invoiceNumber);

  if (isLoading) return <BrandedLoader variant="page" text="Loading POS details..." />;
  if (!invoice) return <PageShell><div className="text-center py-12 text-sm text-muted-foreground">POS transaction not found</div></PageShell>;

  // Guard: redirect non-POS tickets to the bike ticket detail page
  if (invoice.is_pos === false) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 mb-4">
            <AlertTriangle className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Not a POS Transaction</h2>
          <p className="text-sm text-muted-foreground mt-1">This is a bike ticket. Use the ticket details page.</p>
          <Link href={`/tickets/${invoiceNumber}/bike`} className="mt-4"><Button variant="outline" size="sm">View Bike Ticket</Button></Link>
        </div>
      </PageShell>
    );
  }

  const customer = (invoice.customer || {}) as Record<string, string>;
  const totalPrice = Number(invoice.total_price) || 0;
  const taxPrice = Number(invoice.tax_price) || 0;
  const taxRate = Number(invoice.tax_on_creation) || 7;
  const processingFee = Number(invoice.processing_fee) || 0;
  const finalTotal = totalPrice + taxPrice;
  const splitPayment = (invoice.split_payment || {}) as { cash_amount?: number; card_amount?: number };
  const cardDetails = invoice.card_details as { card_user_name?: string; card_number?: string; card_expiry?: string; card_cvc?: string } | undefined;
  const notesText = String(invoice.notes || "");

  // Collect items
  const items: Array<{ name: string; type: string; qty: number; price: number; taxable: boolean; total: number }> = [];
  ((invoice.pos_services || []) as Array<Record<string, unknown>>).forEach((s) => {
    const svc = s.service as Record<string, unknown> | undefined;
    items.push({ name: String(svc?.name || s.name || "Service"), type: "service", qty: 1, price: Number(svc?.price || s.price || 0), taxable: s.taxable === true, total: Number(svc?.price || s.price || 0) });
  });
  ((invoice.custom_services || []) as Array<Record<string, unknown>>).forEach((c) => {
    const qty = Number(c.quantity) || 1;
    items.push({ name: String(c.name), type: "custom", qty, price: Number(c.price) || 0, taxable: c.taxable === true, total: Number(c.total_price) || (Number(c.price) || 0) * qty });
  });
  ((invoice.inventory_items || []) as Array<Record<string, unknown>>).forEach((inv) => {
    const qty = Number(inv.quantity) || 1;
    items.push({ name: `${String(inv.name || inv.item_name)} ${inv.upc_ean ? `(${inv.upc_ean})` : ""}`, type: "inventory", qty, price: Number(inv.price) || 0, taxable: inv.taxable === true, total: Number(inv.total_price) || (Number(inv.price) || 0) * qty });
  });

  return (
    <PageShell>
      <PageHeader
        title={`POS #${invoiceNumber}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status="info" dot={false}>POS</StatusBadge>
            <StatusBadge status={invoice.active ? "success" : "error"}>{invoice.active ? "Active" : "Inactive"}</StatusBadge>
            <Link href={`/pos/invoices/${invoiceNumber}`}><Button variant="outline" size="sm"><Receipt className="h-3.5 w-3.5 mr-1.5" />POS Invoice</Button></Link>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1.5" />Print</Button>
            <Link href="/tickets"><Button variant="ghost" size="sm"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Back</Button></Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold">Customer</h3>
          <InfoRow icon={User} label="Name" value={customer.name || "Walk-in"} />
          <InfoRow icon={Phone} label="Phone" value={customer.phone_no || "—"} />
          {customer.email && <InfoRow icon={Mail} label="Email" value={customer.email} />}
          {customer.address && <InfoRow icon={MapPin} label="Address" value={customer.address} />}
        </div>
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold">Transaction Info</h3>
          <InfoRow icon={Calendar} label="Created" value={new Date(String(invoice.created_at || "")).toLocaleString()} />
          <InfoRow icon={Building2} label="Branch" value={String(invoice.branch || "")} />
          <InfoRow icon={CreditCard} label="Payment Method" value={formatPayment(String(invoice.payment_method || invoice.payment_option || ""))} />
          <InfoRow icon={Shield} label="Validated By" value={String(invoice.validated_by || "—")} />
        </div>
      </div>

      {/* Items */}
      <div className="rounded-lg border bg-card">
        <div className="p-5 border-b"><h3 className="text-sm font-semibold">Items & Services</h3></div>
        <table className="w-full">
          <thead><tr className="border-b">
            <th className="text-left text-[11px] font-medium text-muted-foreground px-5 py-2">Item</th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-5 py-2">Type</th>
            <th className="text-right text-[11px] font-medium text-muted-foreground px-5 py-2">Qty</th>
            <th className="text-right text-[11px] font-medium text-muted-foreground px-5 py-2">Price</th>
            <th className="text-center text-[11px] font-medium text-muted-foreground px-5 py-2">Tax</th>
            <th className="text-right text-[11px] font-medium text-muted-foreground px-5 py-2">Total</th>
          </tr></thead>
          <tbody>
            {items.map((item, i) => {
              const tag = TYPE_TAGS[item.type] || TYPE_TAGS.service;
              return (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-5 py-2.5 text-sm">{item.name}</td>
                  <td className="px-5 py-2.5"><span className={`text-[10px] rounded px-1.5 py-0.5 font-medium ${tag.color}`}>{tag.label}</span></td>
                  <td className="px-5 py-2.5 text-sm text-right">{item.qty}</td>
                  <td className="px-5 py-2.5 text-sm text-right">${item.price.toFixed(2)}</td>
                  <td className="px-5 py-2.5 text-xs text-center">{item.taxable ? "Yes" : "No"}</td>
                  <td className="px-5 py-2.5 text-sm font-medium text-right">${item.total.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Payment Summary */}
      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">Payment Summary</h3>
        <div className="space-y-1.5 text-sm max-w-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">${totalPrice.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax ({taxRate}%)</span><span className="tabular-nums">${taxPrice.toFixed(2)}</span></div>
          {processingFee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Processing Fee</span><span className="tabular-nums">${processingFee.toFixed(2)}</span></div>}
          <Separator />
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="tabular-nums">${finalTotal.toFixed(2)}</span></div>
          {Number(splitPayment.card_amount) > 0 && <div className="flex justify-between text-blue-600"><span>Card</span><span className="tabular-nums">${Number(splitPayment.card_amount).toFixed(2)}</span></div>}
          {Number(splitPayment.cash_amount) > 0 && <div className="flex justify-between text-emerald-600"><span>Cash</span><span className="tabular-nums">${Number(splitPayment.cash_amount).toFixed(2)}</span></div>}
        </div>
      </div>

      {/* Card Details */}
      {cardDetails && cardDetails.card_number && (
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Card Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><p className="text-[10px] text-muted-foreground uppercase">Holder</p><p className="text-sm mt-0.5">{cardDetails.card_user_name || "—"}</p></div>
            <div><p className="text-[10px] text-muted-foreground uppercase">Number</p><p className="text-sm font-mono mt-0.5">{maskCard(cardDetails.card_number)}</p></div>
            <div><p className="text-[10px] text-muted-foreground uppercase">Expiry</p><p className="text-sm mt-0.5">{cardDetails.card_expiry || "—"}</p></div>
            <div><p className="text-[10px] text-muted-foreground uppercase">CVC</p><p className="text-sm font-mono mt-0.5">{maskCvc(cardDetails.card_cvc || "")}</p></div>
          </div>
        </div>
      )}

      {notesText && (
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold mb-2">Notes</h3>
          <p className="text-sm text-muted-foreground">{notesText}</p>
        </div>
      )}
    </PageShell>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p><p className="text-sm mt-0.5">{value}</p></div>
    </div>
  );
}
