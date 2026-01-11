// src/modules/chat/types/chat.types.ts

// ===== Message Types =====
export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
export type MessageState = 'SENT' | 'DELIVERED' | 'READ';

// ===== WebSocket Message Types (соответствуют бэкенду) =====
export type WsMessageType =
  // Client → Server
  | 'SEND_MESSAGE'
  | 'TYPING_START'
  | 'TYPING_STOP'
  | 'MARK_READ'
  | 'JOIN_CHAT'
  | 'LEAVE_CHAT'
  | 'HEARTBEAT'
  // Server → Client
  | 'NEW_MESSAGE'
  | 'USER_TYPING'
  | 'USER_STOPPED_TYPING'
  | 'MESSAGES_READ'
  | 'USER_ONLINE'
  | 'USER_OFFLINE'
  | 'ERROR';

// ===== API Response Types =====

export interface ChatResponse {
  id: string;
  recipientId: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string | null;
  type: MessageType;
  state: MessageState;
  imageId: string | null;
  createdAt: string;
}

export interface UserPresenceResponse {
  onlineStatus: Record<string, boolean>;
}

// ===== Extended Types (with user info) =====

export interface ChatWithRecipient extends ChatResponse {
  recipient?: {
    id: string;
    username: string;
    imageId: string | null;
  };
  isOnline?: boolean;
}

export interface MessageWithSender extends MessageResponse {
  sender?: {
    id: string;
    username: string;
    imageId: string | null;
  };
  isSelf: boolean;
  imageUrl?: string;
}

// ===== WebSocket Types (соответствуют бэкенду) =====

/**
 * Incoming message from client to server
 */
export interface WsIncomingMessage {
  type: WsMessageType;
  chatId?: string;
  content?: string;
  messageType?: MessageType;
  imageId?: string;
}

/**
 * Outgoing message from server to client
 */
export interface WsOutgoingMessage {
  type: WsMessageType;
  chatId?: string;
  userId?: string;
  message?: MessageResponse;
  error?: string;
  timestamp: string;
}

// ===== Store Types =====

export interface ChatState {
  selectedChatId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  typingUsers: Record<string, string[]>;
  totalUnread: number;
}

export interface ChatActions {
  setSelectedChat: (chatId: string | null) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setTypingUser: (chatId: string, userId: string, isTyping: boolean) => void;
  setTotalUnread: (count: number) => void;
  incrementTotalUnread: () => void;
  decrementTotalUnread: (by?: number) => void;
  reset: () => void;
}

// ===== Paginated Response =====

export interface PageMessageResponse {
  content: MessageResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ===== Cache Update Types =====

export interface MessagesInfiniteData {
  pages: PageMessageResponse[];
  pageParams: number[];
}