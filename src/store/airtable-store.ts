import { create } from "zustand"
import { AirtableBase, AirtableTable, AirtableRecord, AirtableField, AirtableView } from "@/types"

interface AirtableState {
  // Data
  bases: AirtableBase[]
  tables: Record<string, AirtableTable[]> // keyed by baseId
  records: Record<string, AirtableRecord[]> // keyed by tableId
  
  // Current Selection
  selectedBase: AirtableBase | null
  selectedTable: AirtableTable | null
  
  // Loading States
  isLoadingBases: boolean
  isLoadingTables: boolean
  isLoadingRecords: boolean
  
  // Actions
  setBases: (bases: AirtableBase[]) => void
  setTables: (baseId: string, tables: AirtableTable[]) => void
  setRecords: (tableId: string, records: AirtableRecord[]) => void
  
  // Selection Actions
  selectBase: (base: AirtableBase | null) => void
  selectTable: (table: AirtableTable | null) => void
  
  // Record Actions
  addRecord: (tableId: string, record: AirtableRecord) => void
  updateRecord: (tableId: string, recordId: string, updates: Partial<AirtableRecord>) => void
  deleteRecord: (tableId: string, recordId: string) => void
  
  // Loading Actions
  setLoadingBases: (loading: boolean) => void
  setLoadingTables: (loading: boolean) => void
  setLoadingRecords: (loading: boolean) => void
  
  // Utility Actions
  clearData: () => void
  getTableById: (tableId: string) => AirtableTable | undefined
  getRecordsByTableId: (tableId: string) => AirtableRecord[]
}

export const useAirtableStore = create<AirtableState>((set, get) => ({
  // Initial State
  bases: [],
  tables: {},
  records: {},
  selectedBase: null,
  selectedTable: null,
  isLoadingBases: false,
  isLoadingTables: false,
  isLoadingRecords: false,

  // Data Actions
  setBases: (bases) => set({ bases }),
  
  setTables: (baseId, tables) => set((state) => ({
    tables: { ...state.tables, [baseId]: tables }
  })),
  
  setRecords: (tableId, records) => set((state) => ({
    records: { ...state.records, [tableId]: records }
  })),

  // Selection Actions
  selectBase: (base) => set({ 
    selectedBase: base,
    selectedTable: null // Clear table selection when base changes
  }),
  
  selectTable: (table) => set({ selectedTable: table }),

  // Record CRUD Actions
  addRecord: (tableId, record) => set((state) => ({
    records: {
      ...state.records,
      [tableId]: [record, ...(state.records[tableId] || [])]
    }
  })),

  updateRecord: (tableId, recordId, updates) => set((state) => ({
    records: {
      ...state.records,
      [tableId]: (state.records[tableId] || []).map(record =>
        record.id === recordId ? { ...record, ...updates } : record
      )
    }
  })),

  deleteRecord: (tableId, recordId) => set((state) => ({
    records: {
      ...state.records,
      [tableId]: (state.records[tableId] || []).filter(record => record.id !== recordId)
    }
  })),

  // Loading Actions
  setLoadingBases: (loading) => set({ isLoadingBases: loading }),
  setLoadingTables: (loading) => set({ isLoadingTables: loading }),
  setLoadingRecords: (loading) => set({ isLoadingRecords: loading }),

  // Utility Actions
  clearData: () => set({
    bases: [],
    tables: {},
    records: {},
    selectedBase: null,
    selectedTable: null
  }),

  getTableById: (tableId) => {
    const state = get()
    for (const tables of Object.values(state.tables)) {
      const found = tables.find(table => table.id === tableId)
      if (found) return found
    }
    return undefined
  },

  getRecordsByTableId: (tableId) => {
    return get().records[tableId] || []
  }
}))