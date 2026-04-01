"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Printer, ArrowLeft, CreditCard, User, Mail, Phone, MapPin, FileText, Calendar, Building2, Shield, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/primitives/status-badge";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { useTicketByInvoice } from "@/hooks/use-api";
import { BrandedLoader } from "@/components/brand/branded-loader";

function maskCardNumber(num: string): string {
  if (!num || num.length < 4) return "****";
  return "*".repeat(num.length - 4) + num.slice(-4);
}

function maskCVC(cvc: string): string {
  return "*".repeat(cvc?.length || 3);
}

function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = { cash: "Cash", credit_card: "Credit Card", split: "Split Payment", zelle: "Zelle", partial: "Partial" };
  return map[method] || method;
}

function formatDate(d: string): string {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " at " +
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const { data: ticket, isLoading } = useTicketByInvoice(ticketId);

  if (isLoading) return <BrandedLoader variant="page" text="Loading ticket..." />;
  if (!ticket) return <PageShell><div className="text-center py-12 text-sm text-muted-foreground">Ticket not found</div></PageShell>;

  const inventoryItems = (ticket.inventory_items || []) as Array<{ upc_ean: string; item_name?: string; quantity: number; unit_price: number; taxable: boolean }>;
  const servicesList = (ticket.services || []) as Array<{ name: string; price: number; total_price: number; taxable: boolean }>;
  const customServices = (ticket.custom_services || []) as Array<{ name: string; quantity: number; price: number; total_price: number; taxable: boolean }>;
  const posServices = (ticket.pos_services || []) as Array<{ name: string; price: number; taxable: boolean }>;

  const totalItemsPrice = inventoryItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const totalServicesPrice = servicesList.reduce((sum, s) => sum + (s.total_price || s.price), 0) +
    customServices.reduce((sum, c) => sum + (c.total_price || c.price || 0), 0);

  const hasItems = inventoryItems.length > 0 || servicesList.length > 0 ||
    customServices.length > 0 || posServices.length > 0;

  return (
    <PageShell>
      <PageHeader
        title={`Ticket #${ticket.id}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={ticket.is_pos ? "info" : "success"} dot={false}>
              {ticket.is_pos ? "POS" : "Bike Ticket"}
            </StatusBadge>
            <StatusBadge status={ticket.active ? "success" : "error"}>
              {ticket.active ? "Active" : "Inactive"}
            </StatusBadge>
            <Link href="/sales"><Button variant="outline" size="sm"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Back to Sales</Button></Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer Info */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Customer Information</h3>
          <div className="space-y-3">
            <InfoRow icon={User} label="Name" value={ticket.name} />
            <InfoRow icon={Phone} label="Phone" value={ticket.phone_no} />
            <InfoRow icon={Mail} label="Email" value={ticket.email} />
            <InfoRow icon={MapPin} label="Address" value={ticket.address} />
            <InfoRow icon={FileText} label="Description" value={ticket.description} />
          </div>
        </div>

        {/* Ticket Info */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Ticket Information</h3>
          <div className="space-y-3">
            <InfoRow icon={Calendar} label="Created" value={formatDate(ticket.created_at)} />
            <InfoRow icon={CreditCard} label="Payment Method" value={formatPaymentMethod(ticket.payment_option)} />
            <InfoRow icon={Building2} label="Branch" value={ticket.branch} />
            <InfoRow icon={Shield} label="Validated By" value={ticket.validated_by || "N/A"} />
            {ticket.discount_code_display && <InfoRow icon={Tag} label="Discount Code" value={ticket.discount_code_display} />}
          </div>
        </div>
      </div>

      {/* Items & Services */}
      <div className="rounded-lg border bg-card">
        <div className="p-5 border-b">
          <h3 className="text-sm font-semibold">Items & Services</h3>
        </div>

        {!hasItems ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No items found for this ticket</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-5 py-2.5">Item</th>
                  <th className="text-left text-[11px] font-medium text-muted-foreground px-5 py-2.5">Type</th>
                  <th className="text-right text-[11px] font-medium text-muted-foreground px-5 py-2.5">Qty</th>
                  <th className="text-right text-[11px] font-medium text-muted-foreground px-5 py-2.5">Price</th>
                  <th className="text-center text-[11px] font-medium text-muted-foreground px-5 py-2.5">Taxable</th>
                  <th className="text-right text-[11px] font-medium text-muted-foreground px-5 py-2.5">Total</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((item, i) => (
                  <tr key={`inv-${i}`} className="border-b last:border-0">
                    <td className="px-5 py-2.5 text-sm">{item.item_name || item.upc_ean}</td>
                    <td className="px-5 py-2.5"><span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">Inventory</span></td>
                    <td className="px-5 py-2.5 text-sm text-right">{item.quantity}</td>
                    <td className="px-5 py-2.5 text-sm text-right">${item.unit_price.toFixed(2)}</td>
                    <td className="px-5 py-2.5 text-xs text-center">{item.taxable ? "Yes" : "No"}</td>
                    <td className="px-5 py-2.5 text-sm font-medium text-right">${(item.unit_price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
                {servicesList.map((svc, i) => (
                  <tr key={`svc-${i}`} className="border-b last:border-0">
                    <td className="px-5 py-2.5 text-sm">{svc.name}</td>
                    <td className="px-5 py-2.5"><span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">Service</span></td>
                    <td className="px-5 py-2.5 text-sm text-right">1</td>
                    <td className="px-5 py-2.5 text-sm text-right">${svc.price.toFixed(2)}</td>
                    <td className="px-5 py-2.5 text-xs text-center">{svc.taxable ? "Yes" : "No"}</td>
                    <td className="px-5 py-2.5 text-sm font-medium text-right">${svc.total_price.toFixed(2)}</td>
                  </tr>
                ))}
                {customServices.map((cs, i) => (
                  <tr key={`cs-${i}`} className="border-b last:border-0">
                    <td className="px-5 py-2.5 text-sm">{cs.name}</td>
                    <td className="px-5 py-2.5"><span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">Custom</span></td>
                    <td className="px-5 py-2.5 text-sm text-right">{cs.quantity}</td>
                    <td className="px-5 py-2.5 text-sm text-right">${cs.price.toFixed(2)}</td>
                    <td className="px-5 py-2.5 text-xs text-center">{cs.taxable ? "Yes" : "No"}</td>
                    <td className="px-5 py-2.5 text-sm font-medium text-right">${cs.total_price.toFixed(2)}</td>
                  </tr>
                ))}
                {posServices.map((ps, i) => (
                  <tr key={`ps-${i}`} className="border-b last:border-0">
                    <td className="px-5 py-2.5 text-sm">{ps.name}</td>
                    <td className="px-5 py-2.5"><span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">POS</span></td>
                    <td className="px-5 py-2.5 text-sm text-right">1</td>
                    <td className="px-5 py-2.5 text-sm text-right">${ps.price.toFixed(2)}</td>
                    <td className="px-5 py-2.5 text-xs text-center">{ps.taxable ? "Yes" : "No"}</td>
                    <td className="px-5 py-2.5 text-sm font-medium text-right">${ps.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Summary */}
      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Payment Summary</h3>
        <div className="space-y-2 text-sm max-w-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Total Services</span><span>${totalServicesPrice.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total Items</span><span>${totalItemsPrice.toFixed(2)}</span></div>
          {ticket.processing_fee > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Processing Fee</span><span>${ticket.processing_fee.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${ticket.tax.toFixed(2)}</span></div>
          <Separator />
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span>${ticket.total_price.toFixed(2)}</span></div>
        </div>
      </div>

      {/* Notes */}
      {ticket.notes && (
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold mb-2">Notes</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{ticket.notes}</p>
        </div>
      )}

      {/* Card Details */}
      {ticket.card_details && (
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Card Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Card Holder</p>
              <p className="text-sm mt-0.5">{ticket.card_details.card_user_name}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Card Number</p>
              <p className="text-sm font-mono mt-0.5">{maskCardNumber(ticket.card_details.card_number)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Expiry</p>
              <p className="text-sm mt-0.5">{ticket.card_details.card_expiry}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">CVC</p>
              <p className="text-sm font-mono mt-0.5">{maskCVC(ticket.card_details.card_cvc)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />Print Ticket
        </Button>
        <Link href="/sales">
          <Button variant="outline"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Back to Sales</Button>
        </Link>
      </div>
    </PageShell>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm mt-0.5">{value || "N/A"}</p>
      </div>
    </div>
  );
}
