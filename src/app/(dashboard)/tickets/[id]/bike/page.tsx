"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Printer, ArrowLeft, Bike, User, Mail, Phone, MapPin, FileText, Calendar,
  Building2, Shield, AlertTriangle, Wrench, Package, Pencil, Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/primitives/status-badge";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { useTicketByInvoice } from "@/hooks/use-api";
import { BrandedLoader } from "@/components/brand/branded-loader";

function formatDate(d: string): string {
  if (!d) return "N/A";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " at " +
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatPayment(m: string): string {
  const map: Record<string, string> = { cash: "Cash", credit_card: "Credit Card", zelle: "Zelle", partial: "Partial", check: "Check" };
  return map[m] || m || "N/A";
}

const TYPE_TAGS: Record<string, { label: string; color: string }> = {
  inventory: { label: "Inventory", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  custom: { label: "Custom", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  service: { label: "Service", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
};

type TicketItem = { name?: string; item_name?: string; quantity?: number; price?: number; taxable?: boolean; upc_ean?: string };

export default function BikeTicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const { data: ticket, isLoading } = useTicketByInvoice(ticketId);

  if (isLoading) return <BrandedLoader variant="page" text="Loading ticket..." />;
  if (!ticket) return <PageShell><div className="text-center py-12 text-sm text-muted-foreground">Ticket not found</div></PageShell>;

  if (ticket.is_pos) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 mb-4">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold">POS Transaction</h2>
          <p className="text-sm text-muted-foreground mt-1">This is a POS transaction. Please use the POS details page.</p>
          <Link href="/tickets" className="mt-4"><Button variant="outline" size="sm">Back to Tickets</Button></Link>
        </div>
      </PageShell>
    );
  }

  const totalPrice = Number(ticket.total_price) || 0;
  const taxAmount = Number(ticket.tax) || 0;
  const subtotal = totalPrice - taxAmount;
  const discount = Number(ticket.discount_amount) || 0;
  const credit = Number(ticket.credited_amount) || 0;
  const invoiceNum = ticket.automatic_generated_invoice_number || ticketId;
  const isMultiBike = ticket.enable_multiple_bikes === true;
  const bikes = (isMultiBike && ticket.bikes_data?.bikes) ? (ticket.bikes_data.bikes as Array<Record<string, unknown>>) : [];

  return (
    <PageShell>
      <PageHeader
        title={`Ticket #${invoiceNum}`}
        description={ticket.description || undefined}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status="success" dot={false}>Bike Ticket</StatusBadge>
            <StatusBadge status={ticket.status === "Completed" ? "success" : ticket.status === "Cancelled" ? "error" : "warning"}>
              {ticket.status || "Pending"}
            </StatusBadge>
            <StatusBadge status={ticket.payment_status === "Paid" ? "success" : ticket.payment_status === "Refunded" ? "error" : "warning"}>
              {ticket.payment_status || "Unpaid"}
            </StatusBadge>
          </div>
        }
      />

      {/* Quick Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link href={`/tickets/${invoiceNum}/edit`}><Button size="sm"><Pencil className="h-3.5 w-3.5 mr-1.5" />Edit Ticket</Button></Link>
        <Link href={`/invoices/${invoiceNum}`}><Button variant="outline" size="sm"><Receipt className="h-3.5 w-3.5 mr-1.5" />View Invoice</Button></Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1.5" />Print</Button>
        <Link href="/tickets" className="ml-auto"><Button variant="ghost" size="sm"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Back</Button></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer Info */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Customer Information</h3>
          <div className="space-y-3">
            <InfoRow icon={User} label="Name" value={ticket.name} />
            <InfoRow icon={Phone} label="Phone" value={ticket.phone_no} />
            <InfoRow icon={Mail} label="Email" value={ticket.email} />
            <InfoRow icon={MapPin} label="Address" value={ticket.address} />
          </div>
        </div>

        {/* Ticket Info */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Ticket Information</h3>
          <div className="space-y-3">
            <InfoRow icon={Calendar} label="Delivery Date" value={ticket.delivery_date || "Not set"} />
            <InfoRow icon={Calendar} label="Created" value={formatDate(ticket.created_at)} />
            <InfoRow icon={Building2} label="Branch" value={ticket.branch} />
            <InfoRow icon={Shield} label="Payment" value={formatPayment(ticket.payment_option)} />
            <InfoRow icon={User} label="Mechanic" value={ticket.mechanic || "Unassigned"} />
            {ticket.special_order === "Yes" && (
              <InfoRow icon={AlertTriangle} label="Special Order" value="Yes" />
            )}
          </div>
        </div>
      </div>

      {/* Items & Services — multi-bike or single */}
      <div className="rounded-lg border bg-card">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold">Items & Services</h3>
          {isMultiBike && <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{bikes.length} bikes</span>}
        </div>

        {isMultiBike ? (
          /* Multi-bike: render per-bike sections */
          <div className="divide-y">
            {bikes.map((bike, bikeIdx) => {
              const bikeName = (bike.bike_name as string) || `Bike ${bikeIdx + 1}`;
              const svcList = (bike.services || []) as TicketItem[];
              const customList = (bike.custom_services || []) as TicketItem[];
              const invList = (bike.inventory_items || []) as TicketItem[];
              const count = svcList.length + customList.length + invList.length;

              return (
                <div key={bikeIdx}>
                  <div className="flex items-center gap-2 px-5 py-3 bg-muted/30">
                    <Bike className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold">{bikeName}</span>
                    <span className="text-[10px] text-muted-foreground">({count} items)</span>
                  </div>
                  {count === 0 ? (
                    <div className="px-5 py-4 text-xs text-muted-foreground text-center">No items</div>
                  ) : (
                    <ItemsTable services={svcList} customs={customList} inventory={invList} />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Single bike: flat table */
          <ItemsTable
            services={(ticket.services || []) as TicketItem[]}
            customs={(ticket.custom_services || []) as TicketItem[]}
            inventory={(ticket.inventory_items || []) as TicketItem[]}
          />
        )}
      </div>

      {/* Payment Summary */}
      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Payment Summary</h3>
        <div className="space-y-2 text-sm max-w-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="tabular-nums">${taxAmount.toFixed(2)}</span></div>
          {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span className="tabular-nums">-${discount.toFixed(2)}</span></div>}
          {credit > 0 && <div className="flex justify-between text-emerald-600"><span>Credit Applied</span><span className="tabular-nums">-${credit.toFixed(2)}</span></div>}
          <Separator />
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="tabular-nums">${totalPrice.toFixed(2)}</span></div>
        </div>
      </div>

      {/* Notes */}
      {ticket.notes && (
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold mb-2">Notes</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{ticket.notes}</p>
        </div>
      )}
    </PageShell>
  );
}

/* ── Sub-components ── */

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

function ItemsTable({ services, customs, inventory }: { services: TicketItem[]; customs: TicketItem[]; inventory: TicketItem[] }) {
  const hasItems = services.length > 0 || customs.length > 0 || inventory.length > 0;
  if (!hasItems) return <div className="px-5 py-6 text-xs text-muted-foreground text-center">No items</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left text-[11px] font-medium text-muted-foreground px-5 py-2.5">Item</th>
            <th className="text-left text-[11px] font-medium text-muted-foreground px-5 py-2.5">Type</th>
            <th className="text-right text-[11px] font-medium text-muted-foreground px-5 py-2.5">Qty</th>
            <th className="text-right text-[11px] font-medium text-muted-foreground px-5 py-2.5">Price</th>
            <th className="text-center text-[11px] font-medium text-muted-foreground px-5 py-2.5">Tax</th>
            <th className="text-right text-[11px] font-medium text-muted-foreground px-5 py-2.5">Total</th>
          </tr>
        </thead>
        <tbody>
          {services.map((svc, i) => {
            const price = Number(svc.price) || 0;
            return <ItemRow key={`s-${i}`} name={svc.name || "Service"} type="service" qty={1} price={price} taxable={!!svc.taxable} total={price} />;
          })}
          {customs.map((c, i) => {
            const price = Number(c.price) || 0;
            const qty = Number(c.quantity) || 1;
            return <ItemRow key={`c-${i}`} name={c.name || "Custom"} type="custom" qty={qty} price={price} taxable={!!c.taxable} total={price * qty} />;
          })}
          {inventory.map((inv, i) => {
            const price = Number(inv.price) || 0;
            const qty = Number(inv.quantity) || 1;
            return <ItemRow key={`i-${i}`} name={inv.item_name || inv.name || "Item"} type="inventory" qty={qty} price={price} taxable={inv.taxable !== false} total={price * qty} />;
          })}
        </tbody>
      </table>
    </div>
  );
}

function ItemRow({ name, type, qty, price, taxable, total }: { name: string; type: string; qty: number; price: number; taxable: boolean; total: number }) {
  const tag = TYPE_TAGS[type];
  return (
    <tr className="border-b last:border-0 hover:bg-muted/20 transition-colors">
      <td className="px-5 py-2.5 text-sm">{name}</td>
      <td className="px-5 py-2.5"><span className={`text-[10px] rounded px-1.5 py-0.5 font-medium ${tag.color}`}>{tag.label}</span></td>
      <td className="px-5 py-2.5 text-sm text-right tabular-nums">{qty}</td>
      <td className="px-5 py-2.5 text-sm text-right tabular-nums">${price.toFixed(2)}</td>
      <td className="px-5 py-2.5 text-xs text-center">{taxable ? "Yes" : "—"}</td>
      <td className="px-5 py-2.5 text-sm font-medium text-right tabular-nums">${total.toFixed(2)}</td>
    </tr>
  );
}
