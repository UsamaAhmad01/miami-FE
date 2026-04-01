"use client";

import { useMemo } from "react";
import { useThemeStore, PRESET_THEMES } from "@/stores/theme-store";

export function useThemeColors() {
  const { activeThemeId, customColors } = useThemeStore();

  return useMemo(() => {
    let colors: [string, string, string];
    if (activeThemeId === "custom") {
      colors = customColors;
    } else {
      const preset = PRESET_THEMES.find((t) => t.id === activeThemeId);
      colors = preset?.colors ?? PRESET_THEMES[0].colors;
    }

    return { color1: colors[0], color2: colors[1], color3: colors[2] };
  }, [activeThemeId, customColors]);
}
