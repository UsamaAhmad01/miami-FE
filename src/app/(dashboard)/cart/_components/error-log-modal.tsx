"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ErrorLogModalProps { open: boolean; onClose: () => void; }

export function ErrorLogModal({ open, onClose }: ErrorLogModalProps) {
  let errors: Array<Record<string, string>> = [];
  try { errors = JSON.parse(localStorage.getItem("importErrors") || "[]"); } catch { /* ignore */ }

  const partial = errors.filter((e) => Object.values(e).some((v) => v.startsWith("Remaining") || v.startsWith("Not enough")));
  const failed = errors.filter((e) => !Object.values(e).some((v) => v.startsWith("Remaining") || v.startsWith("Not enough")));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Import Error Log</DialogTitle>
          <DialogDescription className="text-xs">Errors from the last import</DialogDescription>
        </DialogHeader>
        <div className="flex gap-4 text-center text-xs mb-3">
          <div><p className="text-muted-foreground">Partial</p><p className="text-lg font-bold text-amber-500">{partial.length}</p></div>
          <div><p className="text-muted-foreground">Failed</p><p className="text-lg font-bold text-destructive">{failed.length}</p></div>
        </div>
        {errors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No errors</p>
        ) : (
          <div className="max-h-48 overflow-y-auto divide-y">
            {errors.map((err, i) => {
              const [upc, msg] = Object.entries(err)[0] || ["?", "Unknown error"];
              return (
                <div key={i} className="flex items-center justify-between py-2 px-1 text-xs">
                  <span className="font-mono">{upc}</span>
                  <span className="text-muted-foreground text-right max-w-[200px] truncate">{msg}</span>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
