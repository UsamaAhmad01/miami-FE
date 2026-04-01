"use client";

import { Palette, Sun, Moon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useThemeStore, PRESET_THEMES } from "@/stores/theme-store";

export function ThemeSelector() {
  const {
    activeThemeId,
    isDark,
    customColors,
    setTheme,
    toggleDarkMode,
    setCustomColors,
  } = useThemeStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="relative" />}
      >
        <Palette className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[300px] p-4 space-y-4">
        {/* Theme Presets */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Theme
          </p>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className="group relative flex flex-col items-center gap-1.5"
              >
                <div
                  className="h-10 w-full rounded-lg shadow-sm ring-1 ring-border/50 transition-all group-hover:scale-105 group-hover:shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]}, ${theme.colors[2]})`,
                  }}
                >
                  {activeThemeId === theme.id && (
                    <div className="flex h-full w-full items-center justify-center animate-fade-in">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow-sm">
                        <Check className="h-3 w-3 text-black" />
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {theme.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Custom Colors */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Custom Gradient
          </p>
          <div className="flex items-center gap-2">
            {(["Start", "Middle", "End"] as const).map((label, i) => (
              <div key={label} className="flex-1">
                <label className="text-[10px] text-muted-foreground block mb-1">{label}</label>
                <div className="relative">
                  <input
                    type="color"
                    value={oklchToHex(customColors[i])}
                    onChange={(e) => {
                      const newColors = [...customColors] as [string, string, string];
                      newColors[i] = hexToOklch(e.target.value);
                      setCustomColors(newColors);
                    }}
                    className="h-8 w-full rounded-md cursor-pointer border border-border/50"
                  />
                </div>
              </div>
            ))}
          </div>
          {activeThemeId === "custom" && (
            <div
              className="mt-2 h-6 w-full rounded-md"
              style={{
                background: `linear-gradient(135deg, ${customColors[0]}, ${customColors[1]}, ${customColors[2]})`,
              }}
            />
          )}
        </div>

        <Separator />

        {/* Toggles */}
        <div className="space-y-2">
          <ToggleRow
            icon={isDark ? Moon : Sun}
            label={isDark ? "Dark Mode" : "Light Mode"}
            active={isDark}
            onToggle={toggleDarkMode}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  active,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 text-left text-sm">{label}</span>
      <div
        className={`h-5 w-9 rounded-full transition-colors relative ${
          active ? "bg-primary" : "bg-muted"
        }`}
      >
        <div
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-[left] duration-200 ease-out"
          style={{ left: active ? 18 : 2 }}
        />
      </div>
    </button>
  );
}

// Color conversion helpers (approximate — color pickers use hex)
function oklchToHex(oklch: string): string {
  const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
  if (!match) return "#6366f1";
  const [, L, C, H] = match.map(Number);
  // Approximate conversion via HSL (not perfect but good enough for picker)
  const h = H;
  const s = Math.min(C * 200, 100);
  const l = L * 100;
  return hslToHex(h, s, l);
}

function hexToOklch(hex: string): string {
  const { h, s, l } = hexToHsl(hex);
  const L = l / 100;
  const C = Math.min(s / 200, 0.3);
  return `oklch(${L.toFixed(2)} ${C.toFixed(2)} ${Math.round(h)})`;
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return { h, s: s * 100, l: l * 100 };
}
