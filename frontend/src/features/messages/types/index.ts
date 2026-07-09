export interface ConversationUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface Conversation {
  id: string;
  user_one_id: string;
  user_two_id: string;
  created_at: string;
  updated_at: string;
  user_one: ConversationUser;
  user_two: ConversationUser;
}

export interface Message {
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
  sender: ConversationUser;
}

export type MessageDeleteMode = 'sender' | 'all';

export interface MessagesState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  messagesPage: number;
  messagesHasMore: boolean;
  messagesTotal: number;
  fetchConversations: () => Promise<void>;
  startConversation: (targetUserId: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  loadOlderMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, body: string) => Promise<void>;
  editMessage: (conversationId: string, messageId: string, body: string) => Promise<Message>;
  deleteMessage: (conversationId: string, messageId: string, mode: MessageDeleteMode) => Promise<Message>;
  togglePin: (conversationId: string, message: Message) => Promise<Message>;
  fetchPinnedMessages: (conversationId: string) => Promise<Message[]>;
}
