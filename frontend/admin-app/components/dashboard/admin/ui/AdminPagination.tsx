"use client";

import { useMemo, useState } from "react";

/** Clamp + slice a list for page rendering. Resets are the caller's job (pass a key or call setPage(1)). */
export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );
  return { page: safePage, setPage, totalPages, paginated, totalItems: items.length, pageSize };
}

export function AdminPagination({
  page,
  totalItems,
  pageSize,
  onPageChange
}: {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="admin-pagination">
      <span>
        Showing {from}–{to} of {totalItems}
      </span>
      <div className="admin-pagination-controls">
        <button
          type="button"
          className="admin-btn-secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ‹ Prev
        </button>
        <span className="admin-pagination-page">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          className="admin-btn-secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
