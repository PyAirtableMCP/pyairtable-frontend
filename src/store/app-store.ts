import { create } from "zustand"
import { persist } from "zustand/middleware"
import { UserSettings, SystemStatus, DashboardMetrics, BudgetAlert } from "@/types"

interface AppState {
  // User Settings
  settings: UserSettings
  
  // System Status
  systemStatus: SystemStatus[]
  
  // Dashboard Data
  dashboardMetrics: DashboardMetrics | null
  
  // Budget & Alerts
  budgetAlerts: BudgetAlert[]
  
  // UI State
  sidebarCollapsed: boolean
  theme: "light" | "dark" | "system"
  
  // Actions - Settings
  updateSettings: (updates: Partial<UserSettings>) => void
  resetSettings: () => void
  
  // Actions - System
  updateSystemStatus: (status: SystemStatus[]) => void
  updateDashboardMetrics: (metrics: DashboardMetrics) => void
  
  // Actions - Alerts
  addBudgetAlert: (alert: Omit<BudgetAlert, "id" | "timestamp">) => void
  dismissAlert: (alertId: string) => void
  clearAllAlerts: () => void
  
  // Actions - UI
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: "light" | "dark" | "system") => void
}

const defaultSettings: UserSettings = {
  theme: "system",
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 2048,
  budgetLimit: 500,
  notifications: {
    budgetAlerts: true,
    systemUpdates: true,
    sessionSummaries: true
  },
  airtable: {
    defaultBase: undefined,
    defaultTable: undefined
  }
}

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36)

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      settings: defaultSettings,
      systemStatus: [],
      dashboardMetrics: null,
      budgetAlerts: [],
      sidebarCollapsed: false,
      theme: "system",

      // Settings Actions
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates }
        }))
      },

      resetSettings: () => {
        set({ settings: defaultSettings })
      },

      // System Actions
      updateSystemStatus: (status) => {
        set({ systemStatus: status })
      },

      updateDashboardMetrics: (metrics) => {
        set({ dashboardMetrics: metrics })
      },

      // Alert Actions
      addBudgetAlert: (alertData) => {
        const alert: BudgetAlert = {
          ...alertData,
          id: generateId(),
          timestamp: new Date()
        }
        
        set((state) => ({
          budgetAlerts: [alert, ...state.budgetAlerts]
        }))
      },

      dismissAlert: (alertId) => {
        set((state) => ({
          budgetAlerts: state.budgetAlerts.filter(alert => alert.id !== alertId)
        }))
      },

      clearAllAlerts: () => {
        set({ budgetAlerts: [] })
      },

      // UI Actions
      toggleSidebar: () => {
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed
        }))
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed })
      },

      setTheme: (theme) => {
        set({ 
          theme,
          settings: { ...get().settings, theme }
        })
      }
    }),
    {
      name: "app-store",
      partialize: (state) => ({
        settings: state.settings,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme
      })
    }
  )
)