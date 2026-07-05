import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { Conversation, Message, MessagesState } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export const useMessagesStore = create<MessagesState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,

  async fetchConversations() {
    set({ isLoading: true, error: null });

    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`${BASE_URL}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const conversations: Conversation[] = await response.json();
      set({ conversations, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch conversations', isLoading: false });
    }
  },

  async startConversation(targetUserId: string) {
    set({ isLoading: true, error: null });

    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`${BASE_URL}/messages/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const conversation: Conversation = await response.json();
      const conversations = [conversation, ...get().conversations.filter((item) => item.id !== conversation.id)];
      set({ currentConversation: conversation, conversations, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to start conversation', isLoading: false });
    }
  },

  async fetchMessages(conversationId: string) {
    set({ isLoading: true, error: null });

    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`${BASE_URL}/messages/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const messages: Message[] = await response.json();
      const currentConversation = get().conversations.find((conversation) => conversation.id === conversationId) ?? null;
      set({ messages, currentConversation, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch messages', isLoading: false });
    }
  },

  async sendMessage(conversationId: string, body: string) {
    set({ isLoading: true, error: null });

    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`${BASE_URL}/messages/${conversationId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const message: Message = await response.json();
      set((state) => ({
        messages: [...state.messages, message],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to send message', isLoading: false });
    }
  },
}));
