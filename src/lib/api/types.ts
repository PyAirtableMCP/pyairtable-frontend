// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ErrorResponse {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
  path?: string
}

// Authentication API Types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  expiresIn: number
}

// Airtable API Types
export interface AirtableBaseResponse {
  id: string
  name: string
  permissionLevel: "none" | "read" | "comment" | "edit" | "create"
  tables?: AirtableTableResponse[]
}

export interface AirtableTableResponse {
  id: string
  name: string
  primaryFieldId: string
  fields: AirtableFieldResponse[]
  views: AirtableViewResponse[]
}

export interface AirtableFieldResponse {
  id: string
  name: string
  type: string
  options?: Record<string, any>
  description?: string
}

export interface AirtableViewResponse {
  id: string
  name: string
  type: string
  visibleFieldIds?: string[]
}

export interface AirtableRecordResponse {
  id: string
  fields: Record<string, any>
  createdTime: string
}

export interface CreateRecordRequest {
  fields: Record<string, any>
}

export interface UpdateRecordRequest {
  fields: Record<string, any>
}

// Chat API Types
export interface ChatMessageRequest {
  message: string
  sessionId?: string
  context?: Record<string, any>
}

export interface ChatMessageResponse {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  functionCalls?: FunctionCallResponse[]
  metadata: {
    tokenCount: number
    cost: number
    model: string
    responseTime: number
  }
}

export interface FunctionCallResponse {
  id: string
  name: string
  parameters: Record<string, any>
  result?: any
  status: "pending" | "executing" | "completed" | "error"
  executionTime?: number
  error?: string
}

export interface ChatSessionResponse {
  id: string
  title: string
  messageCount: number
  totalCost: number
  createdAt: string
  updatedAt: string
}

// Cost Tracking API Types
export interface CostEntryResponse {
  id: string
  sessionId: string
  model: string
  inputTokens: number
  outputTokens: number
  cost: number
  timestamp: string
  operation: string
}

export interface UsageStatisticsResponse {
  totalCost: number
  totalTokens: number
  totalSessions: number
  averageCostPerSession: number
  mostUsedModels: Array<{
    model: string
    usage: number
    cost: number
  }>
  dailyUsage: Array<{
    date: string
    cost: number
    tokens: number
  }>
  weeklyUsage: Array<{
    week: string
    cost: number
    tokens: number
  }>
  monthlyUsage: Array<{
    month: string
    cost: number
    tokens: number
  }>
}

export interface BudgetAlertResponse {
  id: string
  type: "warning" | "critical" | "info"
  message: string
  threshold: number
  currentAmount: number
  timestamp: string
  acknowledged: boolean
}

// Dashboard API Types
export interface DashboardMetricsResponse {
  activeSessions: number
  totalQueries: number
  averageResponseTime: number
  successRate: number
  costToday: number
  tokensUsed: number
  uptime: number
}

export interface SystemStatusResponse {
  service: string
  status: "healthy" | "degraded" | "down"
  responseTime: number
  lastChecked: string
  endpoint: string
  version?: string
}

// Settings API Types
export interface UserSettingsResponse {
  theme: "light" | "dark" | "system"
  model: string
  temperature: number
  maxTokens: number
  budgetLimit: number
  notifications: {
    budgetAlerts: boolean
    systemUpdates: boolean
    sessionSummaries: boolean
  }
  airtable: {
    defaultBase?: string
    defaultTable?: string
  }
}

export interface UpdateSettingsRequest {
  theme?: "light" | "dark" | "system"
  model?: string
  temperature?: number
  maxTokens?: number
  budgetLimit?: number
  notifications?: {
    budgetAlerts?: boolean
    systemUpdates?: boolean
    sessionSummaries?: boolean
  }
  airtable?: {
    defaultBase?: string
    defaultTable?: string
  }
}

// MCP Tools API Types
export interface MCPToolResponse {
  name: string
  description: string
  inputSchema: Record<string, any>
  category: "airtable" | "analysis" | "utility" | "search"
  isAvailable: boolean
  version?: string
}

export interface MCPToolExecutionRequest {
  toolName: string
  parameters: Record<string, any>
  context?: Record<string, any>
}

export interface MCPToolExecutionResponse {
  result: any
  executionTime: number
  status: "success" | "error"
  error?: string
  metadata?: Record<string, any>
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: string
  id?: string
}

export interface ProgressUpdate {
  taskId: string
  progress: number
  status: "pending" | "running" | "completed" | "error"
  message?: string
  result?: any
}

// Query Keys for TanStack Query
export const QueryKeys = {
  // Authentication
  me: ["auth", "me"] as const,
  
  // Airtable
  bases: ["airtable", "bases"] as const,
  base: (baseId: string) => ["airtable", "base", baseId] as const,
  tables: (baseId: string) => ["airtable", "tables", baseId] as const,
  table: (baseId: string, tableId: string) => ["airtable", "table", baseId, tableId] as const,
  records: (baseId: string, tableId: string, params?: Record<string, any>) => 
    ["airtable", "records", baseId, tableId, params] as const,
  
  // Chat
  sessions: ["chat", "sessions"] as const,
  session: (sessionId: string) => ["chat", "session", sessionId] as const,
  messages: (sessionId: string) => ["chat", "messages", sessionId] as const,
  
  // Cost
  usage: (timeframe?: string) => ["cost", "usage", timeframe] as const,
  budgetAlerts: ["cost", "budget-alerts"] as const,
  
  // Dashboard
  metrics: ["dashboard", "metrics"] as const,
  systemStatus: ["dashboard", "system-status"] as const,
  
  // Settings
  settings: ["settings"] as const,
  
  // MCP Tools
  tools: ["mcp", "tools"] as const,
} as const

export type QueryKey = typeof QueryKeys[keyof typeof QueryKeys]