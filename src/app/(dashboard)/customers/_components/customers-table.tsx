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
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { type Customer, TAG_COLORS } from "../_data/mock-customers";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs" onClick={() => column.toggleSorting()}>
        Customer <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium">{row.original.name}</p>
        <p className="text-xs text-muted-foreground">{row.original.email}</p>
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => <span className="text-sm">{row.original.phone}</span>,
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => (
      <div className="flex gap-1">
        {row.original.tags.map((tag) => (
          <span key={tag} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${TAG_COLORS[tag] || "bg-muted text-muted-foreground"}`}>
            {tag}
          </span>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "total_tickets",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs" onClick={() => column.toggleSorting()}>
        Tickets <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm">{row.original.total_tickets}</span>,
  },
  {
    accessorKey: "total_spent",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs" onClick={() => column.toggleSorting()}>
        Total Spent <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm font-medium">${row.original.total_spent.toLocaleString()}</span>,
  },
  {
    accessorKey: "last_visit",
    header: "Last Visit",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.last_visit)}</span>,
  },
  {
    accessorKey: "created_at",
    header: "Joined",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.created_at)}</span>,
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

interface CustomersTableProps {
  data: Customer[];
  onSelect: (customer: Customer) => void;
  globalFilter: string;
}

export function CustomersTable({ data, onSelect, globalFilter }: CustomersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
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
                No customers found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
