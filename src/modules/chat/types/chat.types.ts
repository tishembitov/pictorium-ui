// src/modules/chat/types/chat.types.ts

// ===== Message Types =====
export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
export type MessageState = 'SENT' | 'DELIVERED' | 'READ';

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

// ===== Request Types =====

export interface SendMessageRequest {
  chatId: string;
  content?: string;
  type: MessageType;
  imageId?: string;
}

// ===== WebSocket Types =====

export type WebSocketEventType = 
  | 'MESSAGE' 
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'FILE'
  | 'SEEN' 
  | 'DELIVERED' 
  | 'TYPING' 
  | 'ONLINE' 
  | 'OFFLINE';

export interface WebSocketMessage {
  type: WebSocketEventType;
  chatId: string;
  senderId: string;
  receiverId: string;
  content?: string;
  messageType?: MessageType;
  messageId?: string;
  imageId?: string;
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