"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  MessageSquare, 
  Database, 
  Zap, 
  User, 
  CheckCircle, 
  XCircle,
  Clock,
  ExternalLink,
  Filter,
  Search
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

// Mock activity data
const activities = [
  {
    id: "1",
    type: "chat",
    title: "Started new chat session",
    description: "User initiated conversation about Airtable automation",
    user: "JD",
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
    status: "success",
    metadata: { sessionId: "sess_abc123", messageCount: 12 }
  },
  {
    id: "2", 
    type: "function_call",
    title: "Executed MCP function: list_tables",
    description: "Retrieved table list from Production workspace",
    user: "JD",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    status: "success",
    metadata: { functionName: "list_tables", executionTime: 245 }
  },
  {
    id: "3",
    type: "airtable",
    title: "Synced Airtable base",
    description: "Auto-sync completed for Development Base",
    user: "System",
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    status: "success",
    metadata: { baseId: "appABC456", recordCount: 1250 }
  },
  {
    id: "4",
    type: "error",
    title: "API rate limit exceeded",
    description: "Temporary rate limiting on OpenAI API",
    user: "System",
    timestamp: new Date(Date.now() - 1000 * 60 * 23), // 23 minutes ago
    status: "error",
    metadata: { service: "OpenAI", retryAfter: 60 }
  },
  {
    id: "5",
    type: "function_call",
    title: "Executed MCP function: search_records",
    description: "Searched for customer records in CRM table",
    user: "JD",
    timestamp: new Date(Date.now() - 1000 * 60 * 35), // 35 minutes ago
    status: "success",
    metadata: { functionName: "search_records", resultsCount: 45 }
  },
  {
    id: "6",
    type: "chat",
    title: "Chat session completed",
    description: "User ended session after data analysis task",
    user: "JD",
    timestamp: new Date(Date.now() - 1000 * 60 * 48), // 48 minutes ago
    status: "success",
    metadata: { sessionId: "sess_xyz789", duration: 1800 }
  },
  {
    id: "7",
    type: "airtable",
    title: "Created new records",
    description: "Batch created 25 contact records",
    user: "JD",
    timestamp: new Date(Date.now() - 1000 * 60 * 67), // 1 hour ago
    status: "success",
    metadata: { tableId: "tblContacts", recordCount: 25 }
  },
  {
    id: "8",
    type: "function_call",
    title: "Executed MCP function: analyze_data",
    description: "Generated sales trend analysis report",
    user: "JD",
    timestamp: new Date(Date.now() - 1000 * 60 * 85), // 1.4 hours ago
    status: "success",
    metadata: { functionName: "analyze_data", chartType: "trend" }
  }
]

const getActivityIcon = (type: string) => {
  switch (type) {
    case "chat": return MessageSquare
    case "function_call": return Zap
    case "airtable": return Database
    case "error": return XCircle
    default: return Clock
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case "chat": return "text-blue-600"
    case "function_call": return "text-purple-600"
    case "airtable": return "text-green-600"
    case "error": return "text-red-600"
    default: return "text-gray-600"
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "success":
      return (
        <Badge variant="secondary" className="text-green-700 bg-green-100 dark:bg-green-900/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Success
        </Badge>
      )
    case "error":
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      )
    case "pending":
      return (
        <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      )
    default:
      return null
  }
}

export function RecentActivity() {
  return (
    <div className="space-y-6">
      {/* Activity Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Real-time activity feed from all system components
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Badge variant="secondary" className="cursor-pointer">All</Badge>
            <Badge variant="outline" className="cursor-pointer">Chat</Badge>
            <Badge variant="outline" className="cursor-pointer">Functions</Badge>
            <Badge variant="outline" className="cursor-pointer">Airtable</Badge>
            <Badge variant="outline" className="cursor-pointer">Errors</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-6 space-y-4">
              {activities.map((activity) => {
                const Icon = getActivityIcon(activity.type)
                const colorClass = getActivityColor(activity.type)
                
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full bg-background border-2 flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {activity.title}
                        </h4>
                        {getStatusBadge(activity.status)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {activity.user === "System" ? (
                            <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            </div>
                          ) : (
                            <Avatar className="w-4 h-4">
                              <AvatarFallback className="text-xs">
                                {activity.user}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span>{activity.user}</span>
                        </div>
                        
                        <span>•</span>
                        
                        <span>
                          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </span>
                        
                        {activity.metadata && (
                          <>
                            <span>•</span>
                            <span>
                              {activity.type === "function_call" && activity.metadata.executionTime && 
                                `${activity.metadata.executionTime}ms`
                              }
                              {activity.type === "airtable" && activity.metadata.recordCount &&
                                `${activity.metadata.recordCount} records`
                              }
                              {activity.type === "chat" && activity.metadata.messageCount &&
                                `${activity.metadata.messageCount} messages`
                              }
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
          <CardDescription>
            Activity breakdown for the last 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">24</div>
              <div className="text-sm text-muted-foreground">Chat Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">156</div>
              <div className="text-sm text-muted-foreground">Function Calls</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">8</div>
              <div className="text-sm text-muted-foreground">Airtable Syncs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">2</div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}