import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { llmClient } from "@/lib/api-client"
import { ChatMessage, ChatSession } from "@/types"
import { useChatStore } from "@/store/chat-store"

// Query Keys
export const chatKeys = {
  all: ["chat"] as const,
  sessions: () => [...chatKeys.all, "sessions"] as const,
  session: (id: string) => [...chatKeys.all, "session", id] as const,
  messages: (sessionId: string) => [...chatKeys.all, "messages", sessionId] as const,
}

// Chat Message Hook
export function useSendMessage() {
  const queryClient = useQueryClient()
  const { addMessage, updateMessage, setLoading, setTyping } = useChatStore()

  return useMutation({
    mutationFn: async ({ message, sessionId }: { message: string; sessionId: string }) => {
      // Add user message immediately
      const userMessage = addMessage({
        role: "user" as const,
        content: message,
      })

      setLoading(true)
      setTyping(true)

      try {
        const response = await llmClient.post("/chat", {
          message,
          sessionId,
        })

        if (!response.success) {
          throw new Error(response.error || "Failed to send message")
        }

        return response.data
      } catch (error) {
        // Remove user message on error
        useChatStore.getState().deleteMessage(userMessage.id)
        throw error
      }
    },
    onSuccess: (data: any) => {
      // Add assistant response
      if (data?.message) {
        addMessage({
          role: "assistant" as const,
          content: data?.message,
          functionCalls: data?.functionCalls || [],
          metadata: data?.metadata,
        })
      }
      
      setLoading(false)
      setTyping(false)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions() })
    },
    onError: (error) => {
      console.error("Failed to send message:", error)
      setLoading(false)
      setTyping(false)
    },
  })
}

// Get Chat Sessions
export function useChatSessions() {
  return useQuery({
    queryKey: chatKeys.sessions(),
    queryFn: async () => {
      const response = await llmClient.get("/sessions")
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch sessions")
      }
      return response.data as ChatSession[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get Chat History
export function useChatHistory(sessionId: string) {
  return useQuery({
    queryKey: chatKeys.messages(sessionId),
    queryFn: async () => {
      const response = await llmClient.get(`/sessions/${sessionId}/messages`)
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch chat history")
      }
      return response.data as ChatMessage[]
    },
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Create New Session
export function useCreateSession() {
  const queryClient = useQueryClient()
  const { createSession } = useChatStore()

  return useMutation({
    mutationFn: async (title?: string) => {
      const response = await llmClient.post("/sessions", { title })
      if (!response.success) {
        throw new Error(response.error || "Failed to create session")
      }
      return response.data as ChatSession
    },
    onSuccess: (session) => {
      // Update local store
      createSession(session.title)
      
      // Invalidate sessions query
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions() })
    },
  })
}

// Delete Session
export function useDeleteSession() {
  const queryClient = useQueryClient()
  const { deleteSession } = useChatStore()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await llmClient.delete(`/sessions/${sessionId}`)
      if (!response.success) {
        throw new Error(response.error || "Failed to delete session")
      }
      return sessionId
    },
    onSuccess: (sessionId) => {
      // Update local store
      deleteSession(sessionId)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions() })
      queryClient.removeQueries({ queryKey: chatKeys.session(sessionId) })
      queryClient.removeQueries({ queryKey: chatKeys.messages(sessionId) })
    },
  })
}

// Update Session
export function useUpdateSession() {
  const queryClient = useQueryClient()
  const { updateSession } = useChatStore()

  return useMutation({
    mutationFn: async ({ 
      sessionId, 
      updates 
    }: { 
      sessionId: string; 
      updates: Partial<ChatSession> 
    }) => {
      const response = await llmClient.patch(`/sessions/${sessionId}`, updates)
      if (!response.success) {
        throw new Error(response.error || "Failed to update session")
      }
      return response.data as ChatSession
    },
    onSuccess: (session) => {
      // Update local store
      updateSession(session.id, session)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions() })
      queryClient.invalidateQueries({ queryKey: chatKeys.session(session.id) })
    },
  })
}