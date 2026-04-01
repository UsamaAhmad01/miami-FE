"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  Name: string;
  subcategories: Array<{ id: number; Name: string; num_products: number }>;
}

interface CategoryNavProps {
  categories: Category[];
  activeCategoryId: number | null;
  activeSubcategoryId: number | null;
  onSelect: (type: "category" | "subcategory", id: number) => void;
}

export function CategoryNav({ categories, activeCategoryId, activeSubcategoryId, onSelect }: CategoryNavProps) {
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => onSelect("category", 0)}
        className={cn(
          "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
          !activeCategoryId && !activeSubcategoryId
            ? "border-primary/30 bg-primary/5 text-foreground"
            : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
        )}
      >
        All Products
      </button>
      {categories.map((cat) => (
        <div key={cat.id} className="relative">
          <button
            onClick={() => {
              if (cat.subcategories.length > 0) {
                setOpenDropdown(openDropdown === cat.id ? null : cat.id);
              } else {
                onSelect("category", cat.id);
              }
            }}
            className={cn(
              "flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              activeCategoryId === cat.id
                ? "border-primary/30 bg-primary/5 text-foreground"
                : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {cat.Name}
            {cat.subcategories.length > 0 && <ChevronDown className="h-3 w-3 ml-0.5" />}
          </button>

          {openDropdown === cat.id && cat.subcategories.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-56 rounded-lg border bg-card shadow-elevated z-50 py-1 animate-fade-in">
              <button
                onClick={() => { onSelect("category", cat.id); setOpenDropdown(null); }}
                className="flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium">All {cat.Name}</span>
              </button>
              {cat.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => { onSelect("subcategory", sub.id); setOpenDropdown(null); }}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-muted/50 transition-colors",
                    activeSubcategoryId === sub.id && "bg-primary/5 text-primary"
                  )}
                >
                  <span>{sub.Name}</span>
                  <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{sub.num_products}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
