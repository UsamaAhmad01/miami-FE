"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Wrench, Package, ShoppingCart, CreditCard, BarChart3,
  Users, LogOut, Bike, Plus, ChevronDown, ChevronRight, Clock, FileText,
  Mail, Settings, HelpCircle, Loader2, Eye, ShieldCheck, DollarSign,
  Truck, Bookmark, ReceiptText,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore, type AccessRights, type UserRole } from "@/stores/auth-store";
import { api } from "@/lib/api";
import { toast } from "sonner";

// ─── Menu Definition ───

interface NavItem {
  id: string;
  title: string;
  href?: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  children?: NavItem[];
  onClick?: () => void;
}

function buildMenu(): NavItem[] {
  return [
    {
      id: "dashboard", title: "Dashboard", icon: LayoutDashboard, children: [
        { id: "analytics", title: "Analytics", href: "/", icon: LayoutDashboard },
        { id: "time-tracker", title: "Time Tracker", href: "/time-tracker", icon: Clock },
      ],
    },
    {
      id: "work-orders", title: "Work Orders", icon: Wrench, children: [
        { id: "tickets", title: "Tickets", href: "/tickets", icon: Wrench },
        { id: "sales", title: "Sales", href: "/sales", icon: DollarSign },
      ],
    },
    {
      id: "merchandise", title: "Merchandise", icon: Package, children: [
        { id: "products", title: "All Products", href: "/products?stock=yes", icon: Package },
        { id: "merch-orders", title: "Orders", href: "/orders", icon: ShoppingCart },
        { id: "cart", title: "Shopping Cart", href: "/cart", icon: ShoppingCart },
        { id: "watchlist", title: "Watch List", href: "/watchlist", icon: Bookmark },
        { id: "receivings", title: "Receivings", href: "/orders/receiving", icon: Truck },
      ],
    },
    { id: "bulk-email", title: "Bulk Email", href: "/bulk-email", icon: Mail },
    {
      id: "super-admin", title: "Super Admin", icon: ShieldCheck, children: [
        { id: "admin-orders", title: "Orders Manager", href: "/admin/orders", icon: ShoppingCart },
        { id: "tax-certs", title: "Tax Certificates", href: "/admin/tax-certificates", icon: ReceiptText },
      ],
    },
    { id: "customers", title: "Customers", href: "/customers", icon: Users },
    { id: "inventory-mgmt", title: "Inventory", href: "/inventory", icon: Package },
    {
      id: "reports", title: "Reports", icon: BarChart3, children: [
        { id: "reports-overview", title: "Overview", href: "/reporting", icon: BarChart3 },
        { id: "reports-tickets", title: "Ticket Sales", href: "/reporting/ticket-sales", icon: Wrench },
        { id: "reports-products", title: "Product Sales", href: "/reporting/product-sales", icon: Package },
        { id: "reports-tax", title: "Tax & Payments", href: "/reporting/tax-payments", icon: DollarSign },
        { id: "reports-employees", title: "Employee Performance", href: "/reporting/employees", icon: Users },
      ],
    },
    { id: "pos", title: "POS", href: "/pos", icon: CreditCard },
  ];
}

// ─── Visibility Rules ───

type HiddenSet = Set<string>;

function getHiddenItems(accessRights: AccessRights, role: UserRole): HiddenSet {
  const hidden = new Set<string>();

  switch (accessRights) {
    case "Wholesale":
      ["work-orders", "dashboard", "bulk-email", "super-admin", "customers", "inventory-mgmt", "pos", "reports"].forEach((id) => hidden.add(id));
      break;
    case "CRM":
      ["merchandise", "super-admin", "pos", "bulk-email", "time-tracker"].forEach((id) => hidden.add(id));
      break;
    case "CRM+Wholesale":
      ["bulk-email", "super-admin", "pos", "time-tracker"].forEach((id) => hidden.add(id));
      break;
    case "Emailer":
      ["work-orders", "dashboard", "merchandise", "super-admin", "customers", "inventory-mgmt", "pos", "reports"].forEach((id) => hidden.add(id));
      break;
    case "CRM+Emailer":
      ["merchandise", "super-admin", "pos", "time-tracker"].forEach((id) => hidden.add(id));
      break;
    case "OrderManager+Wholesale":
      ["customers", "inventory-mgmt", "work-orders", "bulk-email", "dashboard", "pos", "reports"].forEach((id) => hidden.add(id));
      break;
    case "All":
      // Show everything, but Super Admin only for Superadmin role
      if (role !== "Superadmin") hidden.add("super-admin");
      break;
  }

  // StaffUser role: hide specific children
  if (role === "StaffUser") {
    hidden.add("merch-orders");
    hidden.add("admin-orders");
  }

  return hidden;
}

