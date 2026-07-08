import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { apiClient } from '@/shared/api/client';
import { reportError } from '@/shared/lib/errors';
import type { PaginatedResponse } from '@/shared/types';
import type { Conversation, Message, MessagesState } from '../types';

const MESSAGES_LIMIT = 30;

function authOptions(): RequestInit {
  const token = useAuthStore.getState().accessToken;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  messagesPage: 1,
  messagesHasMore: false,
  messagesTotal: 0,

  async fetchConversations() {
    set({ isLoading: true, error: null });

    try {
      const conversations = await apiClient.get<Conversation[]>('/messages', authOptions());
      set({ conversations, isLoading: false });
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar tus conversaciones. Intenta de nuevo.', () => get().fetchConversations());
      set({ error: message, isLoading: false });
    }
  },

  async startConversation(targetUserId: string) {
    set({ isLoading: true, error: null });

    try {
      const conversation = await apiClient.post<Conversation>('/messages/start', { targetUserId }, authOptions());
      const conversations = [conversation, ...get().conversations.filter((item) => item.id !== conversation.id)];
      set({ currentConversation: conversation, conversations, isLoading: false });
    } catch (error) {
      const message = reportError(error, 'No pudimos iniciar la conversacion. Intenta de nuevo.');
      set({ error: message, isLoading: false });
    }
  },

  async fetchMessages(conversationId: string) {
    set({
      messages: [],
      messagesPage: 1,
      messagesHasMore: false,
      messagesTotal: 0,
      isLoading: true,
      isLoadingMore: false,
      error: null,
    });

    try {
      const response = await apiClient.get<PaginatedResponse<Message>>(
        `/messages/${conversationId}?page=1&limit=${MESSAGES_LIMIT}`,
        authOptions(),
      );
      const currentConversation = get().conversations.find((conversation) => conversation.id === conversationId) ?? null;
      set({
        messages: response.data,
        currentConversation,
        messagesPage: response.meta.page,
        messagesHasMore: response.meta.hasMore,
        messagesTotal: response.meta.total,
        isLoading: false,
      });
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar los mensajes. Intenta de nuevo.', () => get().fetchMessages(conversationId));
      set({ error: message, isLoading: false });
    }
  },

  async loadOlderMessages(conversationId: string) {
    const { messagesPage, messagesHasMore, isLoadingMore } = get();
    if (!messagesHasMore || isLoadingMore) return;

    const nextPage = messagesPage + 1;
    set({ isLoadingMore: true, error: null });

    try {
      const response = await apiClient.get<PaginatedResponse<Message>>(
        `/messages/${conversationId}?page=${nextPage}&limit=${MESSAGES_LIMIT}`,
        authOptions(),
      );
      set((state) => ({
        messages: [...response.data, ...state.messages],
        messagesPage: response.meta.page,
        messagesHasMore: response.meta.hasMore,
        messagesTotal: response.meta.total,
        isLoadingMore: false,
      }));
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar mensajes anteriores. Intenta de nuevo.', () => get().loadOlderMessages(conversationId));
      set({ error: message, isLoadingMore: false });
    }
  },

  async sendMessage(conversationId: string, body: string) {
    set({ isLoading: true, error: null });

    try {
      const message = await apiClient.post<Message>(`/messages/${conversationId}`, { body }, authOptions());
      set((state) => ({
        messages: [...state.messages, message],
        messagesTotal: state.messagesTotal + 1,
        isLoading: false,
      }));
    } catch (error) {
      const message = reportError(error, 'No pudimos enviar el mensaje. Intenta de nuevo.');
      set({ error: message, isLoading: false });
      throw error;
    }
  },
}));
