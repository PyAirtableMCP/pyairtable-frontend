import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { airtableClient } from "@/lib/api-client"
import { AirtableBase, AirtableTable, AirtableRecord } from "@/types"
import { useAirtableStore } from "@/store/airtable-store"

// Query Keys
export const airtableKeys = {
  all: ["airtable"] as const,
  bases: () => [...airtableKeys.all, "bases"] as const,
  base: (id: string) => [...airtableKeys.all, "base", id] as const,
  tables: (baseId: string) => [...airtableKeys.all, "tables", baseId] as const,
  table: (tableId: string) => [...airtableKeys.all, "table", tableId] as const,
  records: (tableId: string) => [...airtableKeys.all, "records", tableId] as const,
}

// Get Airtable Bases
export function useAirtableBases() {
  const { setBases, setLoadingBases } = useAirtableStore()

  return useQuery({
    queryKey: airtableKeys.bases(),
    queryFn: async () => {
      setLoadingBases(true)
      try {
        const response = await airtableClient.get("/bases")
        if (!response.success) {
          throw new Error(response.error || "Failed to fetch bases")
        }
        
        const bases = response.data as AirtableBase[]
        setBases(bases)
        return bases
      } finally {
        setLoadingBases(false)
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get Tables for a Base
export function useAirtableTables(baseId: string) {
  const { setTables, setLoadingTables } = useAirtableStore()

  return useQuery({
    queryKey: airtableKeys.tables(baseId),
    queryFn: async () => {
      setLoadingTables(true)
      try {
        const response = await airtableClient.get(`/bases/${baseId}/tables`)
        if (!response.success) {
          throw new Error(response.error || "Failed to fetch tables")
        }
        
        const tables = response.data as AirtableTable[]
        setTables(baseId, tables)
        return tables
      } finally {
        setLoadingTables(false)
      }
    },
    enabled: !!baseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get Records for a Table
export function useAirtableRecords(tableId: string, params?: Record<string, any>) {
  const { setRecords, setLoadingRecords } = useAirtableStore()

  return useQuery({
    queryKey: [...airtableKeys.records(tableId), params],
    queryFn: async () => {
      setLoadingRecords(true)
      try {
        const queryParams = new URLSearchParams(params).toString()
        const endpoint = `/tables/${tableId}/records${queryParams ? `?${queryParams}` : ""}`
        
        const response = await airtableClient.get(endpoint)
        if (!response.success) {
          throw new Error(response.error || "Failed to fetch records")
        }
        
        const records = response.data as AirtableRecord[]
        setRecords(tableId, records)
        return records
      } finally {
        setLoadingRecords(false)
      }
    },
    enabled: !!tableId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Create Record
export function useCreateRecord() {
  const queryClient = useQueryClient()
  const { addRecord } = useAirtableStore()

  return useMutation({
    mutationFn: async ({ 
      tableId, 
      fields 
    }: { 
      tableId: string; 
      fields: Record<string, any> 
    }) => {
      const response = await airtableClient.post(`/tables/${tableId}/records`, { fields })
      if (!response.success) {
        throw new Error(response.error || "Failed to create record")
      }
      return response.data as AirtableRecord
    },
    onSuccess: (record, { tableId }) => {
      // Update local store
      addRecord(tableId, record)
      
      // Invalidate records query
      queryClient.invalidateQueries({ queryKey: airtableKeys.records(tableId) })
    },
  })
}

// Update Record
export function useUpdateRecord() {
  const queryClient = useQueryClient()
  const { updateRecord } = useAirtableStore()

  return useMutation({
    mutationFn: async ({ 
      tableId, 
      recordId, 
      fields 
    }: { 
      tableId: string; 
      recordId: string; 
      fields: Record<string, any> 
    }) => {
      const response = await airtableClient.patch(`/tables/${tableId}/records/${recordId}`, { fields })
      if (!response.success) {
        throw new Error(response.error || "Failed to update record")
      }
      return response.data as AirtableRecord
    },
    onSuccess: (record, { tableId, recordId }) => {
      // Update local store
      updateRecord(tableId, recordId, record)
      
      // Invalidate records query
      queryClient.invalidateQueries({ queryKey: airtableKeys.records(tableId) })
    },
  })
}

// Delete Record
export function useDeleteRecord() {
  const queryClient = useQueryClient()
  const { deleteRecord } = useAirtableStore()

  return useMutation({
    mutationFn: async ({ 
      tableId, 
      recordId 
    }: { 
      tableId: string; 
      recordId: string 
    }) => {
      const response = await airtableClient.delete(`/tables/${tableId}/records/${recordId}`)
      if (!response.success) {
        throw new Error(response.error || "Failed to delete record")
      }
      return recordId
    },
    onSuccess: (recordId, { tableId }) => {
      // Update local store
      deleteRecord(tableId, recordId)
      
      // Invalidate records query
      queryClient.invalidateQueries({ queryKey: airtableKeys.records(tableId) })
    },
  })
}

// Batch Operations
export function useBatchRecords() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      tableId, 
      operations 
    }: { 
      tableId: string; 
      operations: Array<{
        type: "create" | "update" | "delete";
        recordId?: string;
        fields?: Record<string, any>;
      }>
    }) => {
      const response = await airtableClient.post(`/tables/${tableId}/batch`, { operations })
      if (!response.success) {
        throw new Error(response.error || "Failed to execute batch operations")
      }
      return response.data
    },
    onSuccess: (_, { tableId }) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: airtableKeys.records(tableId) })
    },
  })
}

// Search Records
export function useSearchRecords() {
  return useMutation({
    mutationFn: async ({ 
      tableId, 
      query, 
      fields 
    }: { 
      tableId: string; 
      query: string; 
      fields?: string[] 
    }) => {
      const response = await airtableClient.post(`/tables/${tableId}/search`, { 
        query, 
        fields 
      })
      if (!response.success) {
        throw new Error(response.error || "Failed to search records")
      }
      return response.data as AirtableRecord[]
    },
  })
}