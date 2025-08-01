"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChatMessage as ChatMessageType } from "@/types"
import { formatRelativeTime, formatCurrency } from "@/lib/utils"
import { MarkdownRenderer } from "@/components/chat/markdown-renderer"
import { FunctionCallCard } from "@/components/chat/function-call-card"
import { 
  User, 
  Bot, 
  Copy, 
  ThumbsUp, 
  ThumbsDown,
  MoreHorizontal,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: ChatMessageType
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-4 group",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <Avatar className={cn(
        "w-8 h-8 mt-1",
        isUser ? "bg-primary" : "bg-gradient-to-br from-blue-500 to-purple-600"
      )}>
        <AvatarFallback className="text-white">
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn(
        "flex-1 max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Message Header */}
        <div className={cn(
          "flex items-center gap-2 mb-2 text-xs text-muted-foreground",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="font-medium">
            {isUser ? "You" : "AI Assistant"}
          </span>
          <span>•</span>
          <time>{formatRelativeTime(message.timestamp)}</time>
          
          {message.metadata?.cost && (
            <>
              <span>•</span>
              <Badge variant="secondary" className="text-xs">
                {formatCurrency(message.metadata.cost)}
              </Badge>
            </>
          )}
        </div>

        {/* Message Bubble */}
        <Card className={cn(
          "relative",
          isUser 
            ? "bg-primary text-primary-foreground ml-auto" 
            : "bg-card"
        )}>
          <CardContent className="p-4 pb-2">
            <MarkdownRenderer content={message.content} />
            
            {/* Metadata */}
            {message.metadata && (
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50 text-xs opacity-70">
                {message.metadata.model && (
                  <Badge variant="outline" className="text-xs">
                    {message.metadata.model}
                  </Badge>
                )}
                {message.metadata.tokenCount && (
                  <span>{message.metadata.tokenCount} tokens</span>
                )}
              </div>
            )}
          </CardContent>

          {/* Message Actions */}
          <div className={cn(
            "flex items-center gap-1 px-4 pb-3 opacity-0 group-hover:opacity-100 transition-opacity",
            isUser ? "justify-start" : "justify-end"
          )}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyMessage}
              className="h-6 px-2 text-xs"
            >
              <Copy className="w-3 h-3" />
            </Button>
            
            {isAssistant && (
              <>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <ThumbsUp className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <ThumbsDown className="w-3 h-3" />
                </Button>
              </>
            )}
            
            <Button variant="ghost" size="sm" className="h-6 px-2">
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </div>
        </Card>

        {/* Function Calls */}
        {message.functionCalls && message.functionCalls.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4" />
              <span>Function Calls ({message.functionCalls.length})</span>
            </div>
            {message.functionCalls.map((call) => (
              <FunctionCallCard key={call.id} functionCall={call} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
})