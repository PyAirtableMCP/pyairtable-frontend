import { useEffect, useRef, useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';

export interface WebSocketEvent {
  type: string;
  payload?: any;
  timestamp: number;
}

export interface WebSocketStats {
  connected: boolean;
  reconnectAttempts: number;
  lastConnected: Date | null;
  messagesReceived: number;
  messagesSent: number;
}

export interface UseWebSocketOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (event: WebSocketEvent) => void;
  debug?: boolean;
}

export interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  stats: WebSocketStats;
  sendMessage: (type: string, payload?: any) => void;
  joinTable: (tableId: string) => void;
  leaveTable: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

const DEFAULT_WS_URL = process.env.NODE_ENV === 'production' 
  ? 'wss://your-domain.com/ws' 
  : 'ws://localhost:8081/ws';

const DEFAULT_RECONNECT_INTERVAL = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 10;

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    url = DEFAULT_WS_URL,
    reconnectInterval = DEFAULT_RECONNECT_INTERVAL,
    maxReconnectAttempts = MAX_RECONNECT_ATTEMPTS,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
    debug = false
  } = options;

  const { data: session } = useSession();
  const user = session?.user;
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const isManualDisconnect = useRef(false);
  const currentTableId = useRef<string | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<WebSocketStats>({
    connected: false,
    reconnectAttempts: 0,
    lastConnected: null,
    messagesReceived: 0,
    messagesSent: 0,
  });

  const log = useCallback((message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[WebSocket] ${message}`, ...args);
    }
  }, [debug]);

  const updateStats = useCallback((update: Partial<WebSocketStats>) => {
    setStats(prev => ({ ...prev, ...update }));
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      log('Already connected');
      return;
    }

    if (!user?.id) {
      log('No authenticated user, skipping connection');
      return;
    }

    try {
      const wsUrl = `${url}?userId=${user.id}`;
      log('Connecting to WebSocket', wsUrl);
      
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        isManualDisconnect.current = false;
        
        updateStats({
          connected: true,
          reconnectAttempts: 0,
          lastConnected: new Date(),
        });

        onConnect?.();
      };

      socket.onclose = (event) => {
        log('WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        updateStats({ connected: false });
        
        onDisconnect?.();

        // Attempt reconnection if not manually disconnected
        if (!isManualDisconnect.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          updateStats({ reconnectAttempts: reconnectAttemptsRef.current });
          
          log(`Reconnecting in ${reconnectInterval}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          log('Max reconnection attempts reached');
        }
      };

      socket.onerror = (error) => {
        log('WebSocket error', error);
        onError?.(error);
      };

      socket.onmessage = (event) => {
        try {
          const data: WebSocketEvent = JSON.parse(event.data);
          log('Message received', data);
          
          updateStats(prev => ({
            ...prev,
            messagesReceived: prev.messagesReceived + 1
          }));

          handleIncomingMessage(data);
          onMessage?.(data);
        } catch (err) {
          log('Failed to parse message', event.data, err);
        }
      };

    } catch (error) {
      log('Failed to create WebSocket connection', error);
    }
  }, [url, user, onConnect, onDisconnect, onError, onMessage, reconnectInterval, maxReconnectAttempts, log, updateStats]);

  const handleIncomingMessage = useCallback((event: WebSocketEvent) => {
    switch (event.type) {
      case 'pong':
        log('Received pong');
        break;
      case 'presence_update':
        log('Presence update received', event.payload);
        break;
      case 'record:created':
      case 'record:updated':
      case 'record:deleted':
        log('Record event received', event.type, event.payload);
        break;
      case 'user:joined':
      case 'user:left':
        log('User presence event', event.type, event.payload);
        break;
      default:
        log('Unknown event type', event.type);
    }
  }, [log]);

  const sendMessage = useCallback((type: string, payload?: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        payload: payload || {},
        timestamp: Date.now()
      };
      
      socketRef.current.send(JSON.stringify(message));
      log('Message sent', message);
      
      updateStats(prev => ({
        ...prev,
        messagesSent: prev.messagesSent + 1
      }));
    } else {
      log('Cannot send message: WebSocket not connected');
    }
  }, [log, updateStats]);

  const joinTable = useCallback((tableId: string) => {
    currentTableId.current = tableId;
    sendMessage('join_table', { tableId });
    log('Joined table', tableId);
  }, [sendMessage, log]);

  const leaveTable = useCallback(() => {
    if (currentTableId.current) {
      sendMessage('leave_table', { tableId: currentTableId.current });
      log('Left table', currentTableId.current);
      currentTableId.current = null;
    }
  }, [sendMessage, log]);

  const disconnect = useCallback(() => {
    isManualDisconnect.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    if (socketRef.current) {
      socketRef.current.close(1000, 'Manual disconnect');
      socketRef.current = null;
    }
    
    setIsConnected(false);
    log('Manually disconnected');
  }, [log]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(connect, 100);
  }, [disconnect, connect]);

  // Ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendMessage('ping');
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected, sendMessage]);

  // Auto-connect when user is available
  useEffect(() => {
    if (user?.id && !isConnected && !isManualDisconnect.current) {
      connect();
    }
  }, [user?.id, isConnected, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        isManualDisconnect.current = true;
        socketRef.current.close();
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    stats,
    sendMessage,
    joinTable,
    leaveTable,
    disconnect,
    reconnect,
  };
};

// Hook for managing real-time events
export const useRealtimeEvents = (tableId?: string) => {
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [userPresence, setUserPresence] = useState<string[]>([]);

  const handleMessage = useCallback((event: WebSocketEvent) => {
    setEvents(prev => [...prev.slice(-99), event]); // Keep last 100 events

    switch (event.type) {
      case 'presence_update':
        setUserPresence(event.payload?.users || []);
        break;
      case 'user:joined':
        setUserPresence(prev => {
          const userId = event.payload?.userId;
          return userId && !prev.includes(userId) ? [...prev, userId] : prev;
        });
        break;
      case 'user:left':
        setUserPresence(prev => {
          const userId = event.payload?.userId;
          return prev.filter(id => id !== userId);
        });
        break;
    }
  }, []);

  const websocket = useWebSocket({
    onMessage: handleMessage,
    debug: process.env.NODE_ENV === 'development'
  });

  // Join table when tableId changes
  useEffect(() => {
    if (tableId && websocket.isConnected) {
      websocket.joinTable(tableId);
      return () => websocket.leaveTable();
    }
  }, [tableId, websocket.isConnected, websocket.joinTable, websocket.leaveTable]);

  return {
    ...websocket,
    events,
    userPresence,
    clearEvents: () => setEvents([]),
  };
};