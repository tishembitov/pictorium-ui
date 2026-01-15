// src/modules/notification/services/sseService.ts

import { keycloak, TOKEN_MIN_VALIDITY } from '@/app/config/keycloak';
import { env } from '@/app/config/env';
import type { NotificationResponse, SSEEventType } from '../types/notification.types';

/**
 * Handler получает notification и флаг isUpdate
 * isUpdate=true означает что это обновление существующего уведомления (агрегация)
 */
type NotificationHandler = (notification: NotificationResponse, isUpdate: boolean) => void;
type ConnectionHandler = (connected: boolean) => void;
type ErrorHandler = (error: Error) => void;
type UnreadUpdateHandler = (count: number) => void;

interface SSEServiceConfig {
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeatTimeout?: number;
}

const DEFAULT_CONFIG: SSEServiceConfig = {
  reconnectDelay: 5000,
  maxReconnectAttempts: 10,
  heartbeatTimeout: 60000,
};

interface SSEEventData {
  type: SSEEventType;
  data?: NotificationResponse | { count?: number } | Record<string, unknown>;
  timestamp: string;
}

class NotificationSSEService {
  private eventSource: EventSource | null = null;
  private readonly notificationHandlers: Set<NotificationHandler> = new Set();
  private readonly connectionHandlers: Set<ConnectionHandler> = new Set();
  private readonly errorHandlers: Set<ErrorHandler> = new Set();
  private readonly unreadUpdateHandlers: Set<UnreadUpdateHandler> = new Set();
  
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly config: SSEServiceConfig;
  private isManualDisconnect = false;
  private isConnecting = false;

  constructor(config: SSEServiceConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async connect(): Promise<void> {
    if (this.eventSource?.readyState === EventSource.OPEN) {
      console.debug('[SSE] Already connected');
      return;
    }

    if (this.isConnecting) {
      console.debug('[SSE] Connection already in progress');
      return;
    }

    if (!keycloak.authenticated) {
      console.debug('[SSE] Not authenticated, skipping connection');
      return;
    }

    this.isManualDisconnect = false;
    this.isConnecting = true;

    try {
      const token = await this.getValidToken();

      if (!token) {
        console.error('[SSE] Failed to get valid token');
        this.isConnecting = false;
        return;
      }

      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      const sseUrl = this.buildSseUrl(token);
      console.debug('[SSE] Connecting...');

      this.eventSource = new EventSource(sseUrl.toString());

      this.eventSource.onopen = () => {
        console.debug('[SSE] ✅ Connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnectionHandlers(true);
        this.startHeartbeatCheck();
      };

      // Generic message handler
      this.eventSource.onmessage = (event) => {
        this.handleMessage(event);
      };

      // Новое уведомление
      this.eventSource.addEventListener('notification', (event) => {
        this.handleNotificationEvent(event, false);
      });

      // Обновление существующего уведомления (агрегация)
      this.eventSource.addEventListener('notification_updated', (event) => {
        this.handleNotificationEvent(event, true);
      });

      // Heartbeat
      this.eventSource.addEventListener('heartbeat', () => {
        console.debug('[SSE] Heartbeat received');
        this.resetHeartbeatCheck();
      });

      // Connected confirmation
      this.eventSource.addEventListener('connected', () => {
        console.debug('[SSE] Connection confirmed by server');
        this.resetHeartbeatCheck();
      });

      // Unread count update
      this.eventSource.addEventListener('unread_update', (event) => {
        this.handleUnreadUpdate(event);
        this.resetHeartbeatCheck();
      });

      this.eventSource.onerror = () => {
        console.error('[SSE] Connection error');
        this.isConnecting = false;
        this.handleConnectionError();
      };
    } catch (error) {
      console.error('[SSE] Failed to connect:', error);
      this.isConnecting = false;
      this.handleError(error instanceof Error ? error : new Error('Connection failed'));
    }
  }

  disconnect(): void {
    console.debug('[SSE] Disconnecting...');
    this.isManualDisconnect = true;
    this.isConnecting = false;
    this.cleanup();
    this.notifyConnectionHandlers(false);
  }

  get isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  // ===== Subscription Methods =====

  onNotification(handler: NotificationHandler): () => void {
    this.notificationHandlers.add(handler);
    return () => this.notificationHandlers.delete(handler);
  }

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  onUnreadUpdate(handler: UnreadUpdateHandler): () => void {
    this.unreadUpdateHandlers.add(handler);
    return () => this.unreadUpdateHandlers.delete(handler);
  }

  // ===== Private Methods =====

  private async getValidToken(): Promise<string | null> {
    try {
      if (keycloak.isTokenExpired(TOKEN_MIN_VALIDITY)) {
        console.debug('[SSE] Token expired, refreshing...');
        await keycloak.updateToken(TOKEN_MIN_VALIDITY);
      }
      return keycloak.token || null;
    } catch (error) {
      console.error('[SSE] Failed to refresh token:', error);
      return null;
    }
  }

  private buildSseUrl(token: string): URL {
    const sseUrl = new URL('/api/v1/sse/connect', env.apiGatewayUrl);
    sseUrl.searchParams.set('token', token);
    return sseUrl;
  }

  private handleConnectionError(): void {
    this.cleanup();
    this.notifyConnectionHandlers(false);

    if (this.isManualDisconnect) {
      return;
    }

    this.scheduleReconnect();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as SSEEventData;

      switch (data.type) {
        case 'notification':
          if (data.data) {
            this.notifyNotificationHandlers(data.data as NotificationResponse, false);
          }
          break;
        case 'notification_updated':
          if (data.data) {
            this.notifyNotificationHandlers(data.data as NotificationResponse, true);
          }
          break;
        case 'unread_update':
          if (data.data && typeof (data.data as { count?: number }).count === 'number') {
            this.notifyUnreadUpdateHandlers((data.data as { count: number }).count);
          }
          break;
      }

      this.resetHeartbeatCheck();
    } catch (error) {
      console.error('[SSE] Failed to parse message:', error);
    }
  }

  private handleNotificationEvent(event: MessageEvent, isUpdate: boolean): void {
    try {
      const eventData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      const notification = eventData.data || eventData;

      console.debug('[SSE] Received %s:', isUpdate ? 'notification_updated' : 'notification', {
        id: notification.id,
        type: notification.type,
        aggregatedCount: notification.aggregatedCount,
        uniqueActorCount: notification.uniqueActorCount,
      });

      this.notifyNotificationHandlers(notification as NotificationResponse, isUpdate);
      this.resetHeartbeatCheck();
    } catch (error) {
      console.error('[SSE] Failed to parse notification event:', error, event.data);
    }
  }

  private handleUnreadUpdate(event: MessageEvent): void {
    try {
      const eventData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      const data = eventData.data || eventData;
      
      if (typeof data.count === 'number') {
        console.debug('[SSE] Unread count update:', data.count);
        this.notifyUnreadUpdateHandlers(data.count);
      }
    } catch (error) {
      console.error('[SSE] Failed to parse unread update:', error);
    }
  }

  private handleError(error: Error): void {
    this.cleanup();
    this.notifyConnectionHandlers(false);
    this.notifyErrorHandlers(error);

    if (!this.isManualDisconnect) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts ?? 10)) {
      console.error('[SSE] Max reconnect attempts reached');
      return;
    }

