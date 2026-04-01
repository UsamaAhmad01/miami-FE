"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Clock, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell, PageHeader } from "@/components/primitives/page-shell";
import { StatusBadge } from "@/components/primitives/status-badge";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionStatus, useSessionAction, useSessions } from "@/hooks/use-api";
import { toast } from "sonner";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTimeOnly(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

type SessionStatus = "active" | "paused" | "completed" | null;

const STATUS_CFG: Record<string, { label: string; color: "success" | "warning" | "info" | "neutral" }> = {
  active: { label: "Active", color: "success" },
  paused: { label: "Paused", color: "warning" },
  completed: { label: "Completed", color: "info" },
};

type DateFilter = "" | "today" | "week" | "month" | "custom";

export default function TimeTrackerPage() {
  const { user } = useAuthStore();
  const userId = user?.id || 0;

  const { data: sessionStatus, isLoading: statusLoading } = useSessionStatus(userId);
  const action = useSessionAction();
  const { data: sessionsData } = useSessions(userId);
  const sessions = (sessionsData?.data || sessionsData || []) as Array<Record<string, unknown>>;

  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const status: SessionStatus = (sessionStatus?.status as SessionStatus) || null;

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilter>("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Sync elapsed from API
  useEffect(() => {
    if (sessionStatus?.elapsed_seconds) setElapsed(sessionStatus.elapsed_seconds);
  }, [sessionStatus?.elapsed_seconds]);

  // Timer tick
  useEffect(() => {
    if (status === "active") {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [status]);

  const sendAction = async (act: "start" | "pause" | "resume" | "complete") => {
    try {
      await action.mutateAsync({ userId: String(userId), action: act });
      if (act === "start") setElapsed(0);
      if (act === "complete") toast.success("Session completed!");
    } catch {
      toast.error("Action failed");
    }
  };

  // Client-side session filtering
  const filteredSessions = sessions.filter((s) => {
    // Status filter
    if (statusFilter && String(s.status) !== statusFilter) return false;

    // Date filter
    if (dateFilter && s.created_at) {
      const sessionDate = new Date(String(s.created_at));
      const now = new Date();

      if (dateFilter === "today") {
        if (sessionDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (sessionDate < weekAgo) return false;
      } else if (dateFilter === "month") {
        if (sessionDate.getMonth() !== now.getMonth() || sessionDate.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter === "custom") {
        if (startDate && sessionDate < new Date(startDate)) return false;
        if (endDate && sessionDate > new Date(endDate + "T23:59:59")) return false;
      }
    }
    return true;
  });

  const stCfg = STATUS_CFG[String(status)] || { label: "Ready", color: "neutral" as const };

  if (statusLoading) return <BrandedLoader variant="page" text="Loading timer..." />;

  return (
    <PageShell>
      <PageHeader title="Time Tracker" description="Track your work sessions" />

      {/* Timer Card */}
      <div className="flex flex-col items-center justify-center py-12 rounded-2xl border bg-card shadow-sm">
        <StatusBadge status={stCfg.color} className="mb-4">{stCfg.label}</StatusBadge>
        <p className="text-6xl font-mono font-bold tracking-tight tabular-nums">{formatTime(elapsed)}</p>
        <div className="flex items-center gap-3 mt-8">
          {(!status || status === "completed") && (
            <Button size="lg" onClick={() => sendAction("start")} className="h-12 px-8 gradient-primary text-white border-0 shadow-soft" disabled={action.isPending}>
              <Play className="h-5 w-5 mr-2" />Start
            </Button>
          )}
          {status === "active" && (
            <>
              <Button size="lg" variant="outline" onClick={() => sendAction("pause")} className="h-12 px-8" disabled={action.isPending}>
                <Pause className="h-5 w-5 mr-2" />Pause
              </Button>
              <Button size="lg" onClick={() => sendAction("complete")} className="h-12 px-8" disabled={action.isPending}>
                <Square className="h-5 w-5 mr-2" />Complete
              </Button>
            </>
          )}
          {status === "paused" && (
            <>
              <Button size="lg" onClick={() => sendAction("resume")} className="h-12 px-8" disabled={action.isPending}>
                <Play className="h-5 w-5 mr-2" />Resume
              </Button>
              <Button size="lg" variant="outline" onClick={() => sendAction("complete")} className="h-12 px-8" disabled={action.isPending}>
                <Square className="h-5 w-5 mr-2" />Complete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Sessions History */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Time Tracking History
          </h3>
          <span className="text-xs text-muted-foreground">{filteredSessions.length} sessions</span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap p-4 border-b bg-muted/20">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)} className="rounded-md border bg-background px-2 py-1.5 text-xs">
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateFilter === "custom" && (
            <>
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-7 w-36 text-xs" />
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-7 w-36 text-xs" />
              </div>
            </>
          )}

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-xs">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Sessions Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5">Date</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5">User</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5">Status</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5">Duration</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5">Start</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-2.5">End</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session, i) => {
                const sts = String(session.status || "");
                const cfg = STATUS_CFG[sts];
                return (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-sm">{formatDate(String(session.created_at || ""))}</td>
                    <td className="px-4 py-2.5 text-sm font-medium">{String(session.user_name || "—")}</td>
                    <td className="px-4 py-2.5">
                      {cfg ? <StatusBadge status={cfg.color}>{cfg.label}</StatusBadge> : <span className="text-xs">{sts}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-mono tabular-nums">{String(session.total_duration || session.duration || "00:00:00")}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatTimeOnly(String(session.start_time || ""))}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {session.end_time ? formatTimeOnly(String(session.end_time)) : <span className="text-emerald-600 text-xs font-medium">In Progress</span>}
                    </td>
                  </tr>
                );
              })}
              {filteredSessions.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No sessions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
