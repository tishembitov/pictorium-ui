// src/modules/chat/services/websocketService.ts

import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { env } from '@/app/config/env';
import { keycloak } from '@/app/config/keycloak';
import type { WebSocketMessage } from '../types/chat.types';

type MessageHandler = (message: WebSocketMessage) => void;
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
  private readonly messageHandlers: Set<MessageHandler> = new Set();
  private readonly connectionHandlers: Set<ConnectionHandler> = new Set();
  private reconnectAttempts = 0;
  private readonly config: WebSocketServiceConfig;
  private isManualDisconnect = false;

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

    // Create STOMP client over SockJS
    this.client = new Client({
      webSocketFactory: () => new SockJS(`${env.apiGatewayUrl}/ws`),
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
      },

      onDisconnect: () => {
        console.log('[WebSocket] Disconnected');
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
    
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    this.notifyConnectionHandlers(false);
  }

  /**
   * Subscribe to user's personal channel
   */
  private subscribeToUserChannel(userId: string): void {
    if (!this.client?.connected) {
      return;
    }

    const destination = `/user/${userId}/chat`;
    
    this.subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const parsed = JSON.parse(message.body) as WebSocketMessage;
        this.notifyMessageHandlers(parsed);
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error);
      }
    });

    console.log('[WebSocket] Subscribed to:', destination);
  }

  /**
   * Send message through WebSocket
   */
  send(destination: string, body: object): void {
    if (!this.client?.connected) {
      console.error('[WebSocket] Not connected');
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${keycloak.token}`,
      },
    });
  }

  /**
   * Send typing indicator
   */
  sendTyping(chatId: string, isTyping: boolean): void {
    this.send('/app/typing', {
      chatId,
      isTyping,
    });
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
  private notifyMessageHandlers(message: WebSocketMessage): void {
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