"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useChatStore } from "@/store/chat-store"
import { useChatSessions } from "@/lib/queries/chat-queries"
import { formatRelativeTime, truncateText } from "@/lib/utils"
import {
  Plus,
  Search,
  MessageSquare,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  Star,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function ChatSidebar({ isOpen, onToggle }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  const {
    currentSession,
    sessions,
    createSession,
    loadSession,
    deleteSession
  } = useChatStore()

  const { data: remoteSessions, isLoading } = useChatSessions()

  const handleNewChat = () => {
    const session = createSession()
    setSelectedSessionId(session.id)
  }

  const handleSelectSession = (sessionId: string) => {
    loadSession(sessionId)
    setSelectedSessionId(sessionId)
  }

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteSession(sessionId)
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null)
    }
  }

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.messages.some(msg => 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? 320 : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-card border-r border-border overflow-hidden",
          "lg:relative lg:z-auto"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span className="font-semibold">Chat History</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="p-1 h-8 w-8"
              >
                {isOpen ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* New Chat Button */}
            <Button
              onClick={handleNewChat}
              className="w-full justify-start"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Sessions List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              <AnimatePresence>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-16 bg-muted/50 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {searchQuery ? "No matching conversations" : "No conversations yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredSessions.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-accent group",
                            currentSession?.id === session.id && "bg-accent border-primary"
                          )}
                          onClick={() => handleSelectSession(session.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm mb-1 truncate">
                                  {session.title}
                                </h4>
                                
                                {session.messages.length > 0 && (
                                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                    {truncateText(
                                      session.messages[session.messages.length - 1]?.content || "",
                                      60
                                    )}
                                  </p>
                                )}

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatRelativeTime(session.updatedAt)}</span>
                                  
                                  {session.messageCount > 0 && (
                                    <>
                                      <span>•</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {session.messageCount} msgs
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                >
                                  <Star className="w-3 h-3" />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={(e) => handleDeleteSession(session.id, e)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              <p className="mb-1">{sessions.length} conversations</p>
              <p>Powered by PyAirtable AI</p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  )
}