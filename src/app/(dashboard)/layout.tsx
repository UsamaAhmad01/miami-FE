"use client";

import { lazy, Suspense } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { DebugBanner } from "@/providers/auth-provider";

const CommandPalette = lazy(() =>
  import("@/components/command-palette/command-palette").then((m) => ({ default: m.CommandPalette }))
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 p-5 animate-fade-in">{children}</main>
      </SidebarInset>
      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>
      <DebugBanner />
    </SidebarProvider>
  );
}
