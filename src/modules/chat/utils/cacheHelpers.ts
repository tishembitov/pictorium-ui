// src/modules/chat/utils/cacheHelpers.ts

import type {
    MessageResponse,
    ChatResponse,
    MessagesInfiniteData,
    PageMessageResponse,
    MessageState,
    MessageType,
  } from '../types/chat.types';
  
  // ===== Message Helpers =====
  
  /**
   * Проверяет, совпадают ли сообщения (для замены temp на реальное)
   */
  export const isMessageMatch = (
    existing: MessageResponse,
    incoming: MessageResponse
  ): boolean => {
    if (existing.id === incoming.id) return true;
  
    if (existing.id.startsWith('temp-') && existing.senderId === incoming.senderId) {
      if (incoming.type === 'IMAGE' && incoming.imageId) {
        return existing.imageId === incoming.imageId;
      }
  
      if (incoming.type === 'TEXT' && existing.content === incoming.content) {
        const timeDiff = Math.abs(
          new Date(existing.createdAt).getTime() - new Date(incoming.createdAt).getTime()
        );
        return timeDiff < 30000;
      }
    }
  
    return false;
  };
  
  /**
   * Проверяет, существует ли сообщение в страницах
   */
  export const messageExistsInPages = (
    pages: MessagesInfiniteData['pages'],
    message: MessageResponse
  ): boolean => {
    return pages.some((page) =>
      page.content.some((m) => isMessageMatch(m, message))
    );
  };
  
  /**
   * Заменяет temp-сообщение на реальное
   */
  export const replaceMessageInPages = (
    pages: MessagesInfiniteData['pages'],
    message: MessageResponse
  ): MessagesInfiniteData['pages'] | null => {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (!page) continue;
  
      const existingIndex = page.content.findIndex((m) => isMessageMatch(m, message));
  
      if (existingIndex !== -1) {
        return pages.map((p, idx) => {
          if (idx !== i) return p;
          return {
            ...p,
            content: p.content.map((m, mIdx) =>
              mIdx === existingIndex ? message : m
            ),
          };
        });
      }
    }
  
    return null;
  };
  
  /**
   * Добавляет сообщение в начало первой страницы
   */
  export const addMessageToFirstPage = (
    pages: MessagesInfiniteData['pages'],
    message: MessageResponse
  ): MessagesInfiniteData['pages'] => {
    const firstPage = pages[0];
    if (!firstPage) return pages;
  
    return [
      {
        ...firstPage,
        content: [message, ...firstPage.content],
        totalElements: firstPage.totalElements + 1,
      },
      ...pages.slice(1),
    ];
  };
  
  /**
   * Добавляет или заменяет сообщение (upsert)
   */
  export const upsertMessage = (
    pages: MessagesInfiniteData['pages'],
    message: MessageResponse
  ): MessagesInfiniteData['pages'] => {
    const replacedPages = replaceMessageInPages(pages, message);
    if (replacedPages) {
      return replacedPages;
    }
  
    return addMessageToFirstPage(pages, message);
  };
  
  /**
   * Создает начальные данные для infinite query
   */
  export const createInitialMessagesData = (
    message: MessageResponse
  ): MessagesInfiniteData => ({
    pages: [
      {
        content: [message],
        totalElements: 1,
        totalPages: 1,
        size: 50,
        number: 0,
        first: true,
        last: true,
        empty: false,
      } as PageMessageResponse,
    ],
    pageParams: [0],
  });
  
  /**
   * Обновляет состояние всех сообщений в страницах
   */
  export const updateMessagesState = (
    pages: MessagesInfiniteData['pages'],
    newState: MessageState
  ): MessagesInfiniteData['pages'] => {
    return pages.map((page) => ({
      ...page,
      content: page.content.map((msg): MessageResponse => ({
        ...msg,
        state: newState,
      })),
    }));
  };
  
  // ===== Chat List Helpers =====
  
  export interface UpdateChatParams {
    chatId: string;
    lastMessage: string | null;
    lastMessageTime: string;
    lastMessageType: MessageType;
    lastMessageImageId: string | null;
    unreadCount?: number;
  }
  
  /**
   * Обновляет чат в списке
   */
  export const updateChatInList = (
    chats: ChatResponse[],
    params: UpdateChatParams
  ): ChatResponse[] => {
    return chats.map((chat) => {
      if (chat.id !== params.chatId) return chat;
  
      return {
        ...chat,
        lastMessage: params.lastMessage,
        lastMessageTime: params.lastMessageTime,
        lastMessageType: params.lastMessageType,
        lastMessageImageId: params.lastMessageImageId,
        unreadCount: params.unreadCount ?? chat.unreadCount,
      };
    });
  };
  
  /**
   * Обновляет unread count в чате
   */
  export const updateChatUnreadCount = (
    chats: ChatResponse[],
    chatId: string,
    unreadCount: number
  ): ChatResponse[] => {
    return chats.map((chat) =>
      chat.id === chatId ? { ...chat, unreadCount } : chat
    );
  };
  
  /**
   * Инкрементирует unread count в чате
   */
  export const incrementChatUnread = (
    chats: ChatResponse[],
    chatId: string
  ): ChatResponse[] => {
    return chats.map((chat) =>
      chat.id === chatId
        ? { ...chat, unreadCount: (chat.unreadCount || 0) + 1 }
        : chat
    );
  };
  
  /**
   * Проверяет, существует ли чат в списке
   */
  export const chatExistsInList = (
    chats: ChatResponse[],
    chatId: string
  ): boolean => {
    return chats.some((chat) => chat.id === chatId);
  };
  
  // ===== Deduplication =====
  
  const processedIds = new Set<string>();
  const MAX_PROCESSED_IDS = 200;
  
  /**
   * Помечает ID как обработанный, возвращает false если уже был обработан
   */
  export const markAsProcessed = (id: string): boolean => {
    if (processedIds.has(id)) {
      return false;
    }
  
    processedIds.add(id);
  
    // Cleanup old IDs
    if (processedIds.size > MAX_PROCESSED_IDS) {
      const idsArray = Array.from(processedIds);
      const toRemove = idsArray.slice(0, -MAX_PROCESSED_IDS);
      toRemove.forEach((oldId) => processedIds.delete(oldId));
    }
  
    return true;
  };
  
  /**
   * Очищает все обработанные ID
   */
  export const clearProcessedIds = (): void => {
    processedIds.clear();
  };