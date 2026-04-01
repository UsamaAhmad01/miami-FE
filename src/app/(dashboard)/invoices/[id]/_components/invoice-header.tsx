"use client";

import { Printer, Download, Mail, Tag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface InvoiceHeaderProps {
  invoiceNumber: string;
  onPrint: () => void;
  onDownloadPdf: () => void;
  onEmailPdf: () => void;
  onDymoLabel: () => void;
  emailSending?: boolean;
  pdfGenerating?: boolean;
}

export function InvoiceHeader({ invoiceNumber, onPrint, onDownloadPdf, onEmailPdf, onDymoLabel, emailSending, pdfGenerating }: InvoiceHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
      <div className="flex items-center gap-3">
        <Link href="/tickets"><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Invoice</h1>
          <p className="text-xs text-muted-foreground font-mono">{invoiceNumber}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrint}><Printer className="h-3.5 w-3.5 mr-1.5" />Print</Button>
        <Button variant="outline" size="sm" onClick={onDownloadPdf} disabled={pdfGenerating}><Download className="h-3.5 w-3.5 mr-1.5" />{pdfGenerating ? "Generating..." : "PDF"}</Button>
        <Button variant="outline" size="sm" onClick={onEmailPdf} disabled={emailSending}><Mail className="h-3.5 w-3.5 mr-1.5" />{emailSending ? "Sending..." : "Email"}</Button>
        <Button variant="outline" size="sm" onClick={onDymoLabel}><Tag className="h-3.5 w-3.5 mr-1.5" />Dymo</Button>
      </div>
    </div>
  );
}
