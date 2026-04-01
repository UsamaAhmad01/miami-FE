"use client";

import { useState, useEffect, useRef } from "react";
import { CreditCard, Loader2, CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TerminalSelectModal } from "@/app/(dashboard)/invoices/[id]/_components/terminal-select-modal";
import { useCheckTerminal, useProcessPosPayment, usePollPosPaymentStatus, useCancelPayment } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

type FlowState = "idle" | "checking" | "selecting" | "processing" | "succeeded" | "failed" | "timeout";

interface PosPaymentFlowProps {
  invoiceNumber: string;
  totalAmount: number;
  customerEmail: string;
}

const MAX_POLL_ATTEMPTS = 60;

export function PosPaymentFlow({ invoiceNumber, totalAmount, customerEmail }: PosPaymentFlowProps) {
  const { user } = useAuthStore();
  const [state, setState] = useState<FlowState>("idle");
  const [terminals, setTerminals] = useState<Array<{ terminal_id: string; label: string; device_type: string; status: string }>>([]);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [cardDetails, setCardDetails] = useState<{ brand: string; last_four: string } | null>(null);
  const [failureMessage, setFailureMessage] = useState("");
  const pollCount = useRef(0);

  const checkTerminal = useCheckTerminal();
  const processPayment = useProcessPosPayment();
  const cancelPayment = useCancelPayment();
  const { data: pollData } = usePollPosPaymentStatus(invoiceNumber, pollingEnabled);

  // Handle poll results
  useEffect(() => {
    if (!pollData || !pollingEnabled) return;
    pollCount.current++;

    if (pollData.payment_status === "succeeded") {
      setState("succeeded");
      setPollingEnabled(false);
      setCardDetails(pollData.card_details || null);
      toast.success("Payment successful!");
    } else if (pollData.payment_status === "failed" || pollData.payment_status === "canceled") {
      setState("failed");
      setPollingEnabled(false);
      setFailureMessage(pollData.failure_message || "Payment was " + pollData.payment_status);
    }

    if (pollCount.current >= MAX_POLL_ATTEMPTS) {
      setState("timeout");
      setPollingEnabled(false);
    }
  }, [pollData, pollingEnabled]);

  const handleProcessPayment = async () => {
    if (!user?.id) return;
    setState("checking");
    try {
      const result = await checkTerminal.mutateAsync({ invoiceNumber, userId: String(user.id) });
      if (!result.can_process || result.terminals.length === 0) {
        toast.error(result.terminals.length === 0 ? "No terminals available" : "Cannot process payment");
        setState("idle");
        return;
      }
      if (result.terminals.length > 1) {
        setTerminals(result.terminals);
        setState("selecting");
      } else {
        sendToTerminal(result.terminals[0].terminal_id);
      }
    } catch {
      toast.error("Failed to check terminal availability");
      setState("idle");
    }
  };

  const sendToTerminal = async (terminalId: string) => {
    setState("processing");
    pollCount.current = 0;
    try {
      await processPayment.mutateAsync({
        invoice_number: invoiceNumber,
        terminal_id: terminalId,
        user_id: String(user?.id || ""),
        enable_tipping: true,
        receipt_email: customerEmail || undefined,
      });
      setPollingEnabled(true);
    } catch {
      toast.error("Failed to send to terminal");
      setState("idle");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelPayment.mutateAsync(invoiceNumber);
      setPollingEnabled(false);
      setState("idle");
      toast.info("Payment cancelled");
    } catch {
      toast.error("Failed to cancel payment");
    }
  };

  const handleRetry = () => {
    setState("idle");
    setFailureMessage("");
    setCardDetails(null);
  };

  if (state === "idle") {
    return (
      <Button onClick={handleProcessPayment} className="gradient-primary text-white border-0 shadow-soft">
        <CreditCard className="h-4 w-4 mr-2" />
        Process Payment — ${totalAmount.toFixed(2)}
      </Button>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      {/* Checking */}
      {state === "checking" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Checking Terminal...</p>
          <p className="text-xs text-muted-foreground">Verifying terminal availability...</p>
          <Button variant="outline" size="sm" onClick={() => setState("idle")}><X className="h-3 w-3 mr-1" />Cancel</Button>
        </div>
      )}

      {/* Selecting terminal */}
      {state === "selecting" && (
        <TerminalSelectModal
          open={true}
          terminals={terminals}
          onSelect={(id) => sendToTerminal(id)}
          onClose={() => setState("idle")}
        />
      )}

      {/* Processing / Polling */}
      {state === "processing" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="h-12 w-12 rounded-full border-3 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-semibold">Processing Payment</p>
          <p className="text-xs text-muted-foreground">Waiting for customer to tap/insert card...</p>
          <Button variant="outline" size="sm" onClick={handleCancel}><X className="h-3 w-3 mr-1" />Cancel</Button>
        </div>
      )}

      {/* Success */}
      {state === "succeeded" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <p className="text-lg font-semibold text-emerald-600">Payment Successful!</p>
          {cardDetails && (
            <p className="text-sm text-muted-foreground capitalize">
              {cardDetails.brand} ending in {cardDetails.last_four}
            </p>
          )}
          <Link href="/pos"><Button className="mt-2">New POS</Button></Link>
        </div>
      )}

      {/* Failed */}
      {state === "failed" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <XCircle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-semibold text-destructive">Payment Failed</p>
          <p className="text-sm text-muted-foreground">{failureMessage}</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setState("idle")}>Cancel</Button>
            <Button size="sm" onClick={handleRetry}>Retry</Button>
          </div>
        </div>
      )}

      {/* Timeout */}
      {state === "timeout" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <p className="text-lg font-semibold">Payment Timed Out</p>
          <p className="text-sm text-muted-foreground">No response from terminal after 2 minutes</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setState("idle")}>Cancel</Button>
            <Button size="sm" onClick={handleRetry}>Retry</Button>
          </div>
        </div>
      )}
    </div>
  );
}
