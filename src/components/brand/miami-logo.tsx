"use client";

import { cn } from "@/lib/utils";

interface MiamiLogoProps {
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

const sizes = {
  sm: "h-9 w-9",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

const SPOKES_REAR = [
  { x2: "25", y2: "32" },
  { x2: "20.5", y2: "24.21" },
  { x2: "11.5", y2: "24.21" },
  { x2: "7", y2: "32" },
  { x2: "11.5", y2: "39.79" },
  { x2: "20.5", y2: "39.79" },
];

const SPOKES_FRONT = [
  { x2: "43", y2: "32" },
  { x2: "38.5", y2: "24.21" },
  { x2: "29.5", y2: "24.21" },
  { x2: "25", y2: "32" },
  { x2: "29.5", y2: "39.79" },
  { x2: "38.5", y2: "39.79" },
];

export function MiamiLogo({ size = "md", animated = false, className }: MiamiLogoProps) {
  return (
    <div className={cn("relative flex items-center justify-center", sizes[size], className)}>
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        {/* Rear wheel */}
        <g style={animated ? { animation: "spin-wheel 3s linear infinite", transformOrigin: "16px 32px" } : undefined}>
          <circle cx="16" cy="32" r="10" stroke="currentColor" strokeWidth="1.5" className="text-primary" opacity={0.3} />
          <circle cx="16" cy="32" r="10" stroke="currentColor" strokeWidth="2" className="text-primary" strokeDasharray="4 4" />
          <circle cx="16" cy="32" r="2" fill="currentColor" className="text-primary" />
          {SPOKES_REAR.map((s, i) => (
            <line key={i} x1="16" y1="32" x2={s.x2} y2={s.y2} stroke="currentColor" strokeWidth="0.5" className="text-primary" opacity={0.4} />
          ))}
        </g>

        {/* Front wheel */}
        <g style={animated ? { animation: "spin-wheel 2.5s linear infinite", transformOrigin: "34px 32px" } : undefined}>
          <circle cx="34" cy="32" r="10" stroke="currentColor" strokeWidth="1.5" className="text-primary" opacity={0.3} />
          <circle cx="34" cy="32" r="10" stroke="currentColor" strokeWidth="2" className="text-primary" strokeDasharray="4 4" />
          <circle cx="34" cy="32" r="2" fill="currentColor" className="text-primary" />
          {SPOKES_FRONT.map((s, i) => (
            <line key={i} x1="34" y1="32" x2={s.x2} y2={s.y2} stroke="currentColor" strokeWidth="0.5" className="text-primary" opacity={0.4} />
          ))}
        </g>

        {/* Frame */}
        <path d="M16 32 L25 16 L34 32 M25 16 L16 32 M25 16 L34 32 M20 24 L34 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
        <line x1="34" y1="32" x2="34" y2="16" stroke="currentColor" strokeWidth="1.5" className="text-primary" opacity={0.6} />
        <path d="M33 14 Q36 12 38 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary" />
        <path d="M22 16 L28 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary" />
        <line x1="25" y1="16" x2="25" y2="20" stroke="currentColor" strokeWidth="1.5" className="text-primary" opacity={0.5} />
      </svg>
    </div>
  );
}
