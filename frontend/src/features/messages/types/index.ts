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
  sender: ConversationUser;
}

export interface MessagesState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  fetchConversations: () => Promise<void>;
  startConversation: (targetUserId: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, body: string) => Promise<void>;
}
