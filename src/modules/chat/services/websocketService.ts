// src/modules/chat/services/websocketService.ts

import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { keycloak } from '@/app/config/keycloak';
import { env } from '@/app/config/env';
import type { WsOutgoingMessage, WsIncomingMessage } from '../types/chat.types';

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

  connect(): void {
    if (this.client?.connected) {
      return;
    }

    if (!keycloak.authenticated || !keycloak.token) {
      return;
    }

    const userId = keycloak.tokenParsed?.sub;
    if (!userId) {
      return;
    }

    this.isManualDisconnect = false;

    const wsProtocol = globalThis.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${new URL(env.apiGatewayUrl).host}/ws/chat`;

    this.client = new Client({
      brokerURL: wsUrl,
      
      connectHeaders: {
        Authorization: `Bearer ${keycloak.token}`,
      },
      
      debug: () => {},
      
      reconnectDelay: this.config.reconnectDelay,
      heartbeatIncoming: this.config.heartbeatIncoming,
      heartbeatOutgoing: this.config.heartbeatOutgoing,

      onConnect: () => {
        this.reconnectAttempts = 0;
        this.notifyConnectionHandlers(true);
        this.subscribeToUserChannel(userId);
        this.subscribeToPresence();
        this.startHeartbeat();
      },

      onDisconnect: () => {
        this.stopHeartbeat();
        this.notifyConnectionHandlers(false);
      },

      onStompError: () => {
        this.handleReconnect();
      },

      onWebSocketError: () => {},

      onWebSocketClose: () => {},
    });

    this.client.activate();
  }

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

  private subscribeToUserChannel(userId: string): void {
    if (!this.client?.connected) return;

    const destination = `/user/${userId}/queue/messages`;
    
    this.subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const parsed = JSON.parse(message.body) as WsOutgoingMessage;
        this.notifyMessageHandlers(parsed);
      } catch {
        // Silent fail
      }
    });
  }

  private subscribeToPresence(): void {
    if (!this.client?.connected) return;

    this.presenceSubscription = this.client.subscribe('/topic/presence', (message: IMessage) => {
      try {
        const parsed = JSON.parse(message.body) as WsOutgoingMessage;
        this.notifyMessageHandlers(parsed);
      } catch {
        // Silent fail
      }
    });
  }

  private send(message: WsIncomingMessage): void {
    if (!this.client?.connected) {
      return;
    }

    this.client.publish({
      destination: '/app/chat',
      body: JSON.stringify(message),
    });
  }

  sendMessage(chatId: string, content: string, messageType: 'TEXT' | 'IMAGE' = 'TEXT', imageId?: string): void {
    this.send({
      type: 'SEND_MESSAGE',
      chatId,
      content,
      messageType,
      imageId,
    });
  }

  sendTyping(chatId: string, isTyping: boolean): void {
    if (!this.isConnected) return;
    this.send({
      type: isTyping ? 'TYPING_START' : 'TYPING_STOP',
      chatId,
    });
  }

  markAsRead(chatId: string): void {
    this.send({ type: 'MARK_READ', chatId });
  }

  joinChat(chatId: string): void {
    if (!this.isConnected) return;
    this.send({ type: 'JOIN_CHAT', chatId });
  }

  leaveChat(chatId: string): void {
    if (!this.isConnected) return;
    this.send({ type: 'LEAVE_CHAT', chatId });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.client?.connected) {
        this.send({ type: 'HEARTBEAT' });
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  get isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  private handleReconnect(): void {
    if (this.isManualDisconnect) return;
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts ?? 10)) {
      return;
    }
    this.reconnectAttempts++;
  }

  private notifyMessageHandlers(message: WsOutgoingMessage): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch {
        // Silent fail
      }
    });
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch {
        // Silent fail
      }
    });
  }
}

export const websocketService = new WebSocketService();
export default websocketService;