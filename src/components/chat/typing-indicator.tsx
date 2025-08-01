"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Bot } from "lucide-react"

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex gap-4"
    >
      {/* Avatar */}
      <Avatar className="w-8 h-8 mt-1 bg-gradient-to-br from-blue-500 to-purple-600">
        <AvatarFallback className="text-white">
          <Bot className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>

      {/* Typing Animation */}
      <div className="flex-1">
        <div className="text-xs text-muted-foreground mb-2">
          AI Assistant is typing...
        </div>
        
        <Card className="bg-card max-w-[200px]">
          <CardContent className="p-4">
            <div className="flex items-center gap-1">
              <div className="flex space-x-1">
                <motion.div
                  className="w-2 h-2 bg-muted-foreground rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0,
                  }}
                />
                <motion.div
                  className="w-2 h-2 bg-muted-foreground rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0.2,
                  }}
                />
                <motion.div
                  className="w-2 h-2 bg-muted-foreground rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0.4,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}