"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

interface ChangePasswordModalProps { open: boolean; onClose: () => void; }

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { user } = useAuthStore();
  const mutation = useChangePassword();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const handleChange = async () => {
    if (!oldPw) { toast.error("Enter your current password"); return; }
    if (!newPw || newPw.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (newPw !== confirmPw) { toast.error("Passwords don't match"); return; }
    try {
      await mutation.mutateAsync({ user_id: String(user?.id || ""), old_password: oldPw, new_password: newPw, confirm_password: confirmPw });
      toast.success("Password updated");
      setOldPw(""); setNewPw(""); setConfirmPw("");
      onClose();
    } catch { toast.error("Failed to change password"); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Change Password</DialogTitle>
          <DialogDescription className="text-xs">Enter your current and new password</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Current Password</Label><Input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} className="mt-1 h-9 text-sm" /></div>
          <div><Label className="text-xs">New Password</Label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="mt-1 h-9 text-sm" /></div>
          <div><Label className="text-xs">Confirm New Password</Label><Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="mt-1 h-9 text-sm" /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleChange} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Update Password"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
