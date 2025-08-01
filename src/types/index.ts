// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Chat Types
export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  functionCalls?: FunctionCall[]
  metadata?: MessageMetadata
}

export interface FunctionCall {
  id: string
  name: string
  parameters: Record<string, any>
  result?: any
  status: "pending" | "executing" | "completed" | "error"
  executionTime?: number
}

export interface MessageMetadata {
  tokenCount?: number
  cost?: number
  model?: string
  temperature?: number
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
  totalCost: number
  messageCount: number
}

// MCP Tool Types
export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, any>
  category: "airtable" | "analysis" | "utility" | "search"
  isAvailable: boolean
}

// Airtable Types
export interface AirtableBase {
  id: string
  name: string
  permissionLevel: "none" | "read" | "comment" | "edit" | "create"
}

export interface AirtableTable {
  id: string
  name: string
  primaryFieldId: string
  fields: AirtableField[]
  views: AirtableView[]
}

export interface AirtableField {
  id: string
  name: string
  type: string
  options?: Record<string, any>
}

export interface AirtableView {
  id: string
  name: string
  type: string
}

export interface AirtableRecord {
  id: string
  fields: Record<string, any>
  createdTime: string
}

// Cost Tracking Types
export interface CostEntry {
  id: string
  sessionId: string
  model: string
  inputTokens: number
  outputTokens: number
  cost: number
  timestamp: Date
  operation: string
}

export interface BudgetAlert {
  id: string
  type: "warning" | "critical" | "info"
  message: string
  threshold: number
  currentAmount: number
  timestamp: Date
}

export interface UsageStatistics {
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
}

// Dashboard Types
export interface DashboardMetrics {
  activeSessions: number
  totalQueries: number
  averageResponseTime: number
  successRate: number
  costToday: number
  tokensUsed: number
}

export interface SystemStatus {
  service: string
  status: "healthy" | "degraded" | "down"
  responseTime: number
  lastChecked: Date
  endpoint: string
}

// Settings Types
export interface UserSettings {
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

// Navigation Types
export interface NavItem {
  title: string
  href: string
  icon: string
  disabled?: boolean
  external?: boolean
  label?: string
}

// Error Types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

// Form Types
export interface FormField {
  name: string
  label: string
  type: "text" | "number" | "select" | "checkbox" | "textarea"
  required?: boolean
  options?: Array<{ label: string; value: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}