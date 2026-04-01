"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Monitor } from "lucide-react";

interface Terminal {
  terminal_id: string;
  label: string;
  device_type: string;
  status: string;
}

interface TerminalSelectModalProps {
  open: boolean;
  terminals: Terminal[];
  onSelect: (terminalId: string) => void;
  onClose: () => void;
}

export function TerminalSelectModal({ open, terminals, onSelect, onClose }: TerminalSelectModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Select Terminal</DialogTitle>
          <DialogDescription className="text-xs">Choose a terminal to process the payment</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {terminals.map((t) => (
            <button
              key={t.terminal_id}
              onClick={() => onSelect(t.terminal_id)}
              className="flex items-center gap-3 w-full rounded-lg border p-3 hover:bg-muted/50 transition-colors text-left"
            >
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-[10px] text-muted-foreground">{t.device_type} — {t.status}</p>
              </div>
              <span className={`h-2 w-2 rounded-full ${t.status === "online" ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
