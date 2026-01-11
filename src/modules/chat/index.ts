// src/modules/chat/index.ts

// Types
export type {
    MessageType,
    MessageState,
    ChatResponse,
    MessageResponse,
    UserPresenceResponse,
    ChatWithRecipient,
    MessageWithSender,
    SendMessageRequest,
    WebSocketEventType,
    WebSocketMessage,
    ChatState,
    ChatActions,
    PageMessageResponse,
  } from './types/chat.types';
  
  // API
  export { chatApi } from './api/chatApi';
  export { messageApi } from './api/messageApi';
  export { presenceApi } from './api/presenceApi';
  
  // Store
  export { 
    useChatStore,
    selectSelectedChatId,
    selectIsConnected,
    selectIsConnecting,
    selectTotalUnread,
    selectTypingUsers,
  } from './stores/chatStore';
  
  // Services
  export { websocketService } from './services/websocketService';
  
  // Hooks
  export { useChats } from './hooks/useChats';
  export { useChat, useGetOrCreateChat, useDeleteChat } from './hooks/useChat';
  export { useMessages, useAllMessages, useAddMessageToCache } from './hooks/useMessages';
  export { useSendMessage } from './hooks/useSendMessage';
  export { useMarkAsRead } from './hooks/useMarkAsRead';
  export { usePresence, useUserPresence, useUsersPresence } from './hooks/usePresence';
  export { useChatWebSocket } from './hooks/useChatWebSocket';
  export { useTotalUnread } from './hooks/useTotalUnread';
  
  // Components
  export { OnlineIndicator } from './components/OnlineIndicator';
  export { ChatBadge } from './components/ChatBadge';
  export { MessageItem } from './components/MessageItem';
  export { MessageList } from './components/MessageList';
  export { MessageInput } from './components/MessageInput';
  export { ChatHeader } from './components/ChatHeader';
  export { ChatListItem } from './components/ChatListItem';
  export { ChatList } from './components/ChatList';
  export { ChatWindow } from './components/ChatWindow';
  export { NewChatModal } from './components/NewChatModal';