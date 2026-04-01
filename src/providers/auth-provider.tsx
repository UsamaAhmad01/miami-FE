"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { IS_DEBUG, API_BASE_URL } from "@/lib/api";
import { BrandedLoader } from "@/components/brand/branded-loader";

const PUBLIC_ROUTES = ["/login"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && pathname === "/login") {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Branded fullscreen loader during auth hydration
  if (isLoading && !PUBLIC_ROUTES.includes(pathname)) {
    return <BrandedLoader variant="fullscreen" text="Loading your workspace..." />;
  }

  return <>{children}</>;
}

/**
 * Debug banner — shows when NEXT_PUBLIC_DEBUG=true
 */
export function DebugBanner() {
  if (!IS_DEBUG) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-amber-950">
      <div className="h-2 w-2 rounded-full bg-amber-950/60 animate-pulse" />
      <p className="text-xs font-semibold">
        Test Mode — {API_BASE_URL}
      </p>
    </div>
  );
}