// ─── Component ───

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["dashboard", "work-orders"]));
  const [posChecking, setPosChecking] = useState(false);

  const menu = buildMenu();
  const hiddenItems = getHiddenItems(
    (user?.access_rights as AccessRights) || "All",
    (user?.role as UserRole) || "StaffUser"
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTicketsClick = () => {
    localStorage.removeItem("selectedCustomer");
  };

  const handlePosClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user?.id || !user?.branch_id) {
      toast.error("Session expired. Please log in again.");
      router.push("/login");
      return;
    }

    setPosChecking(true);
    try {
      const res = await api.post("/stripe/validate-stripe-account/", {
        user_id: String(user.id),
        branch_id: String(user.branch_id),
      });

      if (res.data.valid === true) {
        router.push("/pos");
      } else if (res.data.error === "no_stripe_account" || res.data.valid === false) {
        if (user.role === "Superadmin" || user.role === "SiteOwner") {
          router.push("/stripe-setup");
        } else {
          toast.error(res.data.message || "Stripe account not configured. Contact your administrator.");
          router.push("/");
        }
      }
    } catch {
      toast.error("Unable to check POS access. Please try again.");
    } finally {
      setPosChecking(false);
    }
  };

  const renderItem = (item: NavItem) => {
    if (hiddenItems.has(item.id)) return null;

    // POS — special click handler
    if (item.id === "pos") {
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            onClick={handlePosClick}
            isActive={isActive("/pos")}
            className="relative cursor-pointer"
          >
            {isActive("/pos") && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />}
            {posChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <item.icon className="h-4 w-4" />}
            <span className="flex-1">{posChecking ? "Checking..." : item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    // Collapsible group
    if (item.children) {
      const isOpen = openGroups.has(item.id);
      const visibleChildren = item.children.filter((c) => !hiddenItems.has(c.id));
      if (visibleChildren.length === 0) return null;

      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton onClick={() => toggleGroup(item.id)} className="cursor-pointer">
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.title}</span>
            <ChevronRight className={`h-3 w-3 text-sidebar-foreground/40 transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`} />
          </SidebarMenuButton>
          {isOpen && (
            <SidebarMenu className="ml-4 mt-0.5 border-l border-sidebar-border pl-2">
              {visibleChildren.map((child) => {
                const active = child.href ? isActive(child.href) : false;
                const onClick = child.id === "tickets" ? handleTicketsClick : undefined;
                return (
                  <SidebarMenuItem key={child.id}>
                    <SidebarMenuButton
                      render={child.href ? <Link href={child.href} onClick={onClick} /> : undefined}
                      isActive={active}
                      className="relative h-8 text-[13px]"
                    >
                      {active && <span className="absolute left-[-9px] top-1/2 -translate-y-1/2 w-[3px] h-3.5 rounded-r-full bg-primary" />}
                      <child.icon className="h-3.5 w-3.5" />
                      <span className="flex-1">{child.title}</span>
                      {child.badge && child.badge > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/10 text-primary text-[9px] font-semibold px-1">
                          {child.badge}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          )}
        </SidebarMenuItem>
      );
    }

    // Simple link
    const active = item.href ? isActive(item.href) : false;
    const onClick = item.id === "tickets" ? handleTicketsClick : undefined;
    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          render={item.href ? <Link href={item.href} onClick={onClick} /> : undefined}
          isActive={active}
          className="relative"
        >
          {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />}
          <item.icon className="h-4 w-4" />
          <span className="flex-1">{item.title}</span>
          {item.badge && item.badge > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-1.5">
              {item.badge}
            </span>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bike className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">Miami Bikes</p>
            <p className="text-[11px] text-sidebar-foreground/50 truncate">{user?.branch_name || "Main Branch"}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/40 shrink-0" />
        </div>
      </SidebarHeader>

      {/* Quick Create */}
      <div className="px-3 pt-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground/70 border-sidebar-border bg-transparent hover:bg-sidebar-accent text-xs h-8"
        >
          <Plus className="h-3.5 w-3.5" />
          Quick Create
          <kbd className="ml-auto pointer-events-none text-[10px] font-mono text-sidebar-foreground/30">Q</kbd>
        </Button>
      </div>

      {/* Navigation */}
      <SidebarContent className="px-2 pt-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menu.map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-2 space-y-1">
        {/* Help */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/support" />} className="h-8 text-[13px]">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Help & Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/admin/3p-restrictions" />} className="h-8 text-[13px]">
              <Package className="h-3.5 w-3.5" />
              <span>Amazon / 3P</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/settings" />} className="h-8 text-[13px]">
              <Settings className="h-3.5 w-3.5" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User */}
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-sidebar-accent transition-colors">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-[10px] text-sidebar-foreground/45 truncate">{user?.role} — {user?.access_rights}</p>
          </div>
          <button onClick={logout} className="p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
