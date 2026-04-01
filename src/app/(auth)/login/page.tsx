"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, Eye, EyeOff, Loader2, ArrowRight, Sun, Moon, User, Lock, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { IS_DEBUG, API_BASE_URL } from "@/lib/api";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { toast } from "sonner";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { login } = useAuthStore();
  const { isDark, toggleDarkMode } = useThemeStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Username and password are required");
      return;
    }
    setIsLoading(true);
    try {
      const redirectTo = await login(username, password);
      setShowSuccess(true);
      toast.success("Welcome back!");
      setTimeout(() => router.push(redirectTo), 1200);
    } catch (err: unknown) {
      let message = "Login failed. Please try again.";
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { detail?: string } } }).response;
        if (response?.data?.detail) message = response.data.detail;
      }
      toast.error(message);
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return <BrandedLoader variant="fullscreen" text="Preparing your workspace..." />;
  }

  return (
    <div className="flex min-h-screen">
      {/* ============ Left Panel — Branded ============ */}
      <div
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center"
        style={{ background: `linear-gradient(135deg, var(--gradient-1), var(--gradient-2))` }}
      >
        {/* Decorative shapes */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-10" style={{ background: "var(--gradient-2)" }} />
        <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-10" style={{ background: "var(--gradient-1)" }} />
        <div className="absolute top-[40%] left-[60%] w-[200px] h-[200px] rounded-full opacity-[0.06]" style={{ background: "white" }} />

        {/* Content */}
        <div className="relative z-10 px-12 text-white max-w-md">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm mb-8">
            <Bike className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight leading-tight">
            Manage your shop<br />with confidence.
          </h2>
          <p className="text-white/70 mt-4 text-sm leading-relaxed">
            Tickets, inventory, POS, reporting, and customer management — all in one place. Built for bike shops that demand more.
          </p>
          <div className="flex items-center gap-6 mt-10 text-white/50 text-xs">
            <div>
              <p className="text-2xl font-bold text-white/90">1,200+</p>
              <p>Tickets processed</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-2xl font-bold text-white/90">$180k</p>
              <p>Revenue tracked</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-2xl font-bold text-white/90">99.9%</p>
              <p>Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ Right Panel — Form ============ */}
      <div className="flex-1 flex items-center justify-center relative px-6">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-background" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, var(--muted-foreground) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Debug banner */}
        {IS_DEBUG && (
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-950/60 animate-pulse" />
            <p className="text-[10px] font-semibold text-amber-950">Test Mode — {API_BASE_URL}</p>
          </div>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:text-foreground transition-colors"
        >
          {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        {/* ---- Card ---- */}
        <div className="relative z-10 w-full max-w-[420px] animate-slide-up">
          <div className="rounded-2xl border bg-card p-8 shadow-elevated">
            {/* Header */}
            <div className="flex flex-col items-center mb-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4 lg:hidden">
                <Bike className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="lg:hidden">Miami Bikes</span>
                <span className="hidden lg:inline">Welcome back</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="lg:hidden">Sign in to your account</span>
                <span className="hidden lg:inline">Sign in to continue to Miami Bikes</span>
              </p>
            </div>

            <Separator className="mb-6" />

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-medium">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    autoFocus
                    className="h-11 pl-10 bg-muted/20 border-border/50 focus-visible:bg-background focus-visible:border-primary/50 focus-visible:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                  <button type="button" className="text-[11px] text-primary/70 hover:text-primary transition-colors">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-11 pl-10 pr-10 bg-muted/20 border-border/50 focus-visible:bg-background focus-visible:border-primary/50 focus-visible:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" />
                <span className="text-xs text-muted-foreground">Keep me logged in for 30 days</span>
              </label>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 gradient-primary text-white border-0 shadow-soft hover:shadow-elevated transition-all"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Trust footer */}
          <div className="flex items-center justify-center gap-1.5 mt-6 text-muted-foreground/40">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="text-[11px]">Secured with end-to-end encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}
