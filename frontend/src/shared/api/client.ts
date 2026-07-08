const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

interface ApiErrorBody {
  error?: {
    message?: unknown;
    code?: unknown;
  } | string;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = 'REQUEST_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function readJson<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

async function readError(response: Response) {
  try {
    const body = await readJson<ApiErrorBody>(response);
    if (typeof body?.error === 'string') {
      return { message: body.error, code: 'REQUEST_ERROR' };
    }

    return {
      message: typeof body?.error?.message === 'string' ? body.error.message : null,
      code: typeof body?.error?.code === 'string' ? body.error.code : 'REQUEST_ERROR',
    };
  } catch {
    return { message: null, code: 'REQUEST_ERROR' };
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const { message, code } = await readError(response);
    throw new ApiError(message ?? 'No pudimos completar la acción. Intenta de nuevo.', response.status, code);
  }

  return readJson<T>(response);
}

export const apiClient = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, options),
  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: <T>(path: string, options?: RequestInit) => request<T>(path, { method: 'DELETE', ...options }),
};
