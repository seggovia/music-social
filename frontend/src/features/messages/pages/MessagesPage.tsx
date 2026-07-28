import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useMessagesStore } from '../stores/messagesStore';
import type { Message, MessageDeleteMode } from '../types';
import { useAuthStore } from '@/features/auth/stores/authStore';
import styles from './MessagesPage.module.css';

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const UNSEND_FOR_ALL_WINDOW_MS = 15 * 60 * 1000;
const CONTEXT_MENU_WIDTH = 220;
const CONTEXT_MENU_ITEM_HEIGHT = 44;
const CONTEXT_MENU_PADDING = 10;
const CONTEXT_MENU_GAP = 6;
const VIEWPORT_MARGIN = 8;

interface MessageActions {
  isOwn: boolean;
  canPin: boolean;
  canEdit: boolean;
  canDeleteForMe: boolean;
  canDeleteForAll: boolean;
}

interface ContextMenuPosition {
  top: number;
  left: number;
}

function getMessageAgeMs(message: Message, now: number) {
  const createdAt = new Date(message.created_at).getTime();
  return Number.isNaN(createdAt) ? Number.POSITIVE_INFINITY : now - createdAt;
}

function getMessageActions(message: Message, userId: string | undefined, now: number): MessageActions {
  const isOwn = Boolean(userId && (message.sender_id === userId || message.sender?.id === userId));
  const isDeletedForAll = message.deleted_for_all;
  const messageAgeMs = getMessageAgeMs(message, now);

  return {
    isOwn,
    canPin: !isDeletedForAll,
    canEdit: isOwn && !isDeletedForAll && !message.deleted_for_sender && messageAgeMs < EDIT_WINDOW_MS,
    canDeleteForMe: isOwn && !isDeletedForAll && !message.deleted_for_sender,
    canDeleteForAll: isOwn && !isDeletedForAll && !message.deleted_for_sender
      && messageAgeMs < UNSEND_FOR_ALL_WINDOW_MS,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
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
  const [contextMenuPosition, setContextMenuPosition] = useState<ContextMenuPosition | null>(null);
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
        setContextMenuPosition(null);
      }
    };

    const handleViewportChange = () => {
      setActiveMenuMessageId(null);
      setContextMenuPosition(null);
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('scroll', handleViewportChange, true);
    window.addEventListener('resize', handleViewportChange);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('scroll', handleViewportChange, true);
      window.removeEventListener('resize', handleViewportChange);
    };
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
    setContextMenuPosition(null);
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
    setContextMenuPosition(null);
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
      ? '¿Anular envío para ti? El mensaje se ocultará de tu conversación.'
      : '¿Anular envío para ambos? Esta acción no se puede deshacer.';

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
      setContextMenuPosition(null);
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
      setContextMenuPosition(null);
      const data = await fetchPinnedMessages(currentConversation.id);
      setPinnedMessages(data.filter((item) => !(item.deleted_for_sender && item.sender_id === me?.id)).slice(0, 2));
    } catch {
      // The store already reports the API error.
    }
  };

  const handleToggleMessageMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    messageId: string,
    actions: MessageActions,
  ) => {
    event.stopPropagation();

    if (activeMenuMessageId === messageId) {
      setActiveMenuMessageId(null);
      setContextMenuPosition(null);
      return;
    }

    const itemCount = [
      actions.canPin,
      actions.canEdit,
      actions.canDeleteForMe,
      actions.canDeleteForAll,
    ].filter(Boolean).length;
    const estimatedHeight = itemCount * CONTEXT_MENU_ITEM_HEIGHT + CONTEXT_MENU_PADDING;
    const triggerRect = event.currentTarget.getBoundingClientRect();
    const preferredLeft = actions.isOwn
      ? triggerRect.right - CONTEXT_MENU_WIDTH
      : triggerRect.left;
    const left = clamp(
      preferredLeft,
      VIEWPORT_MARGIN,
      window.innerWidth - CONTEXT_MENU_WIDTH - VIEWPORT_MARGIN,
    );
    const shouldOpenAbove = triggerRect.bottom + CONTEXT_MENU_GAP + estimatedHeight
      > window.innerHeight;
    const preferredTop = shouldOpenAbove
      ? triggerRect.top - CONTEXT_MENU_GAP - estimatedHeight
      : triggerRect.bottom + CONTEXT_MENU_GAP;
    const top = clamp(
      preferredTop,
      VIEWPORT_MARGIN,
      window.innerHeight - estimatedHeight - VIEWPORT_MARGIN,
    );

    setContextMenuPosition({ top, left });
    setActiveMenuMessageId(messageId);
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
              {displayMessages.map((message) => {
                const actions = getMessageActions(message, me?.id, now);
                const { isOwn, canPin, canEdit, canDeleteForMe, canDeleteForAll } = actions;
                const isDeletedForAll = message.deleted_for_all;
                const hasContextMenuActions = canPin || canEdit || canDeleteForMe || canDeleteForAll;
                const isEditing = editingMessageId === message.id;
                const isMenuOpen = activeMenuMessageId === message.id && contextMenuPosition !== null;

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
                          onClick={(event) => handleToggleMessageMenu(event, message.id, actions)}
                          aria-label="Abrir opciones del mensaje"
                          aria-expanded={isMenuOpen}
                          aria-haspopup="menu"
                        >
                          ...
                        </button>
                      )}

                      {isMenuOpen && !isEditing && hasContextMenuActions && contextMenuPosition && createPortal(
                        <div
                          className={styles.contextMenu}
                          style={{ top: contextMenuPosition.top, left: contextMenuPosition.left }}
                          role="menu"
                          aria-label="Opciones del mensaje"
                        >
                          {canPin && (
                            <button type="button" role="menuitem" className={styles.contextMenuItem} onClick={() => void handleTogglePin(message)}>
                              {message.pinned ? 'Unpin' : 'Pin'}
                            </button>
                          )}
                          {(canEdit || canDeleteForMe || canDeleteForAll) && (
                            <>
                              {canEdit && (
                                <button type="button" role="menuitem" className={styles.contextMenuItem} onClick={() => handleStartEdit(message)}>
                                  Edit
                                </button>
                              )}
                              {canDeleteForMe && (
                                <button type="button" role="menuitem" className={styles.contextMenuItem} onClick={() => void handleDelete(message, 'sender')}>
                                  Anular envío para mí
                                </button>
                              )}
                              {canDeleteForAll && (
                                <button type="button" role="menuitem" className={`${styles.contextMenuItem} ${styles.contextMenuItemDanger}`} onClick={() => void handleDelete(message, 'all')}>
                                  Anular envío para ambos
                                </button>
                              )}
                            </>
                          )}
                        </div>,
                        document.body,
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
