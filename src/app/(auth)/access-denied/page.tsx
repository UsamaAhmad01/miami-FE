"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  pos_access_denied: {
    title: "POS Access Denied",
    message: "Only Super Admins and Site Owners can access the POS system.",
  },
};

const DEFAULT_ERROR = {
  title: "Access Denied",
  message: "You don't have permission to access this page. Please contact your administrator if you believe this is an error.",
};

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error") || "";
  const { title, message } = ERROR_MESSAGES[errorCode] || DEFAULT_ERROR;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Subtle dot background */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, var(--muted-foreground) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 w-full max-w-[420px] animate-slide-up">
        <div className="rounded-2xl border bg-card p-8 shadow-elevated text-center">
          {/* Icon */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 mx-auto mb-5">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>

          {/* Title & Message */}
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-sm mx-auto">
            {message}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link href="/support">
              <Button variant="outline">Get Help</Button>
            </Link>
            <Link href="/">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <AccessDeniedContent />
    </Suspense>
  );
}
