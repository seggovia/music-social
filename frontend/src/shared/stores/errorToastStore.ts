import { create } from 'zustand';

export interface ErrorToast {
  id: number;
  message: string;
  code?: string;
  onRetry?: () => void | Promise<void>;
}

interface ErrorToastState {
  toast: ErrorToast | null;
  showError: (toast: Omit<ErrorToast, 'id'>) => void;
  dismiss: () => void;
  retry: () => Promise<void>;
}

let nextToastId = 1;

export const useErrorToastStore = create<ErrorToastState>((set, get) => ({
  toast: null,
  showError: (toast) => {
    set({ toast: { ...toast, id: nextToastId } });
    nextToastId += 1;
  },
  dismiss: () => set({ toast: null }),
  retry: async () => {
    const retry = get().toast?.onRetry;
    set({ toast: null });
    await retry?.();
  },
}));
