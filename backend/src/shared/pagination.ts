export interface Pagination {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

function readPositiveInt(value: unknown, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parsePagination(
  query: Record<string, unknown>,
  { defaultLimit = 20, maxLimit = 50 }: PaginationOptions = {},
): Pagination {
  const page = readPositiveInt(query.page, 1);
  const limit = Math.min(readPositiveInt(query.limit, defaultLimit), maxLimit);
  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  pagination: Pagination,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      hasMore: pagination.offset + data.length < total,
    },
  };
}

export function paginateArray<T>(items: T[], pagination: Pagination): PaginatedResponse<T> {
  const pageItems = items.slice(pagination.offset, pagination.offset + pagination.limit);
  return createPaginatedResponse(pageItems, items.length, pagination);
}
