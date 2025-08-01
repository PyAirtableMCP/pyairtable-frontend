import { create } from "zustand"
import { persist } from "zustand/middleware"
import { ChatMessage, ChatSession, FunctionCall } from "@/types"

interface ChatState {
  // Current Session
  currentSession: ChatSession | null
  messages: ChatMessage[]
  isLoading: boolean
  isTyping: boolean
  
  // Sessions Management
  sessions: ChatSession[]
  
  // Function Calls
  activeFunctionCalls: FunctionCall[]
  
  // Actions
  setCurrentSession: (session: ChatSession | null) => void
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => ChatMessage
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void
  deleteMessage: (messageId: string) => void
  clearMessages: () => void
  
  // Session Actions
  createSession: (title?: string) => ChatSession
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void
  deleteSession: (sessionId: string) => void
  loadSession: (sessionId: string) => void
  
  // Function Call Actions
  addFunctionCall: (messageId: string, functionCall: Omit<FunctionCall, "id">) => void
  updateFunctionCall: (callId: string, updates: Partial<FunctionCall>) => void
  
  // UI State
  setLoading: (loading: boolean) => void
  setTyping: (typing: boolean) => void
}

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36)

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentSession: null,
      messages: [],
      isLoading: false,
      isTyping: false,
      sessions: [],
      activeFunctionCalls: [],

      // Session Management
      setCurrentSession: (session) => {
        set({ 
          currentSession: session,
          messages: session?.messages || []
        })
      },

      createSession: (title) => {
        const session: ChatSession = {
          id: generateId(),
          title: title || `Chat ${new Date().toLocaleDateString()}`,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          totalCost: 0,
          messageCount: 0
        }
        
        set((state) => ({
          sessions: [session, ...state.sessions],
          currentSession: session,
          messages: []
        }))
        
        return session
      },

      updateSession: (sessionId, updates) => {
        set((state) => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, ...updates, updatedAt: new Date() }
              : session
          ),
          currentSession: state.currentSession?.id === sessionId
            ? { ...state.currentSession, ...updates, updatedAt: new Date() }
            : state.currentSession
        }))
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter(session => session.id !== sessionId),
          currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
          messages: state.currentSession?.id === sessionId ? [] : state.messages
        }))
      },

      loadSession: (sessionId) => {
        const session = get().sessions.find(s => s.id === sessionId)
        if (session) {
          set({
            currentSession: session,
            messages: session.messages
          })
        }
      },

      // Message Management
      addMessage: (messageData) => {
        const message: ChatMessage = {
          ...messageData,
          id: generateId(),
          timestamp: new Date(),
          functionCalls: []
        }

        set((state) => {
          const newMessages = [...state.messages, message]
          const updatedSession = state.currentSession ? {
            ...state.currentSession,
            messages: newMessages,
            messageCount: newMessages.length,
            updatedAt: new Date()
          } : null

          return {
            messages: newMessages,
            currentSession: updatedSession,
            sessions: updatedSession
              ? state.sessions.map(s => s.id === updatedSession.id ? updatedSession : s)
              : state.sessions
          }
        })

        return message
      },

      updateMessage: (messageId, updates) => {
        set((state) => {
          const newMessages = state.messages.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          )
          
          const updatedSession = state.currentSession ? {
            ...state.currentSession,
            messages: newMessages,
            updatedAt: new Date()
          } : null

          return {
            messages: newMessages,
            currentSession: updatedSession,
            sessions: updatedSession
              ? state.sessions.map(s => s.id === updatedSession.id ? updatedSession : s)
              : state.sessions
          }
        })
      },

      deleteMessage: (messageId) => {
        set((state) => {
          const newMessages = state.messages.filter(msg => msg.id !== messageId)
          const updatedSession = state.currentSession ? {
            ...state.currentSession,
            messages: newMessages,
            messageCount: newMessages.length,
            updatedAt: new Date()
          } : null

          return {
            messages: newMessages,
            currentSession: updatedSession,
            sessions: updatedSession
              ? state.sessions.map(s => s.id === updatedSession.id ? updatedSession : s)
              : state.sessions
          }
        })
      },

      clearMessages: () => {
        set((state) => {
          const updatedSession = state.currentSession ? {
            ...state.currentSession,
            messages: [],
            messageCount: 0,
            updatedAt: new Date()
          } : null

          return {
            messages: [],
            currentSession: updatedSession,
            sessions: updatedSession
              ? state.sessions.map(s => s.id === updatedSession.id ? updatedSession : s)
              : state.sessions
          }
        })
      },

      // Function Call Management
      addFunctionCall: (messageId, functionCallData) => {
        const functionCall: FunctionCall = {
          ...functionCallData,
          id: generateId()
        }

        set((state) => ({
          activeFunctionCalls: [...state.activeFunctionCalls, functionCall],
          messages: state.messages.map(msg =>
            msg.id === messageId
              ? { ...msg, functionCalls: [...(msg.functionCalls || []), functionCall] }
              : msg
          )
        }))
      },

      updateFunctionCall: (callId, updates) => {
        set((state) => ({
          activeFunctionCalls: state.activeFunctionCalls.map(call =>
            call.id === callId ? { ...call, ...updates } : call
          ),
          messages: state.messages.map(msg => ({
            ...msg,
            functionCalls: msg.functionCalls?.map(call =>
              call.id === callId ? { ...call, ...updates } : call
            )
          }))
        }))
      },

      // UI State
      setLoading: (loading) => set({ isLoading: loading }),
      setTyping: (typing) => set({ isTyping: typing }),
    }),
    {
      name: "chat-store",
      partialize: (state) => ({
        sessions: state.sessions,
        currentSession: state.currentSession
      })
    }
  )
)