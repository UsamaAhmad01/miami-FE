"use client";

import { useState, useEffect } from "react";
import { Banknote, CreditCard, Loader2, CheckCircle2, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/primitives/status-badge";
import { SectionHeader } from "@/components/primitives/section-header";
import { TerminalSelectModal } from "./terminal-select-modal";
import { usePaymentHistory, useRecordCashPayment, useCheckTerminal, useProcessPosPayment, usePollPaymentStatus, useCancelPayment } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

type PayTab = "cash" | "terminal";
type TerminalState = "idle" | "checking" | "waiting" | "succeeded" | "failed";

interface PaymentSectionProps {
  invoiceNumber: string;
}

export function PaymentSection({ invoiceNumber }: PaymentSectionProps) {
  const { user } = useAuthStore();
  const { data: paymentData, refetch: refetchPayments } = usePaymentHistory(invoiceNumber);

  const [tab, setTab] = useState<PayTab>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [cashNotes, setCashNotes] = useState("");
  const [terminalAmount, setTerminalAmount] = useState("");
  const [terminalState, setTerminalState] = useState<TerminalState>("idle");
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [terminals, setTerminals] = useState<Array<{ terminal_id: string; label: string; device_type: string; status: string }>>([]);
  const [pollingEnabled, setPollingEnabled] = useState(false);

  const cashMutation = useRecordCashPayment();
  const checkTerminalMutation = useCheckTerminal();
  const processPaymentMutation = useProcessPosPayment();
  const cancelMutation = useCancelPayment();
  const { data: pollData } = usePollPaymentStatus(invoiceNumber, pollingEnabled);

  // Payment summary from API
  const totalDue = Number(paymentData?.ticket?.total_due) || 0;
  const amountPaid = Number(paymentData?.ticket?.amount_paid) || 0;
  const balanceDue = Number(paymentData?.ticket?.balance_due) || 0;
  const payments = (paymentData?.payments || []) as Array<{ sequence: number; payment_method: string; amount: number; status: string; initiated_at: string; completed_at: string }>;

  // Poll result handler
  useEffect(() => {
    if (!pollData || !pollingEnabled) return;
    if (pollData.payment_status === "succeeded") {
      setTerminalState("succeeded");
      setPollingEnabled(false);
      refetchPayments();
      toast.success("Payment succeeded!");
    } else if (pollData.payment_status === "failed" || pollData.payment_status === "canceled") {
      setTerminalState("failed");
      setPollingEnabled(false);
      toast.error("Payment " + pollData.payment_status);
    }
  }, [pollData, pollingEnabled, refetchPayments]);

  // Cash payment
  const handleCashPayment = async () => {
    const amount = parseFloat(cashAmount);
    if (!amount || amount <= 0 || amount > balanceDue) {
      toast.error(`Enter an amount between $0.01 and $${balanceDue.toFixed(2)}`);
      return;
    }
    try {
      await cashMutation.mutateAsync({
        invoiceNumber,
        amount,
        paymentMethod: amount >= balanceDue ? "final" : "partial",
      });
      toast.success("Cash payment recorded");
      setCashAmount("");
      setCashNotes("");
      refetchPayments();
    } catch {
      toast.error("Failed to record payment");
    }
  };

  // Terminal payment
  const handleTerminalPayment = async () => {
    const amount = parseFloat(terminalAmount);
    if (!amount || amount < 0.50 || amount > balanceDue) {
      toast.error(`Enter an amount between $0.50 and $${balanceDue.toFixed(2)}`);
      return;
    }
    setTerminalState("checking");
    try {
      const result = await checkTerminalMutation.mutateAsync({
        invoiceNumber,
        userId: String(user?.id || ""),
      });
      if (!result.can_process || result.terminals.length === 0) {
        toast.error("No terminals available");
        setTerminalState("idle");
        return;
      }
      if (result.terminals.length > 1) {
        setTerminals(result.terminals);
        setShowTerminalModal(true);
      } else {
        processOnTerminal(result.terminals[0].terminal_id, amount);
      }
    } catch {
      toast.error("Failed to check terminal");
      setTerminalState("idle");
    }
  };

  const processOnTerminal = async (terminalId: string, amount: number) => {
    setShowTerminalModal(false);
    setTerminalState("waiting");
    try {
      await processPaymentMutation.mutateAsync({
        invoice_number: invoiceNumber,
        amount,
        payment_method: "credit_card",
        branch_id: String(user?.branch_id || ""),
        user_id: String(user?.id || ""),
      });
      setPollingEnabled(true);
    } catch {
      toast.error("Failed to send to terminal");
      setTerminalState("idle");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(invoiceNumber);
      setTerminalState("idle");
      setPollingEnabled(false);
      toast.info("Payment cancelled");
    } catch {
      toast.error("Failed to cancel");
    }
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-5 border-b">
        <SectionHeader title="Payment Processing" />
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-3 gap-4 p-5 border-b">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Total Due</p>
          <p className="text-lg font-bold">${totalDue.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Paid</p>
          <p className="text-lg font-bold text-emerald-600">${amountPaid.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Balance</p>
          <p className={`text-lg font-bold ${balanceDue <= 0 ? "text-emerald-600" : "text-destructive"}`}>${balanceDue.toFixed(2)}</p>
        </div>
      </div>

      {/* Payment Form */}
      {balanceDue > 0 && (
        <div className="p-5 border-b">
          {/* Tabs */}
          <div className="flex items-center rounded-md border bg-muted/40 p-0.5 mb-4 w-fit">
            <button onClick={() => setTab("cash")} className={`rounded-sm px-4 py-1.5 text-xs font-medium transition-colors ${tab === "cash" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
              <Banknote className="h-3.5 w-3.5 inline mr-1.5" />Cash
            </button>
            <button onClick={() => setTab("terminal")} className={`rounded-sm px-4 py-1.5 text-xs font-medium transition-colors ${tab === "terminal" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
              <CreditCard className="h-3.5 w-3.5 inline mr-1.5" />Terminal
            </button>
          </div>

          {tab === "cash" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Amount</Label><Input type="number" step="0.01" max={balanceDue} value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder={`Max $${balanceDue.toFixed(2)}`} className="mt-1 h-9 text-sm" /></div>
                <div><Label className="text-xs">Notes (optional)</Label><Input value={cashNotes} onChange={(e) => setCashNotes(e.target.value)} placeholder="Payment notes" className="mt-1 h-9 text-sm" /></div>
              </div>
              <Button size="sm" onClick={handleCashPayment} disabled={cashMutation.isPending}>
                {cashMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Banknote className="h-3.5 w-3.5 mr-1.5" />}
                Record Cash Payment
              </Button>
            </div>
          )}

          {tab === "terminal" && (
            <div className="space-y-3">
              {terminalState === "idle" && (
                <>
                  <div className="max-w-xs">
                    <Label className="text-xs">Amount (min $0.50)</Label>
                    <Input type="number" step="0.01" min={0.50} max={balanceDue} value={terminalAmount} onChange={(e) => setTerminalAmount(e.target.value)} placeholder={`Max $${balanceDue.toFixed(2)}`} className="mt-1 h-9 text-sm" />
                  </div>
                  <Button size="sm" onClick={handleTerminalPayment} disabled={checkTerminalMutation.isPending}>
                    {checkTerminalMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CreditCard className="h-3.5 w-3.5 mr-1.5" />}
                    Send to Terminal
                  </Button>
                </>
              )}
              {terminalState === "checking" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Checking terminal availability...</div>
              )}
              {terminalState === "waiting" && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-sm font-medium">Waiting for customer...</p>
                  <p className="text-xs text-muted-foreground">Present terminal to customer for payment</p>
                  <Button variant="outline" size="sm" onClick={handleCancel}><X className="h-3 w-3 mr-1" />Cancel</Button>
                </div>
              )}
              {terminalState === "succeeded" && (
                <div className="flex flex-col items-center gap-2 py-6">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  <p className="text-sm font-semibold text-emerald-600">Payment Succeeded</p>
                  <Button size="sm" variant="outline" onClick={() => setTerminalState("idle")}>Process Another</Button>
                </div>
              )}
              {terminalState === "failed" && (
                <div className="flex flex-col items-center gap-2 py-6">
                  <XCircle className="h-8 w-8 text-destructive" />
                  <p className="text-sm font-semibold text-destructive">Payment Failed</p>
                  <Button size="sm" variant="outline" onClick={() => setTerminalState("idle")}>Try Again</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="p-5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Payment History</p>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2">#</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2">Type</th>
                <th className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2">Amount</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2">Status</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.sequence} className="border-b last:border-0">
                  <td className="px-3 py-2 text-xs">{p.sequence}</td>
                  <td className="px-3 py-2 text-xs capitalize">{p.payment_method === "cash" ? "Cash" : "Card"}</td>
                  <td className="px-3 py-2 text-sm font-medium text-right">${Number(p.amount).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={p.status === "succeeded" ? "success" : "error"}>
                      {p.status === "succeeded" ? "Succeeded" : "Failed"}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(p.completed_at || p.initiated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TerminalSelectModal
        open={showTerminalModal}
        terminals={terminals}
        onSelect={(id) => processOnTerminal(id, parseFloat(terminalAmount))}
        onClose={() => { setShowTerminalModal(false); setTerminalState("idle"); }}
      />
    </div>
  );
}
