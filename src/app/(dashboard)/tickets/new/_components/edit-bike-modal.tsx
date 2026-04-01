"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface EditBikeModalProps {
  open: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (newName: string) => void;
}

export function EditBikeModal({ open, onClose, currentName, onSave }: EditBikeModalProps) {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base">Rename Bike</DialogTitle>
          <DialogDescription className="text-xs">Enter a new name for this bike/cart</DialogDescription>
        </DialogHeader>

        <div>
          <Label className="text-xs">Bike Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 50))}
            placeholder="e.g. Road Bike"
            className="mt-1 h-9 text-sm"
            maxLength={50}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
          />
          <p className="text-[10px] text-muted-foreground mt-1">{name.length}/50 characters</p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={!name.trim()}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
