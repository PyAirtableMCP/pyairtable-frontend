'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chatStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { Send, Mic, Paperclip } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ChatInterfaceProps {
  className?: string;
  placeholder?: string;
  maxHeight?: string;
}

export function ChatInterface({ 
  className, 
  placeholder = "Ask anything about your PyAirtable data...",
  maxHeight = "600px"
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    currentSession,
    isConnected,
    isTyping,
    isLoading,
    inputValue,
    setCurrentSession,
    createSession,
    addMessage,
    updateMessage,
    updateFunctionCall,
    setIsConnected,
    setIsTyping,
    setIsLoading,
    setInputValue,
    getCurrentMessages,
  } = useChatStore();

  const messages = getCurrentMessages();

  // WebSocket connection
  const { send, subscribe, unsubscribe } = useWebSocket({
    onConnect: () => {
      setIsConnected(true);
      toast.success('Connected to chat service');
    },
    onDisconnect: () => {
      setIsConnected(false);
      toast.error('Disconnected from chat service');
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error occurred');
    },
  });

  // Handle incoming messages
  const handleIncomingMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'message_start':
        addMessage({
          type: 'ai',
          content: '',
          isStreaming: true,
        });
        break;
        
      case 'message_chunk':
        // Update the last AI message with streaming content
        const lastMessage = messages.findLast(m => m.type === 'ai' && m.isStreaming);
        if (lastMessage) {
          updateMessage(lastMessage.id, {
            content: lastMessage.content + data.content,
          });
        }
        break;
        
      case 'message_end':
        const lastStreamingMessage = messages.findLast(m => m.type === 'ai' && m.isStreaming);
        if (lastStreamingMessage) {
          updateMessage(lastStreamingMessage.id, {
            isStreaming: false,
          });
        }
        setIsTyping(false);
        setIsLoading(false);
        break;
        
      case 'function_call_start':
        const targetMessage = messages.find(m => m.id === data.messageId);
        if (targetMessage) {
          const functionCall = {
            id: data.functionCall.id,
            name: data.functionCall.name,
            arguments: data.functionCall.arguments,
            status: 'executing' as const,
            timestamp: new Date().toISOString(),
            description: data.functionCall.description,
          };
          
          updateMessage(data.messageId, {
            functionCalls: [...(targetMessage.functionCalls || []), functionCall],
          });
        }
        break;
        
      case 'function_call_end':
        updateFunctionCall(data.messageId, data.functionCallId, {
          result: data.result,
          status: data.error ? 'error' : 'completed',
        });
        break;
        
      case 'typing_start':
        setIsTyping(true);
        break;
        
      case 'typing_stop':
        setIsTyping(false);
        break;
        
      case 'error':
        toast.error(data.message || 'An error occurred');
        setIsLoading(false);
        setIsTyping(false);
        break;
    }
  }, [messages, addMessage, updateMessage, updateFunctionCall, setIsTyping, setIsLoading]);

  // Subscribe to WebSocket events
  useEffect(() => {
    subscribe('chat_message', handleIncomingMessage);
    return () => unsubscribe('chat_message', handleIncomingMessage);
  }, [subscribe, unsubscribe, handleIncomingMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !isConnected) return;

    const messageContent = inputValue.trim();
    setInputValue('');
    
    // Create session if none exists
    if (!currentSession) {
      createSession();
    }

    // Add user message
    addMessage({
      type: 'user',
      content: messageContent,
    });

    // Send to WebSocket
    setIsLoading(true);
    setIsTyping(true);
    
    send('send_message', {
      content: messageContent,
      sessionId: currentSession?.id,
    });
  }, [inputValue, isLoading, isConnected, currentSession, setInputValue, createSession, addMessage, setIsLoading, setIsTyping, send]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (currentSession) {
      setCurrentSession(null);
      toast.success('Chat cleared');
    }
  };

  return (
    <div className={cn(
      'flex flex-col bg-white border rounded-lg shadow-sm',
      className
    )} style={{ maxHeight }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-3 h-3 rounded-full',
            isConnected ? 'bg-green-500' : 'bg-red-500'
          )} />
          <h3 className="font-semibold text-gray-900">PyAirtable Assistant</h3>
          <span className="text-sm text-gray-500">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg font-medium mb-2">Welcome to PyAirtable Assistant</p>
            <p className="text-sm">Ask questions about your data, get insights, or request help with operations.</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        
        <TypingIndicator isVisible={isTyping} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="w-full min-h-[44px] max-h-32 px-3 py-2 pr-20 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!isConnected || isLoading}
              rows={1}
            />
            
            {/* Input Actions */}
            <div className="absolute right-2 bottom-2 flex gap-1">
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                disabled={!isConnected}
              >
                <Paperclip size={16} />
              </button>
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                disabled={!isConnected}
              >
                <Mic size={16} />
              </button>
            </div>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || !isConnected || isLoading}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              inputValue.trim() && isConnected && !isLoading
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400'
            )}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        
        {!isConnected && (
          <p className="text-sm text-red-500 mt-2">
            Not connected to chat service. Check your connection.
          </p>
        )}
      </div>
    </div>
  );
}