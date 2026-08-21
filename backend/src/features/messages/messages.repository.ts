import { supabase } from '../../config/supabase.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { Pagination } from '../../shared/pagination.js';
import { createPaginatedResponse } from '../../shared/pagination.js';

const MESSAGE_WITH_SENDER_SELECT = '*, sender:users!messages_sender_id_fkey(id, username, avatar_url)';
const CONVERSATION_WITH_USERS_SELECT = '*, user_one:users!conversations_user_one_id_fkey(id, username, avatar_url), user_two:users!conversations_user_two_id_fkey(id, username, avatar_url)';

export const messagesRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'messages' };
  },

  async findOrCreateConversation(userOneId: string, userTwoId: string) {
    const { data: directConversation, error: directError } = await supabase
      .from('conversations')
      .select(CONVERSATION_WITH_USERS_SELECT)
      .eq('user_one_id', userOneId)
      .eq('user_two_id', userTwoId)
      .maybeSingle();

    if (directError) {
      throw new AppError('Failed to look up conversation', 500, directError);
    }

    if (directConversation) {
      return directConversation;
    }

    const { data: reverseConversation, error: reverseError } = await supabase
      .from('conversations')
      .select(CONVERSATION_WITH_USERS_SELECT)
      .eq('user_one_id', userTwoId)
      .eq('user_two_id', userOneId)
      .maybeSingle();

    if (reverseError) {
      throw new AppError('Failed to look up conversation', 500, reverseError);
    }

    if (reverseConversation) {
      return reverseConversation;
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_one_id: userOneId, user_two_id: userTwoId })
      .select(CONVERSATION_WITH_USERS_SELECT)
      .single();

    if (error) {
      throw new AppError('Failed to create conversation', 500, error);
    }

    return data;
  },

  async getConversations(userId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select(CONVERSATION_WITH_USERS_SELECT)
      .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`);

    if (error) {
      throw new AppError('Failed to fetch conversations', 500, error);
    }

    const conversations = data ?? [];
    if (conversations.length === 0) return conversations;

    const { data: unreadMessages, error: unreadError } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', conversations.map((conversation) => conversation.id))
      .neq('sender_id', userId)
      .eq('deleted_for_all', false)
      .is('read_at', null);

    if (unreadError) {
      throw new AppError('Failed to count unread messages', 500, unreadError);
    }

    const unreadByConversation = new Map<string, number>();
    for (const message of unreadMessages ?? []) {
      const count = unreadByConversation.get(message.conversation_id) ?? 0;
      unreadByConversation.set(message.conversation_id, count + 1);
    }

    return conversations.map((conversation) => ({
      ...conversation,
      unread_count: unreadByConversation.get(conversation.id) ?? 0,
    }));
  },

  async getMessages(conversationId: string, pagination: Pagination) {
    const { data, error, count } = await supabase
      .from('messages')
      .select(MESSAGE_WITH_SENDER_SELECT, { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      throw new AppError('Failed to fetch messages', 500, error);
    }

    return createPaginatedResponse([...(data ?? [])].reverse(), count ?? 0, pagination);
  },

  async sendMessage(conversationId: string, senderId: string, body: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, body })
      .select(MESSAGE_WITH_SENDER_SELECT)
      .single();

    if (error) {
      throw new AppError('Failed to send message', 500, error);
    }

    return data;
  },

  async markAsRead(conversationId: string, userId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: 'now()' })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null);

    if (error) {
      throw new AppError('Failed to mark messages as read', 500, error);
    }
  },

  async editMessage(conversationId: string, messageId: string, senderId: string, body: string) {
    const { data: existingMessage, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .maybeSingle();

    if (fetchError) {
      throw new AppError('Failed to fetch message', 500, fetchError);
    }

    if (!existingMessage) {
      throw new AppError('Message not found', 404);
    }

    if (existingMessage.sender_id !== senderId) {
      throw new AppError('You can only edit your own messages', 403);
    }

    if (existingMessage.deleted_for_all || existingMessage.deleted_for_sender) {
      throw new AppError('Message can no longer be edited', 400);
    }

    const createdAt = new Date(existingMessage.created_at as string).getTime();
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (createdAt < twentyFourHoursAgo) {
      throw new AppError('Message can no longer be edited', 400);
    }

    const { data, error } = await supabase
      .from('messages')
      .update({ body, edited_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .select(MESSAGE_WITH_SENDER_SELECT)
      .single();

    if (error) {
      throw new AppError('Failed to edit message', 500, error);
    }

    return data;
  },

  async deleteMessage(conversationId: string, messageId: string, userId: string, mode: 'sender' | 'all') {
    const { data: existingMessage, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .maybeSingle();

    if (fetchError) {
      throw new AppError('Failed to fetch message', 500, fetchError);
    }

    if (!existingMessage) {
      throw new AppError('Message not found', 404);
    }

    if (existingMessage.sender_id !== userId) {
      throw new AppError('Only the sender can delete the message', 403);
    }

    if (mode === 'sender') {
      const { data, error } = await supabase
        .from('messages')
        .update({ deleted_for_sender: true })
        .eq('id', messageId)
        .eq('conversation_id', conversationId)
        .select(MESSAGE_WITH_SENDER_SELECT)
        .single();

      if (error) {
        throw new AppError('Failed to delete message', 500, error);
      }

      return data;
    }

    const createdAt = new Date(existingMessage.created_at as string).getTime();
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    if (createdAt < fifteenMinutesAgo) {
      throw new AppError('Message can no longer be deleted for everyone', 400);
    }

    const { data, error } = await supabase
      .from('messages')
      .update({ deleted_for_all: true, pinned: false, pinned_at: null })
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .select(MESSAGE_WITH_SENDER_SELECT)
      .single();

    if (error) {
      throw new AppError('Failed to delete message', 500, error);
    }

    return data;
  },

  async pinMessage(messageId: string, conversationId: string) {
    const { data: existingMessage, error: fetchError } = await supabase
      .from('messages')
      .select('id, pinned')
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .eq('deleted_for_all', false)
      .maybeSingle();

    if (fetchError) {
      throw new AppError('Failed to fetch message', 500, fetchError);
    }

    if (!existingMessage) {
      throw new AppError('Message not found', 404);
    }

    if (existingMessage.pinned) {
      const { data, error } = await supabase
        .from('messages')
        .select(MESSAGE_WITH_SENDER_SELECT)
        .eq('id', messageId)
        .eq('conversation_id', conversationId)
        .single();

      if (error) {
        throw new AppError('Failed to fetch message', 500, error);
      }

      return data;
    }

    const { count, error: countError } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('pinned', true)
      .eq('deleted_for_all', false);

    if (countError) {
      throw new AppError('Failed to count pinned messages', 500, countError);
    }

    if ((count ?? 0) >= 2) {
      throw new AppError('Maximum 2 pinned messages per conversation', 400);
    }

    const { data, error } = await supabase
      .from('messages')
      .update({ pinned: true, pinned_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .select(MESSAGE_WITH_SENDER_SELECT)
      .single();

    if (error) {
      throw new AppError('Failed to pin message', 500, error);
    }

    return data;
  },

  async unpinMessage(messageId: string, conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({ pinned: false, pinned_at: null })
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .select(MESSAGE_WITH_SENDER_SELECT)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to unpin message', 500, error);
    }

    if (!data) {
      throw new AppError('Message not found', 404);
    }

    return data;
  },

  async getPinnedMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(MESSAGE_WITH_SENDER_SELECT)
      .eq('conversation_id', conversationId)
      .eq('pinned', true)
      .eq('deleted_for_all', false)
      .order('pinned_at', { ascending: true });

    if (error) {
      throw new AppError('Failed to fetch pinned messages', 500, error);
    }

    return data ?? [];
  },
};
