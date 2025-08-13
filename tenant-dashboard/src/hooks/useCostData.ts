"use client";

import { useApiQuery, usePaginatedQuery } from "@/hooks/useApi";
import { queryKeys } from "@/lib/api/types";
import type { FilterOptions } from "@/types";

// Cost and usage data interfaces
export interface CostData {
  period: {
    start: string;
    end: string;
  };
  totalCost: number;
  currency: string;
  breakdown: CostBreakdown[];
  usage: UsageMetrics;
  projectedCost: number;
}

export interface CostBreakdown {
  category: string;
  service: string;
  cost: number;
  usage: number;
  unit: string;
  percentage: number;
}

export interface UsageMetrics {
  apiCalls: number;
  computeHours: number;
  storage: number;
  dataTransfer: number;
  timestamp: string;
}

export interface BudgetAlert {
  id: string;
  name: string;
  threshold: number;
  type: 'percentage' | 'fixed';
  period: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  currentSpend: number;
  notifications: string[];
}

export interface ModelCost {
  modelId: string;
  modelName: string;
  provider: string;
  inputCost: number;
  outputCost: number;
  totalCalls: number;
  totalCost: number;
  avgResponseTime: number;
  successRate: number;
}

export interface CostHistory {
  date: string;
  cost: number;
  usage: number;
  breakdown: CostBreakdown[];
}

// API functions (these would be implemented in your API client)
const costApi = {
  getCostData: async (period?: string): Promise<{ data: CostData }> => {
    // Mock implementation - replace with actual API call
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return {
      data: {
        period: {
          start: startOfMonth.toISOString(),
          end: now.toISOString(),
        },
        totalCost: 156.78,
        currency: 'USD',
        breakdown: [
          {
            category: 'API Usage',
            service: 'Airtable API',
            cost: 89.50,
            usage: 45000,
            unit: 'requests',
            percentage: 57.1,
          },
          {
            category: 'Compute',
            service: 'AI Processing',
            cost: 43.20,
            usage: 120.5,
            unit: 'hours',
            percentage: 27.6,
          },
          {
            category: 'Storage',
            service: 'Data Storage',
            cost: 24.08,
            usage: 2.1,
            unit: 'GB',
            percentage: 15.3,
          },
        ],
        usage: {
          apiCalls: 45000,
          computeHours: 120.5,
          storage: 2200000000, // 2.1 GB in bytes
          dataTransfer: 890000000, // 890 MB in bytes
          timestamp: now.toISOString(),
        },
        projectedCost: 187.34,
      },
    };
  },

  getCostHistory: async (days: number = 30): Promise<{ data: CostHistory[] }> => {
    // Mock implementation
    const history: CostHistory[] = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const baseCost = 4.5 + Math.random() * 2;
      history.push({
        date: date.toISOString(),
        cost: baseCost,
        usage: Math.floor(1200 + Math.random() * 800),
        breakdown: [
          {
            category: 'API',
            service: 'Airtable API',
            cost: baseCost * 0.6,
            usage: Math.floor(1000 + Math.random() * 500),
            unit: 'requests',
            percentage: 60,
          },
          {
            category: 'Compute',
            service: 'AI Processing',
            cost: baseCost * 0.4,
            usage: Math.floor(3 + Math.random() * 2),
            unit: 'hours',
            percentage: 40,
          },
        ],
      });
    }
    
    return { data: history };
  },

  getBudgetAlerts: async (): Promise<{ data: BudgetAlert[] }> => {
    return {
      data: [
        {
          id: '1',
          name: 'Monthly Budget Alert',
          threshold: 200,
          type: 'fixed',
          period: 'monthly',
          isActive: true,
          currentSpend: 156.78,
          notifications: ['email', 'dashboard'],
        },
        {
          id: '2',
          name: 'API Usage Warning',
          threshold: 80,
          type: 'percentage',
          period: 'monthly',
          isActive: true,
          currentSpend: 89.50,
          notifications: ['email'],
        },
      ],
    };
  },

  getModelCosts: async (): Promise<{ data: ModelCost[] }> => {
    return {
      data: [
        {
          modelId: 'gpt-4',
          modelName: 'GPT-4',
          provider: 'OpenAI',
          inputCost: 0.03,
          outputCost: 0.06,
          totalCalls: 1250,
          totalCost: 34.20,
          avgResponseTime: 2.3,
          successRate: 98.4,
        },
        {
          modelId: 'claude-3',
          modelName: 'Claude 3 Sonnet',
          provider: 'Anthropic',
          inputCost: 0.003,
          outputCost: 0.015,
          totalCalls: 890,
          totalCost: 15.60,
          avgResponseTime: 1.8,
          successRate: 99.1,
        },
        {
          modelId: 'gemini-pro',
          modelName: 'Gemini Pro',
          provider: 'Google',
          inputCost: 0.0005,
          outputCost: 0.0015,
          totalCalls: 2100,
          totalCost: 8.40,
          avgResponseTime: 1.5,
          successRate: 97.2,
        },
      ],
    };
  },
};

// Cost data hooks
export function useCostData(period?: string) {
  return useApiQuery(
    queryKeys.analytics.reports('cost', period),
    () => costApi.getCostData(period),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    }
  );
}

export function useCostHistory(days: number = 30) {
  return useApiQuery(
    [...queryKeys.analytics, 'cost-history', days],
    () => costApi.getCostHistory(days),
    {
      staleTime: 60 * 1000, // 1 minute
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );
}

export function useBudgetAlerts() {
  return useApiQuery(
    [...queryKeys.tenant, 'budget-alerts'],
    costApi.getBudgetAlerts,
    {
      staleTime: 60 * 1000, // 1 minute
    }
  );
}

export function useModelCosts() {
  return useApiQuery(
    [...queryKeys.analytics, 'model-costs'],
    costApi.getModelCosts,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

// Usage summary hook
export function useCostSummary() {
  const costData = useCostData();
  const costHistory = useCostHistory(7); // Last 7 days
  const budgetAlerts = useBudgetAlerts();
  const modelCosts = useModelCosts();

  const isLoading = costData.isLoading || costHistory.isLoading || budgetAlerts.isLoading || modelCosts.isLoading;
  const isError = costData.isError || costHistory.isError || budgetAlerts.isError || modelCosts.isError;

  return {
    costData: costData.data?.data,
    costHistory: costHistory.data?.data,
    budgetAlerts: budgetAlerts.data?.data,
    modelCosts: modelCosts.data?.data,
    isLoading,
    isError,
  };
}