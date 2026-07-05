import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMessagesStore } from '../stores/messagesStore';
import type { Message } from '../types';
import { useAuthStore } from '@/features/auth/stores/authStore';
import styles from './MessagesPage.module.css';

export function MessagesPage() {
  const { conversations, currentConversation, messages, fetchConversations, fetchMessages, sendMessage } = useMessagesStore();
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const [inputText, setInputText] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const conversationId = location.state?.conversationId as string | undefined;
    if (!conversationId || conversations.length === 0) {
      return;
    }

    const conversation = conversations.find((item) => item.id === conversationId) ?? null;
    if (conversation) {
      useMessagesStore.setState({ currentConversation: conversation });
      void fetchMessages(conversationId);
    }
  }, [conversations, fetchMessages, location.state]);

  const me = useMemo(() => user ?? null, [user]);

  const handleSelectConversation = async (conversationId: string) => {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) return;

    useMessagesStore.setState({ currentConversation: conversation });
    await fetchMessages(conversationId);
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !currentConversation || !me) return;

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConversation.id,
      sender_id: me.id,
      body: trimmed,
      read_at: null,
      created_at: new Date().toISOString(),
      sender: {
        id: me.id,
        username: me.username ?? 'You',
        avatar_url: me.avatar_url ?? null,
      },
    };

    setOptimisticMessages((prev) => [...prev, tempMessage]);
    setInputText('');

    try {
      await sendMessage(currentConversation.id, trimmed);
    } catch {
      setOptimisticMessages((prev) => prev.filter((message) => message.id !== tempMessage.id));
    }
  };

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await handleSend();
    }
  };

  const otherUser = currentConversation
    ? currentConversation.user_one && currentConversation.user_two
      ? currentConversation.user_one.id === me?.id
        ? currentConversation.user_two
        : currentConversation.user_one
      : null
    : null;

  const displayMessages = [...messages, ...optimisticMessages];

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>Messages</div>
        <div className={styles.conversationsList}>
          {conversations.map((conversation) => {
            const participant = conversation.user_one && conversation.user_two
              ? conversation.user_one.id === me?.id
                ? conversation.user_two
                : conversation.user_one
              : null;
            const isActive = currentConversation?.id === conversation.id;
            const lastMessage = conversation.user_one && conversation.user_two
              ? conversation.user_one.id === me?.id
                ? conversation.user_two.username
                : conversation.user_one.username
              : 'Conversation';

            return (
              <button
                key={conversation.id}
                type="button"
                className={`${styles.conversationItem} ${isActive ? styles.active : ''}`}
                onClick={() => void handleSelectConversation(conversation.id)}
              >
                {participant ? (
                  <>
                    <img
                      src={participant.avatar_url ?? 'https://placehold.co/40x40?text=U'}
                      alt={participant.username}
                      className={styles.avatar}
                    />
                    <div className={styles.conversationContent}>
                      <div className={styles.username}>{participant.username}</div>
                      <div className={styles.lastMessage}>{lastMessage}</div>
                    </div>
                  </>
                ) : (
                  <div className={styles.conversationContent}>
                    <div className={styles.username}>Conversation</div>
                    <div className={styles.lastMessage}>{lastMessage}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      <section className={styles.panel}>
        {currentConversation && otherUser ? (
          <>
            <div className={styles.panelHeader}>
              <img
                src={otherUser.avatar_url ?? 'https://placehold.co/40x40?text=U'}
                alt={otherUser.username}
                className={styles.avatar}
              />
              <div className={styles.panelHeaderName}>{otherUser.username}</div>
            </div>

            <div className={styles.messagesArea}>
              {displayMessages.map((message) => {
                const isOwn = message.sender_id === me?.id;
                return (
                  <div key={message.id} className={`${styles.messageRow} ${isOwn ? styles.ownMessage : ''}`}>
                    <div className={`${styles.messageBubble} ${isOwn ? styles.ownBubble : styles.otherBubble}`}>
                      <div>{message.body}</div>
                      <div className={styles.messageMeta}>{new Date(message.created_at).toLocaleTimeString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.inputArea}>
              <textarea
                className={styles.textarea}
                rows={2}
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a message"
              />
              <button type="button" className={styles.sendButton} onClick={() => void handleSend()}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>Select a conversation</div>
        )}
      </section>
    </div>
  );
}
