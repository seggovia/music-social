import { supabase } from '../../config/supabase.js';
import { AppError } from '../../shared/errors/AppError.js';

export const messagesRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'messages' };
  },

  async findOrCreateConversation(userOneId: string, userTwoId: string) {
    const { data: directConversation, error: directError } = await supabase
      .from('conversations')
      .select('*')
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
      .select('*')
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
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to create conversation', 500, error);
    }

    return data;
  },

  async getConversations(userId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, user_one:users!conversations_user_one_id_fkey(id, username, avatar_url), user_two:users!conversations_user_two_id_fkey(id, username, avatar_url)')
      .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`);

    if (error) {
      throw new AppError('Failed to fetch conversations', 500, error);
    }

    return data ?? [];
  },

  async getMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:users!messages_sender_id_fkey(id, username, avatar_url)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppError('Failed to fetch messages', 500, error);
    }

    return data ?? [];
  },

  async sendMessage(conversationId: string, senderId: string, body: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, body })
      .select()
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
};
