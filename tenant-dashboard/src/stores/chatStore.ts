import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  functionCalls?: FunctionCall[];
  metadata?: Record<string, any>;
}

export interface FunctionCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  status: 'pending' | 'executing' | 'completed' | 'error';
  timestamp: string;
  description?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface ChatState {
  // Current session
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  
  // UI state
  isConnected: boolean;
  isTyping: boolean;
  isLoading: boolean;
  
  // Input state
  inputValue: string;
  
  // Actions
  setCurrentSession: (session: ChatSession | null) => void;
  createSession: () => ChatSession;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  updateFunctionCall: (messageId: string, functionCallId: string, updates: Partial<FunctionCall>) => void;
  setIsConnected: (connected: boolean) => void;
  setIsTyping: (typing: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setInputValue: (value: string) => void;
  clearCurrentSession: () => void;
  deleteSession: (sessionId: string) => void;
  
  // Utilities
  getCurrentMessages: () => ChatMessage[];
  getLastUserMessage: () => ChatMessage | null;
  getLastAiMessage: () => ChatMessage | null;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useChatStore = create<ChatState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentSession: null,
    sessions: [],
    isConnected: false,
    isTyping: false,
    isLoading: false,
    inputValue: '',

    // Actions
    setCurrentSession: (session) => {
      set({ currentSession: session });
    },

    createSession: () => {
      const newSession: ChatSession = {
        id: generateId(),
        title: 'New Chat',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      set((state) => ({
        sessions: [newSession, ...state.sessions],
        currentSession: newSession,
      }));

      return newSession;
    },

    addMessage: (messageData) => {
      const message: ChatMessage = {
        ...messageData,
        id: generateId(),
        timestamp: new Date().toISOString(),
      };

      set((state) => {
        if (!state.currentSession) {
          // Create a new session if none exists
          const newSession = get().createSession();
          return {
            currentSession: {
              ...newSession,
              messages: [message],
              title: messageData.type === 'user' 
                ? message.content.slice(0, 50) + '...' 
                : newSession.title,
              updatedAt: new Date().toISOString(),
            },
          };
        }

        const updatedSession = {
          ...state.currentSession,
          messages: [...state.currentSession.messages, message],
          updatedAt: new Date().toISOString(),
          title: state.currentSession.messages.length === 0 && messageData.type === 'user'
            ? message.content.slice(0, 50) + '...'
            : state.currentSession.title,
        };

        return {
          currentSession: updatedSession,
          sessions: state.sessions.map((session) =>
            session.id === updatedSession.id ? updatedSession : session
          ),
        };
      });
    },

    updateMessage: (messageId, updates) => {
      set((state) => {
        if (!state.currentSession) return state;

        const updatedMessages = state.currentSession.messages.map((message) =>
          message.id === messageId ? { ...message, ...updates } : message
        );

        const updatedSession = {
          ...state.currentSession,
          messages: updatedMessages,
          updatedAt: new Date().toISOString(),
        };

        return {
          currentSession: updatedSession,
          sessions: state.sessions.map((session) =>
            session.id === updatedSession.id ? updatedSession : session
          ),
        };
      });
    },

    updateFunctionCall: (messageId, functionCallId, updates) => {
      set((state) => {
        if (!state.currentSession) return state;

        const updatedMessages = state.currentSession.messages.map((message) => {
          if (message.id !== messageId) return message;
          
          const updatedFunctionCalls = message.functionCalls?.map((fc) =>
            fc.id === functionCallId ? { ...fc, ...updates } : fc
          ) || [];

          return {
            ...message,
            functionCalls: updatedFunctionCalls,
          };
        });

        const updatedSession = {
          ...state.currentSession,
          messages: updatedMessages,
          updatedAt: new Date().toISOString(),
        };

        return {
          currentSession: updatedSession,
          sessions: state.sessions.map((session) =>
            session.id === updatedSession.id ? updatedSession : session
          ),
        };
      });
    },

    setIsConnected: (connected) => set({ isConnected: connected }),
    setIsTyping: (typing) => set({ isTyping: typing }),
    setIsLoading: (loading) => set({ isLoading: loading }),
    setInputValue: (value) => set({ inputValue: value }),

    clearCurrentSession: () => {
      set({ currentSession: null });
    },

    deleteSession: (sessionId) => {
      set((state) => ({
        sessions: state.sessions.filter((session) => session.id !== sessionId),
        currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
      }));
    },

    // Utilities
    getCurrentMessages: () => {
      return get().currentSession?.messages || [];
    },

    getLastUserMessage: () => {
      const messages = get().getCurrentMessages();
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].type === 'user') {
          return messages[i];
        }
      }
      return null;
    },

    getLastAiMessage: () => {
      const messages = get().getCurrentMessages();
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].type === 'ai') {
          return messages[i];
        }
      }
      return null;
    },
  }))
);