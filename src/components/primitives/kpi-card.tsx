"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "flat";
  icon?: LucideIcon;
  sparkline?: number[];
  className?: string;
}

export function KpiCard({ title, value, change, trend, icon: Icon, sparkline, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-5 hover-lift",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/8">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          {change && (
            <div className="flex items-center gap-1 mt-1">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium",
                  trend === "up" && "text-[var(--success)]",
                  trend === "down" && "text-destructive",
                  (!trend || trend === "flat") && "text-muted-foreground"
                )}
              >
                {trend === "up" && <TrendingUp className="h-3 w-3" />}
                {trend === "down" && <TrendingDown className="h-3 w-3" />}
                {change}
              </span>
            </div>
          )}
        </div>
        {sparkline && sparkline.length > 1 && <Sparkline data={sparkline} trend={trend} />}
      </div>
    </div>
  );
}

function Sparkline({ data, trend }: { data: number[]; trend?: "up" | "down" | "flat" }) {
  const width = 64;
  const height = 28;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const color = trend === "down" ? "var(--destructive)" : "var(--primary)";

  return (
    <svg width={width} height={height} className="shrink-0 opacity-60">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
