import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { apiClient } from '@/shared/api/client';
import { supabaseRealtime } from '@/shared/api/supabase';
import { reportError } from '@/shared/lib/errors';
import type { PaginatedResponse } from '@/shared/types';
import type { Conversation, ConversationUser, Message, MessageDeleteMode, MessagesState } from '../types';

const MESSAGES_LIMIT = 30;

interface RealtimeMessageRow {
  [key: string]: any;
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_for_sender: boolean;
  deleted_for_all: boolean;
  pinned: boolean;
  pinned_at: string | null;
}

let messagesRealtimeChannel: RealtimeChannel | null = null;

function authOptions(): RequestInit {
  const token = useAuthStore.getState().accessToken;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

function mergeMessages(currentMessages: Message[], incomingMessages: Message[]) {
  const byId = new Map(currentMessages.map((message) => [message.id, message]));

  for (const incoming of incomingMessages) {
    const current = byId.get(incoming.id);
    byId.set(incoming.id, current
      ? { ...current, ...incoming, sender: incoming.sender ?? current.sender }
      : incoming);
  }

  return [...byId.values()].sort((first, second) => {
    const dateDifference = new Date(first.created_at).getTime() - new Date(second.created_at).getTime();
    return dateDifference || first.id.localeCompare(second.id);
  });
}

function withUnreadCount(conversations: Conversation[], conversationId: string, unreadCount: number) {
  return conversations.map((conversation) => (
    conversation.id === conversationId
      ? { ...conversation, unread_count: Math.max(0, unreadCount) }
      : conversation
  ));
}

function findSender(conversation: Conversation, senderId: string): ConversationUser {
  if (conversation.user_one?.id === senderId) return conversation.user_one;
  if (conversation.user_two?.id === senderId) return conversation.user_two;

  return {
    id: senderId,
    username: 'Usuario',
    avatar_url: null,
  };
}

function isRealtimeMessageRow(value: object): value is RealtimeMessageRow {
  const row = value as Partial<RealtimeMessageRow>;
  return typeof row.id === 'string'
    && typeof row.conversation_id === 'string'
    && typeof row.sender_id === 'string'
    && typeof row.created_at === 'string';
}

function toMessage(row: RealtimeMessageRow, conversation: Conversation, current?: Message): Message {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    body: row.body,
    read_at: row.read_at ?? null,
    created_at: row.created_at,
    edited_at: row.edited_at ?? null,
    deleted_for_sender: Boolean(row.deleted_for_sender),
    deleted_for_all: Boolean(row.deleted_for_all),
    pinned: Boolean(row.pinned),
    pinned_at: row.pinned_at ?? null,
    sender: current?.sender ?? findSender(conversation, row.sender_id),
  };
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
  pinnedMessagesVersion: 0,

  async fetchConversations() {
    set({ isLoading: true, error: null });

    try {
      const conversations = await apiClient.get<Conversation[]>('/messages', authOptions());
      const currentConversationId = get().currentConversation?.id;
      const currentConversation = currentConversationId
        ? conversations.find((conversation) => conversation.id === currentConversationId) ?? get().currentConversation
        : null;
      set({ conversations, currentConversation, isLoading: false });
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar tus conversaciones. Intenta de nuevo.', () => get().fetchConversations());
      set({ error: message, isLoading: false });
    }
  },

  async startConversation(targetUserId: string) {
    set({ isLoading: true, error: null });

    try {
      const conversation = await apiClient.post<Conversation>('/messages/start', { targetUserId }, authOptions());
      const normalizedConversation = { ...conversation, unread_count: conversation.unread_count ?? 0 };
      const conversations = [
        normalizedConversation,
        ...get().conversations.filter((item) => item.id !== normalizedConversation.id),
      ];
      set({ currentConversation: normalizedConversation, conversations, isLoading: false });
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
      const state = get();
      if (state.currentConversation?.id !== conversationId) return;

      const conversations = withUnreadCount(state.conversations, conversationId, 0);
      const currentConversation = conversations.find((conversation) => conversation.id === conversationId)
        ?? state.currentConversation;
      const messages = mergeMessages(response.data, state.messages);
      set({
        conversations,
        currentConversation,
        messages,
        messagesPage: Math.max(response.meta.page, Math.ceil(messages.length / MESSAGES_LIMIT)),
        messagesHasMore: messages.length < response.meta.total,
        messagesTotal: Math.max(response.meta.total, state.messagesTotal),
        isLoading: false,
      });
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar los mensajes. Intenta de nuevo.', () => get().fetchMessages(conversationId));
      set({ error: message, isLoading: false });
    }
  },

  async resyncMessages(conversationId: string) {
    try {
      const response = await apiClient.get<PaginatedResponse<Message>>(
        `/messages/${conversationId}?page=1&limit=${MESSAGES_LIMIT}`,
        authOptions(),
      );
      const state = get();
      if (state.currentConversation?.id !== conversationId) return;

      const messages = mergeMessages(state.messages, response.data);
      set({
        messages,
        messagesPage: Math.max(state.messagesPage, Math.ceil(messages.length / MESSAGES_LIMIT)),
        messagesHasMore: messages.length < response.meta.total,
        messagesTotal: Math.max(state.messagesTotal, response.meta.total),
      });
    } catch {
      // A later reconnect will retry this reconciliation. Avoid surfacing a toast for a transient socket event.
    }
  },

  async markConversationAsRead(conversationId: string) {
    try {
      await apiClient.post<void>(`/messages/${conversationId}/read`, undefined, authOptions());
      set((state) => ({ conversations: withUnreadCount(state.conversations, conversationId, 0) }));
    } catch {
      // Reading should remain non-blocking if the connection changes while a message arrives.
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
      set((state) => {
        const messages = mergeMessages(state.messages, response.data);
        return {
          messages,
          messagesPage: response.meta.page,
          messagesHasMore: messages.length < response.meta.total,
          messagesTotal: Math.max(state.messagesTotal, response.meta.total),
          isLoadingMore: false,
        };
      });
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar mensajes anteriores. Intenta de nuevo.', () => get().loadOlderMessages(conversationId));
      set({ error: message, isLoadingMore: false });
    }
  },

  async sendMessage(conversationId: string, body: string) {
    set({ isLoading: true, error: null });

    try {
      const message = await apiClient.post<Message>(`/messages/${conversationId}`, { body }, authOptions());
      set((state) => {
        const alreadyPresent = state.messages.some((item) => item.id === message.id);
        return {
          messages: mergeMessages(state.messages, [message]),
          messagesTotal: alreadyPresent ? state.messagesTotal : state.messagesTotal + 1,
          isLoading: false,
        };
      });
    } catch (error) {
      const message = reportError(error, 'No pudimos enviar el mensaje. Intenta de nuevo.');
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  async editMessage(conversationId: string, messageId: string, body: string) {
    try {
      const updatedMessage = await apiClient.put<Message>(
        `/messages/${conversationId}/messages/${messageId}`,
        { body },
        authOptions(),
      );
      set((state) => ({ messages: mergeMessages(state.messages, [updatedMessage]) }));
      return updatedMessage;
    } catch (error) {
      const message = reportError(error, 'No pudimos editar el mensaje. Intenta de nuevo.');
      set({ error: message });
      throw error;
    }
  },

  async deleteMessage(conversationId: string, messageId: string, mode: MessageDeleteMode) {
    try {
      const updatedMessage = await apiClient.delete<Message>(
        `/messages/${conversationId}/messages/${messageId}`,
        { ...authOptions(), body: JSON.stringify({ mode }) },
      );
      set((state) => ({
        messages: mode === 'sender'
          ? state.messages.filter((message) => message.id !== messageId)
          : mergeMessages(state.messages, [updatedMessage]),
        messagesTotal: mode === 'sender' ? Math.max(0, state.messagesTotal - 1) : state.messagesTotal,
      }));
      return updatedMessage;
    } catch (error) {
      const message = reportError(error, 'No pudimos anular el envio del mensaje. Intenta de nuevo.');
      set({ error: message });
      throw error;
    }
  },

  async togglePin(conversationId: string, message: Message) {
    try {
      const path = `/messages/${conversationId}/messages/${message.id}/pin`;
      const updatedMessage = message.pinned
        ? await apiClient.delete<Message>(path, authOptions())
        : await apiClient.post<Message>(path, undefined, authOptions());
      set((state) => ({
        messages: mergeMessages(state.messages, [updatedMessage]),
        pinnedMessagesVersion: state.pinnedMessagesVersion + 1,
      }));
      return updatedMessage;
    } catch (error) {
      const message = reportError(error, 'No pudimos actualizar el mensaje fijado. Intenta de nuevo.');
      set({ error: message });
      throw error;
    }
  },

  async fetchPinnedMessages(conversationId: string) {
    try {
      return await apiClient.get<Message[]>(`/messages/${conversationId}/pinned`, authOptions());
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar los mensajes fijados. Intenta de nuevo.', async () => {
        await get().fetchPinnedMessages(conversationId);
      });
      set({ error: message });
      throw error;
    }
  },

  subscribeToRealtime(accessToken: string) {
    const userId = useAuthStore.getState().user?.id;
    const realtime = supabaseRealtime;
    if (!userId || !realtime) {
      console.warn('[messages realtime] Subscription skipped because the user session or Supabase configuration is unavailable.');
      return () => undefined;
    }

    const previousChannel = messagesRealtimeChannel;
    if (previousChannel) {
      messagesRealtimeChannel = null;
      void realtime.removeChannel(previousChannel);
    }

    const handleChange = (payload: RealtimePostgresChangesPayload<RealtimeMessageRow>) => {
      const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
      if (!isRealtimeMessageRow(row)) return;

      const state = get();
      const conversation = state.conversations.find((item) => item.id === row.conversation_id);

      if (!conversation) {
        if (payload.eventType === 'INSERT') {
          void state.fetchConversations();
        }
        return;
      }

      const isActiveConversation = state.currentConversation?.id === row.conversation_id;
      if (!isActiveConversation) {
        if (payload.eventType === 'INSERT' && row.sender_id !== userId && !row.deleted_for_all) {
          set((currentState) => ({
            conversations: withUnreadCount(
              currentState.conversations,
              row.conversation_id,
              (currentState.conversations.find((item) => item.id === row.conversation_id)?.unread_count ?? 0) + 1,
            ),
          }));
        }
        if (payload.eventType === 'UPDATE' && row.deleted_for_all) {
          void state.fetchConversations();
        }
        return;
      }

      if (payload.eventType === 'DELETE') {
        set((currentState) => ({
          messages: currentState.messages.filter((message) => message.id !== row.id),
          messagesTotal: Math.max(0, currentState.messagesTotal - 1),
        }));
        return;
      }

      const existingMessage = state.messages.find((message) => message.id === row.id);
      if (payload.eventType === 'UPDATE' && !existingMessage) {
        // The message may be older than the loaded page. It can still affect the pinned-message bar.
        set((currentState) => ({ pinnedMessagesVersion: currentState.pinnedMessagesVersion + 1 }));
        return;
      }

      const message = toMessage(row, conversation, existingMessage);
      const pinnedMessagesChanged = payload.eventType === 'UPDATE' && (
        !existingMessage
        || existingMessage.pinned !== message.pinned
        || existingMessage.deleted_for_all !== message.deleted_for_all
        || existingMessage.deleted_for_sender !== message.deleted_for_sender
        || (message.pinned && existingMessage.body !== message.body)
      );
      set((currentState) => {
        const isNewMessage = !currentState.messages.some((item) => item.id === message.id);
        return {
          messages: mergeMessages(currentState.messages, [message]),
          messagesTotal: isNewMessage ? currentState.messagesTotal + 1 : currentState.messagesTotal,
          conversations: withUnreadCount(currentState.conversations, row.conversation_id, 0),
          pinnedMessagesVersion: pinnedMessagesChanged
            ? currentState.pinnedMessagesVersion + 1
            : currentState.pinnedMessagesVersion,
        };
      });

      if (payload.eventType === 'INSERT' && row.sender_id !== userId) {
        void get().markConversationAsRead(row.conversation_id);
      }
    };

    const channel = realtime
      .channel(`messages:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, handleChange);
    messagesRealtimeChannel = channel;

    void realtime.realtime.setAuth(accessToken).then(() => {
      if (messagesRealtimeChannel !== channel) return;

      channel.subscribe((status, error) => {
        if (status !== 'SUBSCRIBED') {
          console.error('[messages realtime] Subscription did not complete.', { status, error });
          return;
        }

        console.info('[messages realtime] Subscription established.');

        const activeConversationId = get().currentConversation?.id;
        if (activeConversationId) {
          void get().resyncMessages(activeConversationId);
        }
        void get().fetchConversations();
      });
    });

    return () => {
      if (messagesRealtimeChannel !== channel) return;
      messagesRealtimeChannel = null;
      void realtime.removeChannel(channel);
    };
  },
}));
