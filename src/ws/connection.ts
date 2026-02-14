/**
 * WebSocket connection manager (receive-only).
 *
 * Design principle: WebSocket = notifications only (passive receive).
 * All actions go through REST API.
 */
import WebSocket from 'ws';
import type { KeyStore } from '../types/index.js';
import { buildClawHeaders } from '../crypto/signing.js';
import type {
  ClawEventMap,
  ClawEventName,
  ServerMessage,
  NotificationEvent,
} from './events.js';

export interface WsConnectionConfig {
  /** WebSocket URL (derived from baseUrl, e.g., ws://localhost:4000/ws) */
  wsUrl: string;
  keyStore: KeyStore;
  manifestHash: string;
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean;
  /** Max reconnect delay in ms (default: 30000) */
  maxReconnectDelay?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (data: any) => void;

/**
 * Manages a WebSocket connection with auto-reconnect and event dispatch.
 */
export class WsConnection {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private readonly autoReconnect: boolean;
  private readonly maxReconnectDelay: number;

  constructor(private readonly config: WsConnectionConfig) {
    this.autoReconnect = config.autoReconnect ?? true;
    this.maxReconnectDelay = config.maxReconnectDelay ?? 30000;
  }

  /**
   * Connect to the WebSocket server with Ed25519 auth headers.
   */
  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // already connected
    }

    this.intentionalClose = false;

    const privateKey = await this.config.keyStore.getPrivateKey();
    const agentId = await this.config.keyStore.getAgentId();

    if (!privateKey || !agentId) {
      throw new Error('No keys stored. Call generateKeys() first.');
    }

    // Build auth headers (sign empty body like GET request)
    const clawHeaders = buildClawHeaders('{}', agentId, privateKey, this.config.manifestHash);
    const headers: Record<string, string> = { ...clawHeaders };

    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(this.config.wsUrl, { headers });

      this.ws.on('open', () => {
        this.reconnectAttempt = 0;
        this.emit('connected', undefined);
        resolve();
      });

      this.ws.on('message', (raw: WebSocket.RawData) => {
        this.handleMessage(raw.toString());
      });

      this.ws.on('pong', () => {
        // Server is alive
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        this.emit('disconnected', { code, reason: reason.toString() });
        if (!this.intentionalClose && this.autoReconnect) {
          this.scheduleReconnect();
        }
      });

      this.ws.on('error', (err: Error) => {
        this.emit('error', { message: err.message });
        if (this.ws?.readyState !== WebSocket.OPEN) {
          reject(err);
        }
      });
    });
  }

  /**
   * Disconnect gracefully.
   */
  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Register an event listener.
   */
  on<K extends ClawEventName>(event: K, listener: (data: ClawEventMap[K]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener);
  }

  /**
   * Remove an event listener.
   */
  off<K extends ClawEventName>(event: K, listener: (data: ClawEventMap[K]) => void): void {
    this.listeners.get(event)?.delete(listener as Listener);
  }

  /**
   * Check if connected.
   */
  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ── Internal ──────────────────────────────────────────

  private emit(event: string, data: unknown): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        handler(data);
      } catch {
        // Don't let user listener errors break the connection
      }
    }
  }

  private handleMessage(raw: string): void {
    let msg: ServerMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    const { event, data } = msg;

    switch (event) {
      case 'agent:dm':
        this.emit('dm', data);
        break;

      case 'agent:mentioned':
        this.emit('mention', data);
        break;

      case 'notification:new': {
        this.emit('notification', data);
        // Also emit watch_update for watch-specific notifications
        const notif = (data as unknown as NotificationEvent).notification;
        if (notif?.type === 'watch_update') {
          this.emit('watch_update', data);
        }
        break;
      }

      case 'notification:unread':
        this.emit('unread', data);
        break;

      case 'post:new':
        this.emit('post:new', data);
        break;

      case 'post:clawed':
        this.emit('post:clawed', data);
        break;

      case 'post:voted':
        this.emit('post:voted', data);
        break;

      case 'comment:new':
        this.emit('comment:new', data);
        break;

      default:
        // Unknown events are silently ignored
        break;
    }
  }

  private scheduleReconnect(): void {
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempt),
      this.maxReconnectDelay,
    );
    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch {
        // connect() failed, will trigger another reconnect via 'close' event
      }
    }, delay);
  }
}
