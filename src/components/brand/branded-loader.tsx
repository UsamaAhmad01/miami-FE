"use client";

import { MiamiLogo } from "./miami-logo";
import { cn } from "@/lib/utils";

type LoaderVariant = "fullscreen" | "overlay" | "page" | "inline";

interface BrandedLoaderProps {
  variant?: LoaderVariant;
  text?: string;
  className?: string;
}

export function BrandedLoader({ variant = "page", text, className }: BrandedLoaderProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center justify-center gap-3 py-8 animate-fade-in", className)}>
        <MiamiLogo size="sm" animated />
        {text && <p className="text-xs text-muted-foreground">{text}</p>}
      </div>
    );
  }

  if (variant === "page") {
    return (
      <div className={cn("flex flex-col items-center justify-center py-24 gap-4 animate-fade-in", className)}>
        <MiamiLogo size="md" animated />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div className={cn("absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg animate-fade-in", className)}>
        <MiamiLogo size="md" animated />
        {text && <p className="text-sm text-muted-foreground mt-3">{text}</p>}
      </div>
    );
  }

  // fullscreen
  return (
    <div className={cn("fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background animate-fade-in", className)}>
      <div className="flex flex-col items-center gap-5">
        <MiamiLogo size="lg" animated />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Miami Bikes</p>
          {text && <p className="text-xs text-muted-foreground mt-1">{text}</p>}
        </div>
        {/* Progress bar */}
        <div className="w-32 h-0.5 bg-border rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-primary rounded-full" style={{ animation: "progress-slide 1.5s ease-in-out infinite" }} />
        </div>
      </div>
    </div>
  );
}
