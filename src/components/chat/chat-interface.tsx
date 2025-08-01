"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChatMessage } from "@/components/chat/chat-message"
import { ChatInput } from "@/components/chat/chat-input"
import { FunctionCallVisualization } from "@/components/chat/function-call-visualization"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import { useChatStore } from "@/store/chat-store"
import { useSendMessage } from "@/lib/queries/chat-queries"
import { useToast } from "@/hooks/use-toast"
import { 
  MessageSquare, 
  Sparkles, 
  Zap, 
  RefreshCcw,
  Settings 
} from "lucide-react"

export function ChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  
  const {
    currentSession,
    messages,
    isLoading,
    isTyping,
    activeFunctionCalls,
    createSession
  } = useChatStore()

  const sendMessageMutation = useSendMessage()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Create initial session if none exists
  useEffect(() => {
    if (!currentSession) {
      createSession("New Chat")
    }
  }, [currentSession, createSession])

  const handleSendMessage = async (content: string) => {
    if (!currentSession) {
      toast({
        title: "No Active Session",
        description: "Please create a new chat session first.",
        variant: "destructive",
      })
      return
    }

    try {
      await sendMessageMutation.mutateAsync({
        message: content,
        sessionId: currentSession.id,
      })
    } catch (error) {
      toast({
        title: "Failed to Send Message",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const handleNewChat = () => {
    createSession()
    toast({
      title: "New Chat Created",
      description: "Ready for your questions!",
    })
  }

  if (!currentSession) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Active Chat</h3>
          <p className="text-muted-foreground mb-4">
            Start a new conversation with the AI assistant.
          </p>
          <Button onClick={handleNewChat}>
            <Sparkles className="w-4 h-4 mr-2" />
            Start New Chat
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">{currentSession.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  14 MCP Tools
                </Badge>
                <span>•</span>
                <span>{messages.length} messages</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {activeFunctionCalls.length > 0 && (
              <Badge variant="outline" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                {activeFunctionCalls.length} active
              </Badge>
            )}
            
            <Button variant="ghost" size="sm" onClick={handleNewChat}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Welcome to PyAirtable AI</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                I&apos;m your AI assistant with access to 14 powerful MCP tools for Airtable automation. 
                Ask me anything about your data, and I&apos;ll help you accomplish it.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {[
                  "Show me all my Airtable bases",
                  "Analyze my sales data trends",
                  "Create a new customer record", 
                  "Export data to CSV format"
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    onClick={() => handleSendMessage(suggestion)}
                    className="text-left justify-start h-auto p-3"
                    disabled={isLoading}
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-primary" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
        </AnimatePresence>

        {/* Function Call Visualizations */}
        {activeFunctionCalls.map((call) => (
          <FunctionCallVisualization key={call.id} functionCall={call} />
        ))}

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="border-t bg-card/50 backdrop-blur-sm">
        <div className="p-4">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            placeholder="Ask me anything about your Airtable data..."
          />
        </div>
      </div>
    </div>
  )
}