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

// REAL API implementation - NO MOCKING!
import { apiClient } from "@/lib/api/client";

const costApi = {
  getCostData: async (period?: string): Promise<{ data: CostData }> => {
    // REAL API CALL - connects to http://localhost:8000/api/v1/costs
    const response = await apiClient.get<CostData>('/costs', period ? { period } : undefined);
    if (!response.data) {
      throw new Error('Backend service unavailable at http://localhost:8000. DevOps agent needed.');
    }
    return response;
  },

  getCostHistory: async (days: number = 30): Promise<{ data: CostHistory[] }> => {
    // REAL API CALL - connects to http://localhost:8000/api/v1/costs/history
    const response = await apiClient.get<CostHistory[]>('/costs/history', { days });
    if (!response.data) {
      throw new Error('Backend service unavailable at http://localhost:8000. DevOps agent needed.');
    }
    return response;
  },

  getBudgetAlerts: async (): Promise<{ data: BudgetAlert[] }> => {
    // REAL API CALL - connects to http://localhost:8000/api/v1/costs/budget-alerts
    const response = await apiClient.get<BudgetAlert[]>('/costs/budget-alerts');
    if (!response.data) {
      throw new Error('Backend service unavailable at http://localhost:8000. DevOps agent needed.');
    }
    return response;
  },

  getModelCosts: async (): Promise<{ data: ModelCost[] }> => {
    // REAL API CALL - connects to http://localhost:8000/api/v1/costs/models
    const response = await apiClient.get<ModelCost[]>('/costs/models');
    if (!response.data) {
      throw new Error('Backend service unavailable at http://localhost:8000. DevOps agent needed.');
    }
    return response;
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