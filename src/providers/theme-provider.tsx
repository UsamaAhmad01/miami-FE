"use client";

import { useEffect } from "react";
import { useThemeStore, PRESET_THEMES } from "@/stores/theme-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { activeThemeId, isDark, customColors } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;

    // Resolve colors
    let colors: [string, string, string];
    if (activeThemeId === "custom") {
      colors = customColors;
    } else {
      const preset = PRESET_THEMES.find((t) => t.id === activeThemeId);
      colors = preset?.colors ?? PRESET_THEMES[0].colors;
    }

    // Set gradient CSS variables
    root.style.setProperty("--gradient-1", colors[0]);
    root.style.setProperty("--gradient-2", colors[1]);
    root.style.setProperty("--gradient-3", colors[2]);

    // Dark mode
    root.classList.toggle("dark", isDark);
  }, [activeThemeId, isDark, customColors]);

  return <>{children}</>;
}
