"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/primitives/status-badge";
import { type Product, getStockStatus } from "../_data/mock-products";

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => <span className="font-mono text-xs font-medium">{row.original.sku}</span>,
    size: 140,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs" onClick={() => column.toggleSorting()}>
        Product <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium">{row.original.title}</p>
        <p className="text-xs text-muted-foreground">{row.original.brand} — {row.original.subcategory}</p>
      </div>
    ),
  },
  {
    accessorKey: "upc",
    header: "UPC",
    cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.upc}</span>,
  },
  {
    accessorKey: "stock_count",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs" onClick={() => column.toggleSorting()}>
        Stock <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const s = getStockStatus(row.original.stock_count);
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{row.original.stock_count}</span>
          <StatusBadge status={s.color} dot={true}>{s.label}</StatusBadge>
        </div>
      );
    },
  },
  {
    accessorKey: "base_price",
    header: "Cost",
    cell: ({ row }) => <span className="text-sm">${row.original.base_price.toFixed(2)}</span>,
  },
  {
    accessorKey: "msrp",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs" onClick={() => column.toggleSorting()}>
        MSRP <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm font-medium">${row.original.msrp.toFixed(2)}</span>,
  },
  {
    accessorKey: "vendor_products",
    header: "Vendors",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.vendor_products.length} vendor{row.original.vendor_products.length > 1 ? "s" : ""}</span>,
  },
  {
    accessorKey: "shopify_synced",
    header: "Shopify",
    cell: ({ row }) => (
      row.original.shopify_synced
        ? <span className="text-xs text-[var(--success)] flex items-center gap-1"><ExternalLink className="h-3 w-3" />Synced</span>
        : <span className="text-xs text-muted-foreground">Not synced</span>
    ),
  },
  {
    id: "actions",
    cell: () => (
      <Button variant="ghost" size="icon" className="h-7 w-7">
        <MoreHorizontal className="h-3.5 w-3.5" />
      </Button>
    ),
    size: 40,
  },
];

interface ProductsTableProps {
  data: Product[];
  onSelect: (product: Product) => void;
  globalFilter: string;
  categoryFilter: string;
}

export function ProductsTable({ data, onSelect, globalFilter, categoryFilter }: ProductsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const filtered = categoryFilter ? data.filter((p) => p.category === categoryFilter) : data;

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-transparent">
              {hg.headers.map((header) => (
                <TableHead key={header.id} className="text-xs font-medium text-muted-foreground h-10">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} onClick={() => onSelect(row.original)} className="cursor-pointer">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-muted-foreground">
                No products found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