    if (!keycloak.authenticated) {
      console.debug('[SSE] Not authenticated, skipping reconnect');
      return;
    }

    const delay = this.config.reconnectDelay ?? 5000;
    const backoffDelay = Math.min(delay * Math.pow(1.5, this.reconnectAttempts), 30000);

    console.debug(`[SSE] Reconnecting in ${backoffDelay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, backoffDelay);
  }

  private startHeartbeatCheck(): void {
    this.resetHeartbeatCheck();
  }

  private resetHeartbeatCheck(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }

    this.heartbeatTimeout = setTimeout(() => {
      console.warn('[SSE] Heartbeat timeout, reconnecting...');
      this.handleConnectionError();
    }, this.config.heartbeatTimeout);
  }

  private cleanup(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  // ===== Notification Methods =====

  private notifyNotificationHandlers(notification: NotificationResponse, isUpdate: boolean): void {
    this.notificationHandlers.forEach((handler) => {
      try {
        handler(notification, isUpdate);
      } catch (error) {
        console.error('[SSE] Notification handler error:', error);
      }
    });
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch (error) {
        console.error('[SSE] Connection handler error:', error);
      }
    });
  }

  private notifyErrorHandlers(error: Error): void {
    this.errorHandlers.forEach((handler) => {
      try {
        handler(error);
      } catch (err) {
        console.error('[SSE] Error handler error:', err);
      }
    });
  }

  private notifyUnreadUpdateHandlers(count: number): void {
    this.unreadUpdateHandlers.forEach((handler) => {
      try {
        handler(count);
      } catch (error) {
        console.error('[SSE] Unread update handler error:', error);
      }
    });
  }
}

export const notificationSSEService = new NotificationSSEService();
export default notificationSSEService;