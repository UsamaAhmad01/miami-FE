"use client";

import Link from "next/link";
import { Banknote, CreditCard, Smartphone, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaymentMethod } from "../new/_data/ticket-form-types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

const PAYMENT_OPTIONS = [
  { value: "cash" as const, label: "Cash", icon: Banknote },
  { value: "credit_card" as const, label: "Card", icon: CreditCard },
  { value: "zelle" as const, label: "Zelle", icon: Smartphone },
];

interface PaymentDetailsSectionProps {
  /** Whether the ticket already has payment records (hides method selector) */
  hasExistingPayments: boolean;
  /** Invoice number for the "View Payment History" link */
  invoiceNumber: string;

  // Payment method
  paymentMethod: PaymentMethod | "";
  onPaymentMethodChange: (method: PaymentMethod) => void;

  // Metadata fields (always visible regardless of payment state)
  validatedBy: string;
  onValidatedByChange: (val: string) => void;
  depositAmount: string;
  onDepositAmountChange: (val: string) => void;
  discountCode: string;
  onDiscountCodeChange: (val: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PaymentDetailsSection({
  hasExistingPayments,
  invoiceNumber,
  paymentMethod,
  onPaymentMethodChange,
  validatedBy,
  onValidatedByChange,
  depositAmount,
  onDepositAmountChange,
  discountCode,
  onDiscountCodeChange,
}: PaymentDetailsSectionProps) {
  return (
    <div className="space-y-4">
      {/* Metadata fields — always visible */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Validated By</Label>
          <Input
            value={validatedBy}
            onChange={(e) => onValidatedByChange(e.target.value)}
            placeholder="Validator name"
            className="mt-1 h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Deposit</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={depositAmount}
            onChange={(e) => onDepositAmountChange(e.target.value)}
            placeholder="0.00"
            className="mt-1 h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Discount Code</Label>
          <Input
            value={discountCode}
            onChange={(e) => onDiscountCodeChange(e.target.value)}
            placeholder="Enter code"
            className="mt-1 h-9 text-sm"
          />
        </div>
      </div>

      {/* Conditional: payment selector OR recorded message */}
      {hasExistingPayments ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Payment Already Recorded
              </p>
              <p className="text-xs text-blue-700/70 dark:text-blue-300/60 mt-1">
                This ticket has existing payment records. Payment method cannot be changed here.
              </p>
              <Link href={`/invoices/${invoiceNumber}`} className="inline-block mt-3">
                <Button variant="outline" size="sm" className="text-xs h-7 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                  View Payment History
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <Label className="text-xs font-medium">Payment Method</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onPaymentMethodChange(opt.value)}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-medium transition-all ${
                  paymentMethod === opt.value
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                    : "hover:bg-muted/50 hover:border-muted-foreground/20"
                }`}
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
