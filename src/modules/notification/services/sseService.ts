// src/modules/notification/services/sseService.ts

import { keycloak, TOKEN_MIN_VALIDITY } from '@/app/config/keycloak';
import { env } from '@/app/config/env';
import type { NotificationResponse, SSENotificationEvent } from '../types/notification.types';

type NotificationHandler = (notification: NotificationResponse) => void;
type ConnectionHandler = (connected: boolean) => void;
type ErrorHandler = (error: Error) => void;

interface SSEServiceConfig {
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeatTimeout?: number;
}

const DEFAULT_CONFIG: SSEServiceConfig = {
  reconnectDelay: 3000,
  maxReconnectAttempts: 10,
  heartbeatTimeout: 45000,
};

class NotificationSSEService {
  private eventSource: EventSource | null = null;
  private readonly notificationHandlers: Set<NotificationHandler> = new Set();
  private readonly connectionHandlers: Set<ConnectionHandler> = new Set();
  private readonly errorHandlers: Set<ErrorHandler> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private readonly config: SSEServiceConfig;
  private isManualDisconnect = false;

  constructor(config: SSEServiceConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Connect to SSE endpoint
   * Refreshes token if needed before connecting
   */
  async connect(): Promise<void> {
    if (this.eventSource) {
      console.debug('[SSE] Already connected');
      return;
    }

    if (!keycloak.authenticated) {
      console.debug('[SSE] Not authenticated, skipping connection');
      return;
    }

    this.isManualDisconnect = false;

    try {
      // ✅ Refresh token if needed before connecting
      const token = await this.getValidToken();
      
      if (!token) {
        console.error('[SSE] Failed to get valid token');
        return;
      }

      // ✅ Build SSE URL with encoded token
      const sseUrl = this.buildSseUrl(token);
      
      console.debug('[SSE] Connecting to:', sseUrl.toString().substring(0, 100) + '...');

      this.eventSource = new EventSource(sseUrl.toString());

      this.eventSource.onopen = () => {
        console.debug('[SSE] Connected successfully');
        this.reconnectAttempts = 0;
        this.notifyConnectionHandlers(true);
        this.startHeartbeatCheck();
      };

      // Generic message handler
      this.eventSource.onmessage = (event) => {
        this.handleMessage(event);
      };

      // Specific event listeners
      this.eventSource.addEventListener('notification', (event) => {
        this.handleNotificationEvent(event);
      });

      this.eventSource.addEventListener('heartbeat', () => {
        console.debug('[SSE] Heartbeat received');
        this.resetHeartbeatCheck();
      });

      this.eventSource.addEventListener('connected', () => {
        console.debug('[SSE] Connection confirmed by server');
        this.resetHeartbeatCheck();
      });

      this.eventSource.onerror = (event) => {
        console.error('[SSE] Connection error:', event);
        this.handleConnectionError();
      };

    } catch (error) {
      console.error('[SSE] Failed to connect:', error);
      this.handleError(error instanceof Error ? error : new Error('Connection failed'));
    }
  }

  /**
   * Disconnect from SSE
   */
  disconnect(): void {
    console.debug('[SSE] Disconnecting...');
    this.isManualDisconnect = true;
    this.cleanup();
    this.notifyConnectionHandlers(false);
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * Subscribe to notifications
   */
  onNotification(handler: NotificationHandler): () => void {
    this.notificationHandlers.add(handler);
    return () => this.notificationHandlers.delete(handler);
  }

  /**
   * Subscribe to connection changes
   */
  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  /**
   * Subscribe to errors
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  // ===== Private Methods =====

  /**
   * Get valid token, refreshing if necessary
   */
  private async getValidToken(): Promise<string | null> {
    try {
      // Check if token needs refresh
      if (keycloak.isTokenExpired(TOKEN_MIN_VALIDITY)) {
        console.debug('[SSE] Token expired or expiring soon, refreshing...');
        
        const refreshed = await keycloak.updateToken(TOKEN_MIN_VALIDITY);
        
        if (refreshed) {
          console.debug('[SSE] Token refreshed successfully');
        }
      }

      return keycloak.token || null;
    } catch (error) {
      console.error('[SSE] Failed to refresh token:', error);
      return null;
    }
  }

  /**
   * Build SSE URL with properly encoded token
   */
  private buildSseUrl(token: string): URL {
    const sseUrl = new URL('/api/v1/sse/connect', env.apiGatewayUrl);
    
    // ✅ encodeURIComponent ensures the token is properly URL-encoded
    // searchParams.set also does encoding, but we're being explicit
    sseUrl.searchParams.set('token', token);
    
    return sseUrl;
  }

  /**
   * Handle connection error - may be 401 or network issue
   */
  private async handleConnectionError(): Promise<void> {
    this.cleanup();
    this.notifyConnectionHandlers(false);

    if (this.isManualDisconnect) {
      return;
    }

    // Try to refresh token and reconnect
    if (keycloak.authenticated) {
      try {
        const refreshed = await keycloak.updateToken(-1); // Force refresh
        
        if (refreshed) {
          console.debug('[SSE] Token refreshed after error, reconnecting...');
          this.scheduleReconnect();
          return;
        }
      } catch {
        console.error('[SSE] Token refresh failed, may need to re-authenticate');
      }
    }

    this.scheduleReconnect();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as SSENotificationEvent;
      
      if (data.type === 'NOTIFICATION' && data.data) {
        this.notifyNotificationHandlers(data.data);
      }
      
      this.resetHeartbeatCheck();
    } catch (error) {
      console.error('[SSE] Failed to parse message:', error);
    }
  }

  private handleNotificationEvent(event: MessageEvent): void {
    try {
      const notification = JSON.parse(event.data) as NotificationResponse;
      console.debug('[SSE] Received notification:', notification.type);
      this.notifyNotificationHandlers(notification);
      this.resetHeartbeatCheck();
    } catch (error) {
      console.error('[SSE] Failed to parse notification:', error);
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
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts ?? 10)) {
      console.error('[SSE] Max reconnect attempts reached');
      return;
    }

    // Don't reconnect if not authenticated
    if (!keycloak.authenticated) {
      console.debug('[SSE] Not authenticated, skipping reconnect');
      return;
    }

    const delay = this.config.reconnectDelay ?? 3000;
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

  private notifyNotificationHandlers(notification: NotificationResponse): void {
    this.notificationHandlers.forEach((handler) => {
      try {
        handler(notification);
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
}

export const notificationSSEService = new NotificationSSEService();
export default notificationSSEService;