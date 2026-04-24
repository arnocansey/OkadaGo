"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from "@tanstack/react-table";
import { useMemo } from "react";
import type { LiveRideRecord } from "@/lib/contracts";

const columns: ColumnDef<LiveRideRecord>[] = [
  {
    accessorKey: "code",
    header: "Trip"
  },
  {
    accessorKey: "riderName",
    header: "Rider"
  },
  {
    accessorKey: "passengerName",
    header: "Passenger"
  },
  {
    accessorKey: "status",
    header: "Status"
  },
  {
    accessorKey: "pickupLabel",
    header: "Pickup"
  },
  {
    accessorKey: "destinationLabel",
    header: "Destination"
  }
];

export function LiveOperationsTable({ rows }: { rows: LiveRideRecord[] }) {
  const data = useMemo(() => rows, [rows]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  if (rows.length === 0) {
    return (
      <div className="empty-state">
        <strong>No live ride records are loaded yet.</strong>
        <p>
          TanStack Table is wired and ready for realtime trip feeds from the dispatch API, but this
          scaffold intentionally ships without dummy rows.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {cell.column.columnDef.cell
                    ? flexRender(cell.column.columnDef.cell, cell.getContext())
                    : String(cell.getValue() ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
