"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { SectionHeader } from "@/components/primitives/section-header";
import { useAuthStore } from "@/stores/auth-store";
import { useBranchCalendar } from "@/hooks/use-api";
import { BrandedLoader } from "@/components/brand/branded-loader";

export function DashboardCalendar() {
  const { user } = useAuthStore();
  const branch = user?.branch_name || "";
  const calendar = useBranchCalendar(branch);

  return (
    <div className="rounded-lg border bg-card p-5">
      <SectionHeader title="Branch Calendar" className="mb-4" />
      {calendar.isLoading ? (
        <BrandedLoader variant="inline" text="Loading calendar..." />
      ) : calendar.data ? (
        <div
          className="rounded-lg overflow-hidden [&_iframe]:w-full [&_iframe]:h-[400px] [&_iframe]:border-0"
          dangerouslySetInnerHTML={{ __html: calendar.data }}
        />
      ) : (
        <div className="flex items-center justify-center h-[300px] rounded-lg border border-dashed bg-muted/20">
          <div className="text-center">
            <CalendarIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Calendar not available</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">No calendar data for this branch</p>
          </div>
        </div>
      )}
    </div>
  );
}
