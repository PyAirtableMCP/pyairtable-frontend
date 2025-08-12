import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWebSocket, WebSocketEvent, UseWebSocketReturn } from '../hooks/useWebSocket';
import { toast } from 'sonner';

interface WebSocketContextType extends UseWebSocketReturn {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastNotification, setLastNotification] = useState<string>('');

  const handleConnect = () => {
    setConnectionStatus('connected');
    if (process.env.NODE_ENV === 'development') {
      toast.success('Real-time connection established');
    }
  };

  const handleDisconnect = () => {
    setConnectionStatus('disconnected');
  };

  const handleError = () => {
    setConnectionStatus('error');
    toast.error('Real-time connection failed');
  };

  const handleMessage = (event: WebSocketEvent) => {
    // Handle global events that should show notifications
    switch (event.type) {
      case 'record:created':
        if (event.payload?.notify !== false) {
          const message = `New record created: ${event.payload?.recordId}`;
          if (message !== lastNotification) {
            toast.info(message);
            setLastNotification(message);
          }
        }
        break;
      case 'record:updated':
        if (event.payload?.notify !== false) {
          const message = `Record updated: ${event.payload?.recordId}`;
          if (message !== lastNotification) {
            toast.info(message);
            setLastNotification(message);
          }
        }
        break;
      case 'record:deleted':
        if (event.payload?.notify !== false) {
          const message = `Record deleted: ${event.payload?.recordId}`;
          if (message !== lastNotification) {
            toast.warning(message);
            setLastNotification(message);
          }
        }
        break;
      case 'user:joined':
        // Only show if it's a different user
        if (event.payload?.userId !== websocket.socket?.url?.split('userId=')[1]) {
          toast.info(`User joined: ${event.payload?.userId}`);
        }
        break;
    }
  };

  const websocket = useWebSocket({
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
    onMessage: handleMessage,
    debug: process.env.NODE_ENV === 'development'
  });

  // Update connection status based on websocket state
  useEffect(() => {
    if (websocket.isConnected) {
      setConnectionStatus('connected');
    } else if (websocket.stats.reconnectAttempts > 0) {
      setConnectionStatus('connecting');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [websocket.isConnected, websocket.stats.reconnectAttempts]);

  const contextValue: WebSocketContextType = {
    ...websocket,
    connectionStatus
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
      <ConnectionStatusIndicator connectionStatus={connectionStatus} />
    </WebSocketContext.Provider>
  );
};

// Connection status indicator component
interface ConnectionStatusIndicatorProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({ connectionStatus }) => {
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Show indicator when not connected
    setShowIndicator(connectionStatus !== 'connected');
  }, [connectionStatus]);

  if (!showIndicator) return null;

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Connection Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm ${getStatusColor()}`}>
        <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connecting' ? 'animate-pulse' : ''} bg-white`} />
        {getStatusText()}
      </div>
    </div>
  );
};