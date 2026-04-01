"use client";

import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface PlaceOrderModalProps {
  open: boolean;
  onClose: () => void;
  userInfo: Record<string, unknown> | undefined;
  onConfirm: () => void;
  loading: boolean;
}

export function PlaceOrderModal({ open, onClose, userInfo, onConfirm, loading }: PlaceOrderModalProps) {
  if (!userInfo) return null;
  const fields = [
    { label: "First Name", value: userInfo.first_name },
    { label: "Last Name", value: userInfo.last_name },
    { label: "Email", value: userInfo.email },
    { label: "Phone", value: userInfo.phone_number || userInfo.phone },
    { label: "Address", value: userInfo.address_1 || userInfo.address },
    { label: "City", value: userInfo.city },
    { label: "State", value: userInfo.state },
    { label: "ZIP", value: userInfo.zip },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Confirm Order</DialogTitle>
          <DialogDescription className="text-xs">Review your information before placing the order</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.label}>
              <Label className="text-[10px] text-muted-foreground">{f.label}</Label>
              <Input value={String(f.value || "")} disabled className="mt-0.5 h-8 text-xs bg-muted/30" />
            </div>
          ))}
        </div>
        <Link href="/settings" className="text-xs text-primary hover:underline">Edit profile information</Link>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onConfirm} disabled={loading} className="gradient-primary text-white border-0">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Yes, Confirm Order"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
