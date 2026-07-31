import { z } from "zod";

/**
 * Shared pagination query fields for admin list endpoints.
 * When `page` is provided the endpoint returns `{ data, total, page, limit }`;
 * otherwise it returns the legacy plain array (capped by `limit`/default take).
 */
export const paginationFields = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional()
};

export type PaginationInput = {
  page?: number;
  limit?: number;
};

export function pageArgs(query: PaginationInput, defaultLimit: number) {
  const limit = query.limit ?? defaultLimit;
  const page = query.page ?? 1;
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

export function pagedResult<T>(data: T[], total: number, page: number, limit: number) {
  return { data, total, page, limit };
}
