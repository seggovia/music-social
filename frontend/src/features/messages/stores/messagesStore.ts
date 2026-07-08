import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { apiClient } from '@/shared/api/client';
import { reportError } from '@/shared/lib/errors';
import type { Conversation, Message, MessagesState } from '../types';

function authOptions(): RequestInit {
  const token = useAuthStore.getState().accessToken;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,

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
      const message = reportError(error, 'No pudimos iniciar la conversación. Intenta de nuevo.');
      set({ error: message, isLoading: false });
    }
  },

  async fetchMessages(conversationId: string) {
    set({ isLoading: true, error: null });

    try {
      const messages = await apiClient.get<Message[]>(`/messages/${conversationId}`, authOptions());
      const currentConversation = get().conversations.find((conversation) => conversation.id === conversationId) ?? null;
      set({ messages, currentConversation, isLoading: false });
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar los mensajes. Intenta de nuevo.', () => get().fetchMessages(conversationId));
      set({ error: message, isLoading: false });
    }
  },

  async sendMessage(conversationId: string, body: string) {
    set({ isLoading: true, error: null });

    try {
      const message = await apiClient.post<Message>(`/messages/${conversationId}`, { body }, authOptions());
      set((state) => ({
        messages: [...state.messages, message],
        isLoading: false,
      }));
    } catch (error) {
      const message = reportError(error, 'No pudimos enviar el mensaje. Intenta de nuevo.');
      set({ error: message, isLoading: false });
      throw error;
    }
  },
}));
