import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { AirtableBase, AirtableTable, AirtableRecord } from '@/lib/airtable-client';

export interface AirtableState {
  // Data
  bases: AirtableBase[];
  selectedBase: AirtableBase | null;
  tables: AirtableTable[];
  selectedTable: AirtableTable | null;
  records: AirtableRecord[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  filterOptions: Record<string, any>;
  
  // Pagination
  currentPage: number;
  totalRecords: number;
  offset?: string;
  hasMore: boolean;
  
  // Actions
  setBases: (bases: AirtableBase[]) => void;
  setSelectedBase: (base: AirtableBase | null) => void;
  setTables: (tables: AirtableTable[]) => void;
  setSelectedTable: (table: AirtableTable | null) => void;
  setRecords: (records: AirtableRecord[], hasMore?: boolean) => void;
  addRecords: (newRecords: AirtableRecord[]) => void;
  updateRecord: (recordId: string, updates: Partial<AirtableRecord>) => void;
  deleteRecord: (recordId: string) => void;
  
  // UI Actions
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchTerm: (term: string) => void;
  setFilterOptions: (filters: Record<string, any>) => void;
  clearFilters: () => void;
  
  // Pagination Actions
  setCurrentPage: (page: number) => void;
  setOffset: (offset?: string) => void;
  
  // Utility Actions
  reset: () => void;
  clearSelection: () => void;
}

const initialState = {
  bases: [],
  selectedBase: null,
  tables: [],
  selectedTable: null,
  records: [],
  isLoading: false,
  error: null,
  searchTerm: '',
  filterOptions: {},
  currentPage: 1,
  totalRecords: 0,
  offset: undefined,
  hasMore: false,
};

export const useAirtableStore = create<AirtableState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Data actions
    setBases: (bases) => set({ bases, error: null }),
    
    setSelectedBase: (base) => set({ 
      selectedBase: base, 
      tables: [], 
      selectedTable: null, 
      records: [],
      currentPage: 1,
      offset: undefined,
      error: null 
    }),
    
    setTables: (tables) => set({ tables, error: null }),
    
    setSelectedTable: (table) => set({ 
      selectedTable: table, 
      records: [],
      currentPage: 1,
      offset: undefined,
      error: null 
    }),
    
    setRecords: (records, hasMore = false) => set({ 
      records, 
      hasMore,
      totalRecords: records.length, 
      error: null 
    }),
    
    addRecords: (newRecords) => set((state) => ({ 
      records: [...state.records, ...newRecords],
      totalRecords: state.totalRecords + newRecords.length
    })),
    
    updateRecord: (recordId, updates) => set((state) => ({
      records: state.records.map(record => 
        record.id === recordId ? { ...record, ...updates } : record
      )
    })),
    
    deleteRecord: (recordId) => set((state) => ({
      records: state.records.filter(record => record.id !== recordId),
      totalRecords: state.totalRecords - 1
    })),

    // UI actions
    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error, isLoading: false }),
    setSearchTerm: (searchTerm) => set({ searchTerm, currentPage: 1 }),
    setFilterOptions: (filterOptions) => set({ filterOptions, currentPage: 1 }),
    clearFilters: () => set({ filterOptions: {}, searchTerm: '', currentPage: 1 }),

    // Pagination actions
    setCurrentPage: (currentPage) => set({ currentPage }),
    setOffset: (offset) => set({ offset }),

    // Utility actions
    reset: () => set(initialState),
    clearSelection: () => set({ 
      selectedBase: null, 
      selectedTable: null, 
      tables: [], 
      records: [],
      currentPage: 1,
      offset: undefined
    }),
  }))
);