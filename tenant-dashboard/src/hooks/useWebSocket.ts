import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebSocketMessage } from '@/types';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  send: (type: string, payload: any) => void;
  subscribe: (event: string, handler: (data: any) => void) => void;
  unsubscribe: (event: string, handler?: (data: any) => void) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001',
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    try {
      socketRef.current = io(url, {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        withCredentials: true,
      });

      socketRef.current.on('connect', () => {
        setIsConnected(true);
        onConnect?.();
      });

      socketRef.current.on('disconnect', () => {
        setIsConnected(false);
        onDisconnect?.();
      });

      socketRef.current.on('connect_error', (error) => {
        onError?.(error);
      });

      socketRef.current.on('message', (message: WebSocketMessage) => {
        onMessage?.(message);
      });

      socketRef.current.connect();
    } catch (error) {
      onError?.(error as Error);
    }
  }, [url, onConnect, onDisconnect, onError, onMessage]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const send = useCallback((type: string, payload: any) => {
    if (socketRef.current?.connected) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substring(2, 15),
      };
      socketRef.current.emit('message', message);
    }
  }, []);

  const subscribe = useCallback((event: string, handler: (data: any) => void) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);

    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  const unsubscribe = useCallback((event: string, handler?: (data: any) => void) => {
    const handlers = handlersRef.current.get(event);
    if (handlers) {
      if (handler) {
        handlers.delete(handler);
        if (socketRef.current) {
          socketRef.current.off(event, handler);
        }
      } else {
        handlers.clear();
        if (socketRef.current) {
          socketRef.current.off(event);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Re-subscribe to events when socket reconnects
  useEffect(() => {
    if (socketRef.current && isConnected) {
      handlersRef.current.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          socketRef.current!.on(event, handler);
        });
      });
    }
  }, [isConnected]);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
  };
}