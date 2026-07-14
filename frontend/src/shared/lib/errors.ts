import { ApiError } from '@/shared/api/client';
import { useErrorToastStore } from '@/shared/stores/errorToastStore';

const GENERIC_ERROR_MESSAGE = 'No pudimos completar la acción. Intenta de nuevo.';
const NETWORK_ERROR_MESSAGE = 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.';

const TECHNICAL_MESSAGE_PATTERNS = [
  /^API error:/i,
  /^Failed to /i,
  /^Unable to /i,
  /^Internal server error$/i,
  /^NetworkError/i,
  /^Load failed$/i,
];

function isTechnicalMessage(message: string) {
  return TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
}

export function getErrorMessage(error: unknown, fallback = GENERIC_ERROR_MESSAGE) {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof TypeError) return NETWORK_ERROR_MESSAGE;
  if (error instanceof Error && error.message && !isTechnicalMessage(error.message)) {
    return error.message;
  }

  return fallback;
}

export function reportError(error: unknown, fallback?: string, onRetry?: () => void | Promise<void>) {
  const message = getErrorMessage(error, fallback);
  if (error instanceof ApiError && error.isSessionExpired) {
    return message;
  }

  useErrorToastStore.getState().showError({ message, onRetry });
  return message;
}
