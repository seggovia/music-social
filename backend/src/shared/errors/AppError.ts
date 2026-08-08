const DEFAULT_ERROR_CODE_BY_STATUS: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMIT_EXCEEDED',
  500: 'INTERNAL_SERVER_ERROR',
};

export function defaultErrorCode(status: number) {
  return DEFAULT_ERROR_CODE_BY_STATUS[status] ?? 'REQUEST_ERROR';
}

export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, status = 500, details?: unknown, code = defaultErrorCode(status)) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
