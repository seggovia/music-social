import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMessagesStore } from '../stores/messagesStore';
import type { Message, MessageDeleteMode } from '../types';
import { useAuthStore } from '@/features/auth/stores/authStore';
import styles from './MessagesPage.module.css';

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const UNSEND_FOR_ALL_WINDOW_MS = 15 * 60 * 1000;

function getMessageAgeMs(message: Message, now: number) {
  const createdAt = new Date(message.created_at).getTime();
  return Number.isNaN(createdAt) ? Number.POSITIVE_INFINITY : now - createdAt;
}

export function MessagesPage() {
  const {
    conversations,
    currentConversation,
    messages,
    messagesHasMore,
    isLoadingMore,
    fetchConversations,
    fetchMessages,
    loadOlderMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    togglePin,
    fetchPinnedMessages,
  } = useMessagesStore();
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const [inputText, setInputText] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    setLocalMessages(messages ?? []);
  }, [messages]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!currentConversation) {
      setPinnedMessages([]);
      return;
    }

    const loadPinnedMessages = async () => {
      try {
        const data = await fetchPinnedMessages(currentConversation.id);
        setPinnedMessages(data.filter((message) => !(message.deleted_for_sender && message.sender_id === user?.id)).slice(0, 2));
      } catch {
        setPinnedMessages([]);
      }
    };

    void loadPinnedMessages();
  }, [currentConversation, fetchPinnedMessages, user?.id]);

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
      setMobileView('chat');
      void fetchMessages(conversationId);
    }
  }, [conversations, fetchMessages, location.state]);

  const me = useMemo(() => user ?? null, [user]);

  const handleSelectConversation = async (conversationId: string) => {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) return;

    useMessagesStore.setState({ currentConversation: conversation });
    setMobileView('chat');
    await fetchMessages(conversationId);
  };

  const handleBackToConversations = () => {
    setActiveMenuMessageId(null);
    setMobileView('list');
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
      edited_at: null,
      deleted_for_sender: false,
      deleted_for_all: false,
      pinned: false,
      pinned_at: null,
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

  const handleStartEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingBody(message.body);
    setActiveMenuMessageId(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingBody('');
  };

  const handleEditSave = async (message: Message) => {
    if (!currentConversation) return;
    const trimmed = editingBody.trim();
    if (!trimmed) return;
    if (trimmed === message.body) {
      handleCancelEdit();
      return;
    }

    try {
      const updatedMessage = await editMessage(currentConversation.id, message.id, trimmed);
      setLocalMessages((prev) => prev.map((item) => (item.id === message.id ? updatedMessage : item)));
      setEditingMessageId(null);
      setEditingBody('');
    } catch {
      // The store already reports the API error.
    }
  };

  const handleDelete = async (message: Message, mode: MessageDeleteMode) => {
    if (!currentConversation) return;

    const confirmationMessage = mode === 'sender'
      ? 'Anular envio para ti? El mensaje se ocultara de tu conversacion.'
      : 'Anular envio para ambos? Esta accion no se puede deshacer.';

    if (!window.confirm(confirmationMessage)) return;

    try {
      const updatedMessage = await deleteMessage(currentConversation.id, message.id, mode);
      if (mode === 'sender') {
        setLocalMessages((prev) => prev.filter((item) => item.id !== message.id));
        setPinnedMessages((prev) => prev.filter((item) => item.id !== message.id));
      } else {
        setLocalMessages((prev) => prev.map((item) => (item.id === message.id ? { ...item, ...updatedMessage, deleted_for_all: true, deleted_for_sender: false } : item)));
        setPinnedMessages((prev) => prev.filter((item) => item.id !== message.id));
      }
      setActiveMenuMessageId(null);
    } catch {
      // The store already reports the API error.
    }
  };

  const handleTogglePin = async (message: Message) => {
    if (!currentConversation) return;

    try {
      const updatedMessage = await togglePin(currentConversation.id, message);
      setLocalMessages((prev) => prev.map((item) => (item.id === message.id ? updatedMessage : item)));
      setActiveMenuMessageId(null);
      const data = await fetchPinnedMessages(currentConversation.id);
      setPinnedMessages(data.filter((item) => !(item.deleted_for_sender && item.sender_id === me?.id)).slice(0, 2));
    } catch {
      // The store already reports the API error.
    }
  };

  const otherUser = currentConversation
    ? currentConversation.user_one && currentConversation.user_two
      ? currentConversation.user_one.id === me?.id
        ? currentConversation.user_two
        : currentConversation.user_one
      : null
    : null;

  const displayMessages = localMessages.filter((message) => !(message.deleted_for_sender && message.sender_id === me?.id));

  return (
    <div className={`${styles.page} ${mobileView === 'chat' ? styles.mobileChatOpen : styles.mobileListOpen}`}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <p className={styles.sidebarEyebrow}>Direct messages</p>
          <div className={styles.sidebarTitleRow}>
            <h1 className={styles.sidebarTitle}>Messages</h1>
            <span className={styles.sidebarCount}>{conversations.length}</span>
          </div>
        </div>
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
                    <div className={styles.conversationAvatarWrap}>
                      <img
                        src={participant.avatar_url ?? 'https://placehold.co/40x40?text=U'}
                        alt={participant.username}
                        className={styles.avatar}
                      />
                    </div>
                    <div className={styles.conversationContent}>
                      <div className={styles.conversationTopLine}>
                        <div className={styles.username}>{participant.username}</div>
                        {isActive ? <span className={styles.activeDot} aria-label="Active conversation" /> : null}
                      </div>
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
              <button
                type="button"
                className={styles.mobileBackButton}
                onClick={handleBackToConversations}
                aria-label="Volver a conversaciones"
              >
                <span aria-hidden="true">←</span>
                <span>Volver</span>
              </button>
              <div className={styles.panelAvatarWrap}>
                <img
                  src={otherUser.avatar_url ?? 'https://placehold.co/40x40?text=U'}
                  alt={otherUser.username}
                  className={styles.avatar}
                />
              </div>
              <div>
                <p className={styles.panelEyebrow}>Conversation with</p>
                <div className={styles.panelHeaderName}>{otherUser.username}</div>
              </div>
            </div>

            {pinnedMessages.length > 0 && (
              <section className={styles.pinnedBar} aria-label="Pinned messages">
                <div className={styles.pinnedHeader}>
                  <span className={styles.pinnedIcon} aria-hidden="true">Pin</span>
                  <div>
                    <p className={styles.pinnedEyebrow}>Pinned</p>
                    <h2 className={styles.pinnedTitle}>Saved in this chat</h2>
                  </div>
                </div>
                <div className={styles.pinnedList}>
                  {pinnedMessages.map((message) => (
                    <article key={message.id} className={styles.pinnedItem}>
                      {message.body}
                    </article>
                  ))}
                </div>
              </section>
            )}

            <div className={styles.messagesArea}>
              {messagesHasMore && (
                <button
                  type="button"
                  className={styles.loadOlderButton}
                  onClick={() => void loadOlderMessages(currentConversation.id)}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? 'Loading...' : 'Load older messages'}
                </button>
              )}
              {displayMessages.map((message, index) => {
                const isOwn = message.sender_id === me?.id;
                const messageAgeMs = getMessageAgeMs(message, now);
                const isDeletedForAll = message.deleted_for_all;
                const canPin = !isDeletedForAll;
                const canEdit = isOwn && !isDeletedForAll && messageAgeMs < EDIT_WINDOW_MS;
                const canDeleteForMe = isOwn && !isDeletedForAll;
                const canDeleteForAll = isOwn && !isDeletedForAll && messageAgeMs < UNSEND_FOR_ALL_WINDOW_MS;
                const hasContextMenuActions = canPin || canEdit || canDeleteForMe || canDeleteForAll;
                const isEditing = editingMessageId === message.id;
                const isMenuOpen = activeMenuMessageId === message.id;
                const shouldOpenMenuAbove = index >= Math.max(displayMessages.length - 3, 0);
                const contextMenuClassName = [
                  styles.contextMenu,
                  isOwn ? styles.contextMenuOwn : '',
                  shouldOpenMenuAbove ? styles.contextMenuAbove : '',
                ].filter(Boolean).join(' ');

                return (
                  <div key={message.id} className={`${styles.messageRow} ${isOwn ? styles.ownMessage : ''}`}>
                    <div className={styles.messageWrapper}>
                      <div className={`${styles.messageBubble} ${isOwn ? styles.ownBubble : styles.otherBubble} ${isDeletedForAll ? styles.deletedBubble : ''}`}>
                        {isEditing ? (
                          <div className={styles.editForm}>
                            <textarea
                              className={styles.editTextarea}
                              value={editingBody}
                              onChange={(event) => setEditingBody(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                  event.preventDefault();
                                  handleCancelEdit();
                                }
                                if (event.key === 'Enter' && !event.shiftKey) {
                                  event.preventDefault();
                                  void handleEditSave(message);
                                }
                              }}
                              rows={2}
                            />
                            <div className={styles.editActions}>
                              <button type="button" className={styles.editButton} onClick={() => void handleEditSave(message)}>Save</button>
                              <button type="button" className={styles.editButtonSecondary} onClick={handleCancelEdit}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className={styles.messageText}>{isDeletedForAll ? 'Mensaje anulado' : message.body}</div>
                            <div className={styles.messageMeta}>
                              {new Date(message.created_at).toLocaleTimeString()}
                              {message.edited_at ? ' - edited' : ''}
                            </div>
                          </>
                        )}
                      </div>

                      {!isEditing && hasContextMenuActions && (
                        <button
                          type="button"
                          className={`${styles.menuButton} ${isOwn ? styles.menuButtonLeft : ''}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setActiveMenuMessageId(isMenuOpen ? null : message.id);
                          }}
                        >
                          ...
                        </button>
                      )}

                      {isMenuOpen && !isEditing && hasContextMenuActions && (
                        <div className={contextMenuClassName}>
                          {canPin && (
                            <button type="button" className={styles.contextMenuItem} onClick={() => void handleTogglePin(message)}>
                              {message.pinned ? 'Unpin' : 'Pin'}
                            </button>
                          )}
                          {(canEdit || canDeleteForMe || canDeleteForAll) && (
                            <>
                              {canEdit && (
                                <button type="button" className={styles.contextMenuItem} onClick={() => handleStartEdit(message)}>
                                  Edit
                                </button>
                              )}
                              {canDeleteForMe && (
                                <button type="button" className={styles.contextMenuItem} onClick={() => void handleDelete(message, 'sender')}>
                                  Anular envio para mi
                                </button>
                              )}
                              {canDeleteForAll && (
                                <button type="button" className={`${styles.contextMenuItem} ${styles.contextMenuItemDanger}`} onClick={() => void handleDelete(message, 'all')}>
                                  Anular envio para ambos
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
