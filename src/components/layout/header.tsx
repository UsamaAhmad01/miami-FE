"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, Search, ChevronRight, ShoppingCart, X, User, LogOut, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeSelector } from "@/components/layout/theme-selector";
import { useAuthStore } from "@/stores/auth-store";
import { useCartItems, useRemoveCartItem } from "@/hooks/use-api";

// ─── Page name map ───
const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/tickets": "Tickets",
  "/pos": "Point of Sale",
  "/customers": "Customers",
  "/calendar": "Calendar",
  "/inventory": "Inventory",
  "/orders": "Orders",
  "/invoices": "Invoices",
  "/reporting": "Reporting",
  "/time-tracker": "Time Tracker",
  "/bulk-email": "Bulk Email",
  "/settings": "Settings",
  "/stripe-setup": "Stripe Setup",
  "/stripe-success": "Stripe Success",
  "/sales": "Sales",
  "/cart": "Shopping Cart",
  "/watchlist": "Watch List",
};

// ─── Access rights that can see the cart ───
const CART_VISIBLE_RIGHTS = new Set(["All", "Wholesale", "CRM+Wholesale", "OrderManager+Wholesale"]);

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const pageName = pageNames[pathname] || pathname.split("/").pop() || "Dashboard";

  const showCart = user?.access_rights ? CART_VISIBLE_RIGHTS.has(user.access_rights) : true;
  const cart = useCartItems(user?.id || 0);
  const cartItems: CartItem[] = (cart.data?.cart_items || []).map((item) => ({
    id: item.vendor_product_id,
    title: item.title,
    vendor: item.vendor,
    quantity: item.quantity,
    price: item.base_price,
    image: item.images?.[0] || "",
  }));
  const cartTotal = cart.data?.total_cart_price || 0;

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b bg-background/95 backdrop-blur-sm px-3">
      <SidebarTrigger className="-ml-1 h-7 w-7" />
      <Separator orientation="vertical" className="h-4" />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        <span className="text-muted-foreground text-xs">Miami Bikes</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
        <span className="text-xs font-medium">{pageName}</span>
      </nav>

      {/* Search trigger */}
      <button
        onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
        className="flex ml-auto max-w-xs items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/60 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs hidden sm:inline">Search...</span>
        <kbd className="pointer-events-none text-[10px] font-mono text-muted-foreground/50 border rounded px-1 py-0.5 bg-background hidden sm:inline">⌘K</kbd>
      </button>

      <div className="flex items-center gap-1">
        {/* Connection status */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mr-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" style={{ animationDuration: "3s" }} />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="hidden md:inline">Connected</span>
        </div>

        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
        </Button>

        {/* Mini Cart */}
        {showCart && <MiniCart items={cartItems} total={cartTotal} />}

        {/* Theme selector */}
        <ThemeSelector />

        {/* User dropdown */}
        <UserDropdown />
      </div>
    </header>
  );
}

// ─── Mini Cart Dropdown ───

interface CartItem {
  id: string;
  title: string;
  vendor: string;
  quantity: number;
  price: number;
  image: string;
}

function MiniCart({ items, total }: { items: CartItem[]; total: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const removeItem = useRemoveCartItem();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={() => setOpen(!open)}>
        <ShoppingCart className="h-4 w-4" />
        {items.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground px-1">
            {items.length}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-card shadow-elevated animate-slide-up z-50">
          <div className="p-3 border-b">
            <p className="text-xs font-semibold">Shopping Cart ({items.length})</p>
          </div>

          {items.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Cart is empty</div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto divide-y">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3">
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">{item.vendor}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.quantity} × ${item.price.toFixed(2)}</p>
                    </div>
                    <button onClick={() => removeItem.mutate(item.id)} className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors shrink-0">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-semibold">${total.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <Link href="/cart" className="flex-1" onClick={() => setOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full text-xs">View Cart</Button>
                  </Link>
                  <Link href="/cart" className="flex-1" onClick={() => setOpen(false)}>
                    <Button size="sm" className="w-full text-xs">Checkout</Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── User Dropdown ───

function UserDropdown() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50 transition-colors"
      >
        <Avatar className="h-6 w-6">
          <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-semibold">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium hidden md:inline">
          Hi, {user?.first_name || "there"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-card shadow-elevated animate-slide-up z-50">
          <div className="p-3 border-b">
            <p className="text-xs font-semibold">{user?.first_name} {user?.last_name}</p>
            <p className="text-[10px] text-muted-foreground">{user?.role} — {user?.branch_name}</p>
          </div>
          <div className="p-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
            >
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
            >
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              Settings
            </Link>
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-muted/50 transition-colors text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
