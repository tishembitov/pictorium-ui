// src/modules/chat/services/websocketService.ts

import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { env } from '@/app/config/env';
import { keycloak } from '@/app/config/keycloak';
import type { 
  WsOutgoingMessage, 
  WsIncomingMessage, 
} from '../types/chat.types';

type MessageHandler = (message: WsOutgoingMessage) => void;
type ConnectionHandler = (connected: boolean) => void;

interface WebSocketServiceConfig {
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeatIncoming?: number;
  heartbeatOutgoing?: number;
}

const DEFAULT_CONFIG: WebSocketServiceConfig = {
  reconnectDelay: 5000,
  maxReconnectAttempts: 10,
  heartbeatIncoming: 10000,
  heartbeatOutgoing: 10000,
};

class WebSocketService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private presenceSubscription: StompSubscription | null = null;
  private readonly messageHandlers: Set<MessageHandler> = new Set();
  private readonly connectionHandlers: Set<ConnectionHandler> = new Set();
  private reconnectAttempts = 0;
  private readonly config: WebSocketServiceConfig;
  private isManualDisconnect = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(config: WebSocketServiceConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.client?.connected) {
      console.debug('[WebSocket] Already connected');
      return;
    }

    if (!keycloak.authenticated || !keycloak.token) {
      console.error('[WebSocket] Not authenticated');
      return;
    }

    const userId = keycloak.tokenParsed?.sub;
    if (!userId) {
      console.error('[WebSocket] User ID not found');
      return;
    }

    this.isManualDisconnect = false;

    // ✅ Исправленный endpoint: /ws/chat вместо /ws
    this.client = new Client({
      webSocketFactory: () => new SockJS(`${env.apiGatewayUrl}/ws/chat`),
      connectHeaders: {
        Authorization: `Bearer ${keycloak.token}`,
      },
      debug: (str) => {
        if (env.isDevelopment) {
          console.debug('[WebSocket]', str);
        }
      },
      reconnectDelay: this.config.reconnectDelay,
      heartbeatIncoming: this.config.heartbeatIncoming,
      heartbeatOutgoing: this.config.heartbeatOutgoing,

      onConnect: () => {
        console.log('[WebSocket] Connected');
        this.reconnectAttempts = 0;
        this.notifyConnectionHandlers(true);
        this.subscribeToUserChannel(userId);
        this.subscribeToPresence();
        this.startHeartbeat();
      },

      onDisconnect: () => {
        console.log('[WebSocket] Disconnected');
        this.stopHeartbeat();
        this.notifyConnectionHandlers(false);
      },

      onStompError: (frame) => {
        console.error('[WebSocket] STOMP error:', frame.headers.message);
        this.handleReconnect();
      },

      onWebSocketError: (event) => {
        console.error('[WebSocket] WebSocket error:', event);
        this.handleReconnect();
      },
    });

    this.client.activate();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isManualDisconnect = true;
    this.stopHeartbeat();
    
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    if (this.presenceSubscription) {
      this.presenceSubscription.unsubscribe();
      this.presenceSubscription = null;
    }

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    this.notifyConnectionHandlers(false);
  }

  /**
   * Subscribe to user's personal channel
   * ✅ Исправленный endpoint: /queue/messages вместо /chat
   */
  private subscribeToUserChannel(userId: string): void {
    if (!this.client?.connected) {
      return;
    }

    // ✅ Правильный destination для личных сообщений
    const destination = `/user/${userId}/queue/messages`;
    
    this.subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const parsed = JSON.parse(message.body) as WsOutgoingMessage;
        this.notifyMessageHandlers(parsed);
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error);
      }
    });

    console.log('[WebSocket] Subscribed to:', destination);
  }

  /**
   * Subscribe to presence updates
   */
  private subscribeToPresence(): void {
    if (!this.client?.connected) {
      return;
    }

    this.presenceSubscription = this.client.subscribe('/topic/presence', (message: IMessage) => {
      try {
        const parsed = JSON.parse(message.body) as WsOutgoingMessage;
        this.notifyMessageHandlers(parsed);
      } catch (error) {
        console.error('[WebSocket] Failed to parse presence message:', error);
      }
    });

    console.log('[WebSocket] Subscribed to presence');
  }

  
  private send(message: WsIncomingMessage): void {
    if (!this.client?.connected) {
      console.error('[WebSocket] Cannot send - not connected:', message.type);
      return;
    }

    this.client.publish({
      destination: '/app/chat',
      body: JSON.stringify(message),
      headers: {
        Authorization: `Bearer ${keycloak.token}`,
      },
    });
  }

  /**
   * Send a chat message
   */
  sendMessage(chatId: string, content: string, messageType: 'TEXT' | 'IMAGE' = 'TEXT', imageId?: string): void {
    if (!this.isConnected) {
      console.warn('[WebSocket] Cannot send message - not connected');
      return;
    }

    this.send({
      type: 'SEND_MESSAGE',
      chatId,
      content,
      messageType,
      imageId,
    });
  }

  /**
   * Send typing indicator
   */
  sendTyping(chatId: string, isTyping: boolean): void {
    if (!this.isConnected) {
      console.warn('[WebSocket] Cannot send typing - not connected');
      return;
    }

    this.send({
      type: isTyping ? 'TYPING_START' : 'TYPING_STOP',
      chatId,
    });
  }

  /**
   * Mark messages as read
   */
  markAsRead(chatId: string): void {
    if (!this.isConnected) {
      console.warn('[WebSocket] Cannot mark read - not connected');
      return;
    }

    this.send({
      type: 'MARK_READ',
      chatId,
    });
  }

  /**
   * Join a chat (for presence tracking)
   */
  joinChat(chatId: string): void {
    if (!this.isConnected) {
      console.warn('[WebSocket] Cannot join chat - not connected');
      return;
    }

    this.send({
      type: 'JOIN_CHAT',
      chatId,
    });
  }

  /**
   * Leave a chat
   */
  leaveChat(chatId: string): void {
    if (!this.isConnected) {
      console.warn('[WebSocket] Cannot leave chat - not connected');
      return;
    }

    this.send({
      type: 'LEAVE_CHAT',
      chatId,
    });
  }
  
  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.client?.connected) {
        this.send({ type: 'HEARTBEAT' });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Add message handler
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Add connection status handler
   */
  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.isManualDisconnect) {
      return;
    }

    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts ?? 10)) {
      console.error('[WebSocket] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WebSocket] Reconnecting... Attempt ${this.reconnectAttempts}`);
  }

  /**
   * Notify all message handlers
   */
  private notifyMessageHandlers(message: WsOutgoingMessage): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error('[WebSocket] Handler error:', error);
      }
    });
  }

  /**
   * Notify all connection handlers
   */
  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch (error) {
        console.error('[WebSocket] Connection handler error:', error);
      }
    });
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

export default websocketService;