"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface CustomItemModalProps {
  open: boolean;
  onClose: () => void;
  processingFee: number;
  onAdd: (item: { name: string; price: number; quantity: number; taxable: boolean }) => void;
}

export function CustomItemModal({ open, onClose, processingFee, onAdd }: CustomItemModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [taxable, setTaxable] = useState(false);

  const priceNum = parseFloat(price) || 0;
  const qtyNum = parseInt(qty) || 1;
  const priceWithFee = priceNum + (priceNum * processingFee / 100);
  const lineTotal = priceWithFee * qtyNum;
  const isValid = name.trim().length > 0 && priceNum > 0 && qtyNum > 0;

  const handleAdd = () => {
    if (!isValid) return;
    onAdd({ name: name.trim(), price: priceNum, quantity: qtyNum, taxable });
    setName(""); setPrice(""); setQty("1"); setTaxable(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Add Custom Item</DialogTitle>
          <DialogDescription className="text-xs">Add a custom service or product</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Product Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Custom service name" className="mt-1 h-9 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Price ($)</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="mt-1 h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Quantity</Label>
              <Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className="mt-1 h-9 text-sm" />
            </div>
          </div>
          {processingFee > 0 && priceNum > 0 && (
            <div className="text-[11px] text-muted-foreground rounded-md bg-muted/30 px-3 py-2">
              <div className="flex justify-between">
                <span>With {processingFee}% fee:</span>
                <span className="font-medium text-foreground">${priceWithFee.toFixed(2)} each</span>
              </div>
              {qtyNum > 1 && (
                <div className="flex justify-between mt-0.5">
                  <span>Line total ({qtyNum} x ${priceWithFee.toFixed(2)}):</span>
                  <span className="font-medium text-foreground">${lineTotal.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={taxable} onChange={(e) => setTaxable(e.target.checked)} className="h-3.5 w-3.5 rounded accent-primary" />
            <span className="text-xs text-muted-foreground">Taxable</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleAdd} disabled={!isValid}>Add to Cart</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
