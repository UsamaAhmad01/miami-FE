"use client";

import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const { ref, inView } = useInView(0.1);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-300 ease-out",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
