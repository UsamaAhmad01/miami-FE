"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Wrench,
  CreditCard,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Plus,
  FileText,
  Clock,
  Mail,
  Calendar,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Tickets", href: "/tickets", icon: Wrench },
  { label: "POS", href: "/pos", icon: CreditCard },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Reporting", href: "/reporting", icon: BarChart3 },
  { label: "Time Tracker", href: "/time-tracker", icon: Clock },
  { label: "Bulk Email", href: "/bulk-email", icon: Mail },
  { label: "Settings", href: "/settings", icon: Settings },
];

const quickActions = [
  { label: "New Ticket", href: "/tickets?action=new", icon: Plus, group: "Quick Actions" },
  { label: "New Customer", href: "/customers?action=new", icon: Plus, group: "Quick Actions" },
  { label: "New Order", href: "/orders?action=new", icon: Plus, group: "Quick Actions" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="rounded-lg">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick Actions">
            {quickActions.map((item) => (
              <CommandItem key={item.label} onSelect={() => handleSelect(item.href)}>
                <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigate">
            {navItems.map((item) => (
              <CommandItem key={item.href} onSelect={() => handleSelect(item.href)}>
                <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
