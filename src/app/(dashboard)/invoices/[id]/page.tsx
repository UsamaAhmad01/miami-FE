"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PageShell } from "@/components/primitives/page-shell";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { Separator } from "@/components/ui/separator";
import { useTicketByInvoice, usePricing, useBranchData, useSendPdfEmail, usePaymentHistory } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { InvoiceHeader } from "./_components/invoice-header";
import { InvoiceDetails } from "./_components/invoice-details";
import { InvoiceItemsTable } from "./_components/invoice-items-table";
import { InvoiceTotals } from "./_components/invoice-totals";
import { PaymentSection } from "./_components/payment-section";
import { Suspense } from "react";

function InvoicePageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceNumber = params.id as string;
  const isNew = searchParams.has("new");
  const { user } = useAuthStore();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const { data: ticketRaw, isLoading } = useTicketByInvoice(invoiceNumber);
  const ticket = Array.isArray(ticketRaw) ? ticketRaw[0] : ticketRaw;

  const { data: branchData } = useBranchData(user?.branch_name || "");
  const { data: pricingData } = usePricing(user?.branch_id || 0);
  const { data: paymentData } = usePaymentHistory(invoiceNumber);
  const sendEmailMutation = useSendPdfEmail();

  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  const taxRate = ticket?.tax_on_creation ?? pricingData?.tax ?? 7.0;

  // Show payment section if:
  // 1. Terminal payment explicitly enabled, OR
  // 2. Payment option is 'partial' (partial payment was selected at creation), OR
  // 3. There are existing payment records (even if terminal not enabled)
  const terminalEnabled = ticket?.terminal_payment_enabled === true;
  const isPartialPayment = ticket?.payment_option === "partial";
  const hasExistingPayments = (paymentData?.payments || []).length > 0;
  const showPaymentSection = terminalEnabled || isPartialPayment || hasExistingPayments;

  // Auto-email on new ticket
  useEffect(() => {
    if (isNew && ticket?.email) {
      const timer = setTimeout(() => handleEmailPdf(), 3000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, ticket?.email]);

  const generatePdfDataUrl = useCallback(async (): Promise<string> => {
    const el = invoiceRef.current;
    if (!el) throw new Error("Invoice element not found");
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    return pdf.output("datauristring");
  }, []);

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    setPdfGenerating(true);
    try {
      const dataUrl = await generatePdfDataUrl();
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${invoiceNumber}.pdf`;
      link.click();
      toast.success("PDF downloaded");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleEmailPdf = async () => {
    if (!ticket?.email) {
      toast.error("No customer email on this ticket");
      return;
    }
    setEmailSending(true);
    try {
      const dataUrl = await generatePdfDataUrl();
      await sendEmailMutation.mutateAsync({
        file: dataUrl,
        receiver: String(ticket.email),
        invoiceNumber,
      });
      toast.success("Invoice emailed to " + ticket.email);
    } catch {
      toast.error("Failed to send email");
    } finally {
      setEmailSending(false);
    }
  };

  const handleDymoLabel = () => {
    const win = window.open("", "_blank", "width=300,height=200");
    if (!win) return;
    win.document.write(`
      <html><head><title>Dymo Label</title>
      <style>@page { size: 72mm 25mm; margin: 0; } body { display: flex; align-items: center; justify-content: center; height: 25mm; font-family: monospace; font-size: 14px; font-weight: bold; }</style>
      </head><body>${invoiceNumber}</body></html>
    `);
    win.document.close();
    win.print();
  };

  if (isLoading) return <BrandedLoader variant="page" text="Loading invoice..." />;
  if (!ticket) return <PageShell><div className="text-center py-12 text-sm text-muted-foreground">Invoice not found</div></PageShell>;

  return (
    <PageShell>
      <InvoiceHeader
        invoiceNumber={invoiceNumber}
        onPrint={handlePrint}
        onDownloadPdf={handleDownloadPdf}
        onEmailPdf={handleEmailPdf}
        onDymoLabel={handleDymoLabel}
        emailSending={emailSending}
        pdfGenerating={pdfGenerating}
      />

      {/* Printable invoice area */}
      <div ref={invoiceRef} className="rounded-lg border bg-card p-6 space-y-6 print:border-0 print:shadow-none print:p-0">
        <InvoiceDetails branch={branchData || {}} ticket={ticket} />
        <Separator />
        <InvoiceItemsTable ticket={ticket} />
        <Separator />
        <InvoiceTotals ticket={ticket} taxRate={taxRate} />
      </div>

      {/* Payment section — shown when terminal enabled, partial payment, or existing payments */}
      {showPaymentSection && <PaymentSection invoiceNumber={invoiceNumber} />}
    </PageShell>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<BrandedLoader variant="page" text="Loading invoice..." />}>
      <InvoicePageContent />
    </Suspense>
  );
}
