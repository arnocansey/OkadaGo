import { requestJson } from "@/lib/api";

export type PagedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

function withPageParams(path: string, page: number, limit: number, extra?: string) {
  const joiner = path.includes("?") ? "&" : "?";
  const base = `${path}${joiner}page=${page}&limit=${limit}`;
  return extra ? `${base}&${extra}` : base;
}

/** Always requests page mode; falls back if a legacy array is returned. */
export async function requestPagedJson<T>(
  path: string,
  options: {
    token?: string | null;
    page: number;
    limit: number;
    extraQuery?: string;
  }
): Promise<PagedResult<T>> {
  const url = withPageParams(path, options.page, options.limit, options.extraQuery);
  const result = await requestJson<PagedResult<T> | T[]>(url, { token: options.token });
  if (Array.isArray(result)) {
    return {
      data: result,
      total: result.length,
      page: options.page,
      limit: options.limit
    };
  }
  return {
    data: result.data ?? [],
    total: result.total ?? result.data?.length ?? 0,
    page: result.page ?? options.page,
    limit: result.limit ?? options.limit
  };
}

export function listPageSize(screenHeavy: boolean) {
  return screenHeavy ? 100 : 25;
}
