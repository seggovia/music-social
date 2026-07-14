import { SESSION_EXPIRED_EVENT } from '@/shared/lib/sessionEvents';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const AUTH_STORAGE_KEY = 'music-social-auth';
const LOGIN_PATH = '/login';

interface ApiErrorBody {
  error?: {
    message?: unknown;
    code?: unknown;
  } | string;
}

export class ApiError extends Error {
  status: number;
  code: string;
  isSessionExpired: boolean;

  constructor(message: string, status: number, code = 'REQUEST_ERROR', isSessionExpired = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.isSessionExpired = isSessionExpired;
  }
}

let hasHandledExpiredSession = false;

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

function isPublicAuthRequest(path: string) {
  return path === '/auth/login' || path === '/auth/register';
}

function hasStoredSession() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY));
}

function shouldHandleExpiredSession(path: string, headers: Headers, status: number, code: string) {
  if (status !== 401 || code !== 'UNAUTHORIZED') return false;
  if (isPublicAuthRequest(path)) return false;

  return headers.has('Authorization') || hasStoredSession();
}

async function handleExpiredSession() {
  if (typeof window === 'undefined' || hasHandledExpiredSession) return;
  hasHandledExpiredSession = true;

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));

  if (window.location.pathname !== LOGIN_PATH) {
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const params = new URLSearchParams({ expired: '1' });
    if (returnTo && returnTo !== '/') {
      params.set('redirect', returnTo);
    }
    window.location.replace(`${LOGIN_PATH}?${params.toString()}`);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const { message, code } = await readError(response);
    const isSessionExpired = shouldHandleExpiredSession(path, headers, response.status, code);
    if (isSessionExpired) {
      await handleExpiredSession();
    }

    throw new ApiError(message ?? 'No pudimos completar la accion. Intenta de nuevo.', response.status, code, isSessionExpired);
  }

  if (isPublicAuthRequest(path)) {
    hasHandledExpiredSession = false;
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
