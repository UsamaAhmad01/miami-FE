"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Clock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { StatusBadge } from "@/components/primitives/status-badge";
import { SectionHeader } from "@/components/primitives/section-header";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionStatus, useSessionAction, useSessions } from "@/hooks/use-api";
import { toast } from "sonner";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const STATUS_LABEL: Record<string, { label: string; color: "success" | "warning" | "info" | "neutral" }> = {
  active: { label: "Active", color: "success" }, paused: { label: "Paused", color: "warning" },
  completed: { label: "Completed", color: "info" }, null: { label: "Ready", color: "neutral" },
};

export default function TimeTrackerPage() {
  const { user } = useAuthStore();
  const userId = user?.id || 0;
  const { data: sessionStatus, isLoading: statusLoading } = useSessionStatus(userId);
  const action = useSessionAction();
  const { data: sessionsData } = useSessions(userId);
  const sessions = sessionsData?.data || [];

  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const status = sessionStatus?.status || null;

  // Sync elapsed from API
  useEffect(() => {
    if (sessionStatus?.elapsed_seconds) setElapsed(sessionStatus.elapsed_seconds);
  }, [sessionStatus?.elapsed_seconds]);

  // Timer tick
  useEffect(() => {
    if (status === "active") {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else { clearInterval(intervalRef.current); }
    return () => clearInterval(intervalRef.current);
  }, [status]);

  const sendAction = async (act: "start" | "pause" | "resume" | "complete") => {
    try { await action.mutateAsync({ userId: String(userId), action: act }); if (act === "start") setElapsed(0); } catch { toast.error("Failed"); }
  };

  const stCfg = STATUS_LABEL[String(status)] || STATUS_LABEL.null;

  if (statusLoading) return <BrandedLoader variant="page" text="Loading timer..." />;

  return (
    <PageShell>
      <PageHeader title="Time Tracker" description="Track your work sessions" />

      {/* Timer */}
      <div className="flex flex-col items-center justify-center py-12 rounded-lg border bg-card">
        <StatusBadge status={stCfg.color} className="mb-4">{stCfg.label}</StatusBadge>
        <p className="text-6xl font-mono font-bold tracking-tight tabular-nums">{formatTime(elapsed)}</p>
        <div className="flex items-center gap-3 mt-8">
          {(!status || status === "completed") && <Button size="lg" onClick={() => sendAction("start")} className="h-12 px-8" disabled={action.isPending}><Play className="h-5 w-5 mr-2" />Start</Button>}
          {status === "active" && <>
            <Button size="lg" variant="outline" onClick={() => sendAction("pause")} className="h-12 px-8" disabled={action.isPending}><Pause className="h-5 w-5 mr-2" />Pause</Button>
            <Button size="lg" onClick={() => sendAction("complete")} className="h-12 px-8" disabled={action.isPending}><Square className="h-5 w-5 mr-2" />Complete</Button>
          </>}
          {status === "paused" && <>
            <Button size="lg" onClick={() => sendAction("resume")} className="h-12 px-8" disabled={action.isPending}><Play className="h-5 w-5 mr-2" />Resume</Button>
            <Button size="lg" variant="outline" onClick={() => sendAction("complete")} className="h-12 px-8" disabled={action.isPending}><Square className="h-5 w-5 mr-2" />Complete</Button>
          </>}
        </div>
      </div>

      {/* Sessions Log */}
      <div className="rounded-lg border bg-card p-5">
        <SectionHeader title="Recent Sessions" className="mb-4" />
        <div className="space-y-2">
          {sessions.map((session, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{String(session.created_at || "").split("T")[0]}</p>
                  <p className="text-xs text-muted-foreground">{String(session.user_name || "")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={STATUS_LABEL[String(session.status)]?.color || "neutral"}>{String(session.status || "")}</StatusBadge>
                <span className="text-sm font-semibold font-mono">{String(session.duration || "—")}</span>
              </div>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No sessions yet</p>}
        </div>
      </div>
    </PageShell>
  );
}
