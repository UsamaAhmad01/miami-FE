"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/primitives/page-shell";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useAuthStore } from "@/stores/auth-store";
import {
  useCategoriesWithSubcategories, useAllProductsPaginated,
  useCategoryProducts, useSubcategoryProducts,
  useDownloadAllProductsCsv, useDownloadSelectedProductsCsv,
} from "@/hooks/use-api";
import { CategoryNav } from "./_components/category-nav";
import { FilterPanel } from "./_components/filter-panel";
import { ProductsDataTable } from "./_components/products-data-table";
import { toast } from "sonner";

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const userId = user?.id || 0;

  // Read filters from URL
  const categoryId = searchParams.get("category") ? Number(searchParams.get("category")) : null;
  const subcategoryId = searchParams.get("subcategory") ? Number(searchParams.get("subcategory")) : null;
  const urlFilters = {
    brand: searchParams.get("brand") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    minMargin: searchParams.get("minMargin") || "",
    maxMargin: searchParams.get("maxMargin") || "",
    stock: searchParams.get("stock") || "",
  };

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const pageSize = 50;

  // Categories
  const { data: categories } = useCategoriesWithSubcategories(userId);

  // Determine which endpoint to call
  const allProducts = useAllProductsPaginated({
    user_id: userId, draw: 1, start: page * pageSize, length: pageSize,
  });
  const catProducts = useCategoryProducts({
    user_id: userId, category_id: categoryId || 0,
    ...urlFilters, draw: 1, start: page * pageSize, length: pageSize,
  });
  const subProducts = useSubcategoryProducts({
    user_id: userId, sub_category_id: subcategoryId || 0,
    ...urlFilters, draw: 1, start: page * pageSize, length: pageSize,
  });

  // Pick the right data source
  const activeQuery = subcategoryId ? subProducts : categoryId ? catProducts : allProducts;
  const products = (activeQuery.data?.data || []) as Array<Record<string, unknown>>;
  const totalRecords = activeQuery.data?.recordsTotal || 0;

  const downloadAll = useDownloadAllProductsCsv();
  const downloadSelected = useDownloadSelectedProductsCsv();

  // Breadcrumb
  const breadcrumb = useMemo(() => {
    const parts = ["Products"];
    if (categoryId && categories) {
      const cat = categories.find((c) => c.id === categoryId);
      if (cat) parts.push(cat.Name);
    }
    if (subcategoryId && categories) {
      for (const cat of categories || []) {
        const sub = cat.subcategories.find((s) => s.id === subcategoryId);
        if (sub) { parts.push(cat.Name, sub.Name); break; }
      }
    }
    return parts;
  }, [categoryId, subcategoryId, categories]);

  const updateUrl = (params: Record<string, string | number | null>) => {
    const sp = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || v === "" || v === 0) sp.delete(k);
      else sp.set(k, String(v));
    });
    router.push(`/products?${sp.toString()}`);
  };

  const handleCategorySelect = (type: "category" | "subcategory", id: number) => {
    if (id === 0) {
      router.push("/products");
    } else if (type === "category") {
      updateUrl({ category: id, subcategory: null });
    } else {
      updateUrl({ subcategory: id, category: null });
    }
    setPage(0);
  };

  const handleApplyFilters = (filters: typeof urlFilters) => {
    updateUrl({ ...filters });
    setPage(0);
  };

  const handleClearFilters = () => {
    const sp = new URLSearchParams();
    if (categoryId) sp.set("category", String(categoryId));
    if (subcategoryId) sp.set("subcategory", String(subcategoryId));
    router.push(`/products?${sp.toString()}`);
    setPage(0);
  };

  const toggleRow = (sku: string) => {
    setSelectedRows((prev) => { const next = new Set(prev); if (next.has(sku)) next.delete(sku); else next.add(sku); return next; });
  };
  const toggleAll = () => {
    const allSkus = products.map((p) => String(p.id || p.Sku || ""));
    const allSelected = allSkus.every((s) => selectedRows.has(s));
    setSelectedRows(allSelected ? new Set() : new Set(allSkus));
  };

  return (
    <PageShell>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
        {breadcrumb.map((part, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3" />}
            <span className={i === breadcrumb.length - 1 ? "text-foreground font-medium" : ""}>{part}</span>
          </span>
        ))}
        <span className="text-[10px] ml-2">({totalRecords} products)</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Products</h1>
        <div className="flex items-center gap-2">
          {selectedRows.size > 0 && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => downloadSelected.mutate({ skus: Array.from(selectedRows), userId: String(userId) })}>
              <Download className="h-3 w-3 mr-1" />Download Selected ({selectedRows.size})
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => downloadAll.mutate(String(userId))}>
            <Download className="h-3 w-3 mr-1" />Download All
          </Button>
        </div>
      </div>

      {/* Category Navigation */}
      <CategoryNav
        categories={categories || []}
        activeCategoryId={categoryId}
        activeSubcategoryId={subcategoryId}
        onSelect={handleCategorySelect}
      />

      {/* Filters */}
      <FilterPanel filters={urlFilters} onApply={handleApplyFilters} onClear={handleClearFilters} />

      {/* Table */}
      <ProductsDataTable
        data={products}
        selectedRows={selectedRows}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        loading={activeQuery.isLoading}
      />

      {/* Pagination */}
      {totalRecords > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalRecords)} of {totalRecords}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={(page + 1) * pageSize >= totalRecords} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<BrandedLoader variant="page" text="Loading products..." />}>
      <ProductsPageContent />
    </Suspense>
  );
}
