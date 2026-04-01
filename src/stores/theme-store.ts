import { create } from "zustand";

export interface GradientTheme {
  id: string;
  name: string;
  colors: [string, string, string];
}

export const PRESET_THEMES: GradientTheme[] = [
  {
    id: "miami",
    name: "Miami",
    colors: ["oklch(0.55 0.2 250)", "oklch(0.65 0.18 180)", "oklch(0.7 0.2 30)"],
  },
  {
    id: "sunset",
    name: "Sunset",
    colors: ["oklch(0.7 0.2 30)", "oklch(0.6 0.22 350)", "oklch(0.55 0.2 250)"],
  },
  {
    id: "ocean",
    name: "Ocean",
    colors: ["oklch(0.55 0.2 250)", "oklch(0.6 0.15 200)", "oklch(0.65 0.18 180)"],
  },
  {
    id: "neon",
    name: "Neon",
    colors: ["oklch(0.75 0.25 150)", "oklch(0.65 0.25 300)", "oklch(0.7 0.25 60)"],
  },
  {
    id: "midnight",
    name: "Midnight",
    colors: ["oklch(0.45 0.2 280)", "oklch(0.5 0.22 320)", "oklch(0.55 0.2 250)"],
  },
  {
    id: "forest",
    name: "Forest",
    colors: ["oklch(0.55 0.18 150)", "oklch(0.6 0.15 170)", "oklch(0.65 0.12 120)"],
  },
  {
    id: "rose",
    name: "Rose",
    colors: ["oklch(0.65 0.2 350)", "oklch(0.6 0.22 320)", "oklch(0.7 0.18 30)"],
  },
  {
    id: "ember",
    name: "Ember",
    colors: ["oklch(0.6 0.22 30)", "oklch(0.55 0.25 20)", "oklch(0.65 0.2 60)"],
  },
];

const DEFAULT_THEME = PRESET_THEMES[0];

function getStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

interface ThemeState {
  activeThemeId: string;
  isDark: boolean;
  customColors: [string, string, string];

  setTheme: (id: string) => void;
  toggleDarkMode: () => void;
  setCustomColors: (colors: [string, string, string]) => void;
  getActiveColors: () => [string, string, string];
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  activeThemeId: getStoredValue("miami-theme-id", "miami"),
  isDark: getStoredValue("miami-theme-dark", false),
  customColors: getStoredValue<[string, string, string]>("miami-custom-colors", [
    "oklch(0.6 0.2 280)",
    "oklch(0.65 0.2 200)",
    "oklch(0.7 0.2 120)",
  ]),
  setTheme: (id: string) => {
    set({ activeThemeId: id });
    localStorage.setItem("miami-theme-id", JSON.stringify(id));
  },

  toggleDarkMode: () => {
    const next = !get().isDark;
    set({ isDark: next });
    localStorage.setItem("miami-theme-dark", JSON.stringify(next));
  },

  setCustomColors: (colors: [string, string, string]) => {
    set({ customColors: colors, activeThemeId: "custom" });
    localStorage.setItem("miami-custom-colors", JSON.stringify(colors));
    localStorage.setItem("miami-theme-id", JSON.stringify("custom"));
  },

  getActiveColors: () => {
    const { activeThemeId, customColors } = get();
    if (activeThemeId === "custom") return customColors;
    const preset = PRESET_THEMES.find((t) => t.id === activeThemeId);
    return preset?.colors ?? DEFAULT_THEME.colors;
  },
}));
