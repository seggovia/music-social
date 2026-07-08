import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMessagesStore } from '../stores/messagesStore';
import type { Message } from '../types';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { apiClient } from '@/shared/api/client';
import { reportError } from '@/shared/lib/errors';
import styles from './MessagesPage.module.css';

type MessageWithMeta = Message & {
  pinned?: boolean;
  pinned_at?: string | null;
  edited_at?: string | null;
  deleted_for_all?: boolean;
  deleted_for_sender?: boolean;
};

export function MessagesPage() {
  const { conversations, currentConversation, messages, fetchConversations, fetchMessages, sendMessage } = useMessagesStore();
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const [inputText, setInputText] = useState('');
  const [localMessages, setLocalMessages] = useState<MessageWithMeta[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<MessageWithMeta[]>([]);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    setLocalMessages((messages as MessageWithMeta[]) ?? []);
  }, [messages]);

  useEffect(() => {
    if (!currentConversation) {
      setPinnedMessages([]);
      return;
    }

    const loadPinnedMessages = async () => {
      try {
        const data = await apiClient.get<MessageWithMeta[]>(
          `/messages/${currentConversation.id}/pinned`,
          authOptions(),
        );
        setPinnedMessages(data.slice(0, 2));
      } catch (error) {
        reportError(error, 'No pudimos cargar los mensajes fijados. Intenta de nuevo.', () => loadPinnedMessages());
      }
    };

    void loadPinnedMessages();
  }, [currentConversation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest(`.${styles.contextMenu}`) && !(event.target as HTMLElement).closest(`.${styles.menuButton}`)) {
        setActiveMenuMessageId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  const authOptions = (): RequestInit => {
    const token = useAuthStore.getState().accessToken;
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const handleSelectConversation = async (conversationId: string) => {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) return;

    useMessagesStore.setState({ currentConversation: conversation });
    await fetchMessages(conversationId);
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !currentConversation || !me) return;

    const tempMessage: MessageWithMeta = {
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

    setLocalMessages((prev) => [...prev, tempMessage]);
    setInputText('');

    try {
      await sendMessage(currentConversation.id, trimmed);
    } catch {
      setLocalMessages((prev) => prev.filter((message) => message.id !== tempMessage.id));
    }
  };

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await handleSend();
    }
  };

  const handleStartEdit = (message: MessageWithMeta) => {
    setEditingMessageId(message.id);
    setEditingBody(message.body);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingBody('');
  };

  const handleEditSave = async (message: MessageWithMeta) => {
    if (!currentConversation) return;
    const trimmed = editingBody.trim();
    if (!trimmed) return;

    try {
      const updatedMessage = await apiClient.put<MessageWithMeta>(
        `/messages/${currentConversation.id}/messages/${message.id}`,
        { body: trimmed },
        authOptions(),
      );
      setLocalMessages((prev) => prev.map((item) => (item.id === message.id ? updatedMessage : item)));
      setEditingMessageId(null);
      setEditingBody('');
    } catch (error) {
      reportError(error, 'No pudimos editar el mensaje. Intenta de nuevo.');
    }
  };

  const handleDelete = async (message: MessageWithMeta, mode: 'sender' | 'all') => {
    if (!currentConversation) return;

    try {
      const updatedMessage = await apiClient.delete<MessageWithMeta>(
        `/messages/${currentConversation.id}/messages/${message.id}`,
        { ...authOptions(), body: JSON.stringify({ mode }) },
      );
      if (mode === 'sender') {
        setLocalMessages((prev) => prev.filter((item) => item.id !== message.id));
      } else {
        setLocalMessages((prev) => prev.map((item) => (item.id === message.id ? { ...item, ...updatedMessage, deleted_for_all: true, deleted_for_sender: false } : item)));
      }
      setActiveMenuMessageId(null);
    } catch (error) {
      reportError(error, 'No pudimos eliminar el mensaje. Intenta de nuevo.');
    }
  };

  const handleTogglePin = async (message: MessageWithMeta) => {
    if (!currentConversation) return;

    try {
      const path = `/messages/${currentConversation.id}/messages/${message.id}/pin`;
      const updatedMessage = message.pinned
        ? await apiClient.delete<MessageWithMeta>(path, authOptions())
        : await apiClient.post<MessageWithMeta>(path, undefined, authOptions());
      setLocalMessages((prev) => prev.map((item) => (item.id === message.id ? updatedMessage : item)));
      setActiveMenuMessageId(null);
      const data = await apiClient.get<MessageWithMeta[]>(`/messages/${currentConversation.id}/pinned`, authOptions());
      setPinnedMessages(data.slice(0, 2));
    } catch (error) {
      reportError(error, 'No pudimos actualizar el mensaje fijado. Intenta de nuevo.');
    }
  };

  const otherUser = currentConversation
    ? currentConversation.user_one && currentConversation.user_two
      ? currentConversation.user_one.id === me?.id
        ? currentConversation.user_two
        : currentConversation.user_one
      : null
    : null;

  const displayMessages = localMessages.filter((message) => !message.deleted_for_sender);

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

            {pinnedMessages.length > 0 && (
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Pinned</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {pinnedMessages.map((message) => (
                    <div key={message.id} style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                      {message.body}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.messagesArea}>
              {displayMessages.map((message) => {
                const isOwn = message.sender_id === me?.id;
                const canDeleteForAll = isOwn && Date.now() - new Date(message.created_at).getTime() < 15 * 60 * 1000;
                const isEditing = editingMessageId === message.id;
                const isMenuOpen = activeMenuMessageId === message.id;

                return (
                  <div key={message.id} className={`${styles.messageRow} ${isOwn ? styles.ownMessage : ''}`}>
                    <div className={styles.messageWrapper}>
                      <div className={`${styles.messageBubble} ${isOwn ? styles.ownBubble : styles.otherBubble}`} style={{ background: message.deleted_for_all ? '#e5e7eb' : undefined }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <textarea
                              value={editingBody}
                              onChange={(event) => setEditingBody(event.target.value)}
                              rows={2}
                              style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--color-border)', padding: '0.4rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button type="button" onClick={() => void handleEditSave(message)}>Save</button>
                              <button type="button" onClick={handleCancelEdit}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>{message.deleted_for_all ? 'Mensaje eliminado' : message.body}</div>
                            <div className={styles.messageMeta}>{new Date(message.created_at).toLocaleTimeString()}</div>
                          </>
                        )}
                      </div>

                      {!isEditing && (
                        <button
                          type="button"
                          className={`${styles.menuButton} ${isOwn ? styles.menuButtonLeft : ''}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setActiveMenuMessageId(isMenuOpen ? null : message.id);
                          }}
                        >
                          ⋯
                        </button>
                      )}

                      {isMenuOpen && !isEditing && (
                        <div className={styles.contextMenu}>
                          <button type="button" className={styles.contextMenuItem} onClick={() => void handleTogglePin(message)}>
                            {message.pinned ? '📌 Unpin' : '📌 Pin'}
                          </button>
                          {isOwn && (
                            <>
                              <button type="button" className={styles.contextMenuItem} onClick={() => handleStartEdit(message)}>
                                ✏️ Edit
                              </button>
                              <button type="button" className={styles.contextMenuItem} onClick={() => void handleDelete(message, 'sender')}>
                                🗑️ Anular envío para mí
                              </button>
                              {canDeleteForAll && (
                                <button type="button" className={`${styles.contextMenuItem} ${styles.contextMenuItemDanger}`} onClick={() => void handleDelete(message, 'all')}>
                                  ❌ Anular envío
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
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
