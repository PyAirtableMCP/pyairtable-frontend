// Enhanced test data fixtures for comprehensive E2E testing
export interface TestRecord {
  id?: string
  fields: Record<string, any>
  createdTime?: string
}

export interface TestTable {
  id: string
  name: string
  fields: TestField[]
  records: TestRecord[]
}

export interface TestField {
  id: string
  name: string
  type: string
  options?: Record<string, any>
}

export interface TestBase {
  id: string
  name: string
  permissionLevel: string
  tables: TestTable[]
}

// Mock Airtable bases for testing
export const mockBases: TestBase[] = [
  {
    id: 'base_test_1',
    name: 'E2E Test Base',
    permissionLevel: 'read',
    tables: [
      {
        id: 'tbl_customers',
        name: 'Customers',
        fields: [
          { id: 'fld_name', name: 'Name', type: 'singleLineText' },
          { id: 'fld_email', name: 'Email', type: 'email' },
          { id: 'fld_phone', name: 'Phone', type: 'phoneNumber' },
          { id: 'fld_status', name: 'Status', type: 'singleSelect', options: { 
            choices: [{ id: 'active', name: 'Active' }, { id: 'inactive', name: 'Inactive' }] 
          }},
          { id: 'fld_created', name: 'Created', type: 'dateTime' }
        ],
        records: [
          {
            id: 'rec_001',
            fields: {
              'Name': 'John Doe',
              'Email': 'john.doe@example.com',
              'Phone': '+1-555-0101',
              'Status': 'Active',
              'Created': '2024-01-15T09:00:00.000Z'
            },
            createdTime: '2024-01-15T09:00:00.000Z'
          },
          {
            id: 'rec_002',
            fields: {
              'Name': 'Jane Smith',
              'Email': 'jane.smith@example.com',
              'Phone': '+1-555-0102',
              'Status': 'Active',
              'Created': '2024-01-16T10:30:00.000Z'
            },
            createdTime: '2024-01-16T10:30:00.000Z'
          },
          {
            id: 'rec_003',
            fields: {
              'Name': 'Bob Johnson',
              'Email': 'bob.johnson@example.com',
              'Phone': '+1-555-0103',
              'Status': 'Inactive',
              'Created': '2024-01-17T14:15:00.000Z'
            },
            createdTime: '2024-01-17T14:15:00.000Z'
          }
        ]
      }
    ]
  }
]

// Test data for CRUD operations
export const crudTestData = {
  // Data for creating new records
  newRecords: {
    customer: {
      'Name': 'Alice Brown',
      'Email': 'alice.brown@example.com',
      'Phone': '+1-555-0104',
      'Status': 'Active'
    },
    invalidCustomer: {
      'Name': '', // Empty name to test validation
      'Email': 'invalid-email', // Invalid email format
      'Phone': '123', // Invalid phone format
      'Status': 'Unknown' // Invalid status option
    }
  },

  // Data for updating existing records
  updateData: {
    customer: {
      id: 'rec_001',
      fields: {
        'Name': 'John Doe Jr.',
        'Email': 'john.doe.jr@example.com',
        'Phone': '+1-555-0105',
        'Status': 'Inactive'
      }
    },
    partialUpdate: {
      id: 'rec_002',
      fields: {
        'Phone': '+1-555-9999'
      }
    }
  },

  // Records for deletion testing
  deleteRecords: ['rec_003'],

  // Bulk operation data
  bulkOperations: {
    create: [
      {
        'Name': 'Test User 1',
        'Email': 'test1@example.com',
        'Phone': '+1-555-1001',
        'Status': 'Active'
      },
      {
        'Name': 'Test User 2',
        'Email': 'test2@example.com',
        'Phone': '+1-555-1002',
        'Status': 'Inactive'
      }
    ],
    update: [
      {
        id: 'rec_001',
        fields: {
          'Status': 'Inactive'
        }
      },
      {
        id: 'rec_002',
        fields: {
          'Status': 'Active'
        }
      }
    ],
    delete: ['rec_bulk_1', 'rec_bulk_2']
  }
}

// Search test data
export const searchTestData = {
  queries: {
    exact: 'John Doe',
    partial: 'John',
    email: 'jane.smith@example.com',
    phone: '555-0102',
    status: 'Active',
    nonExistent: 'xyz123notfound',
    specialCharacters: 'test@#$%',
    empty: '',
    whitespace: '   '
  },
  
  expectedResults: {
    'John Doe': ['rec_001'],
    'John': ['rec_001'],
    'jane.smith@example.com': ['rec_002'],
    '555-0102': ['rec_002'],
    'Active': ['rec_001', 'rec_002'],
    'xyz123notfound': [],
    'test@#$%': [],
    '': [], // Should handle gracefully
    '   ': [] // Should handle gracefully
  },

  filters: {
    status: {
      active: { field: 'Status', value: 'Active' },
      inactive: { field: 'Status', value: 'Inactive' }
    },
    dateRange: {
      thisWeek: { field: 'Created', from: '2024-01-15', to: '2024-01-21' },
      lastMonth: { field: 'Created', from: '2023-12-01', to: '2023-12-31' }
    }
  }
}

// Pagination test data - simulating larger dataset
export const paginationTestData = {
  pageSize: 10,
  totalRecords: 50,
  pages: 5,
  
  // Generate test records for pagination
  generateLargeDataset: (count: number = 50): TestRecord[] => {
    const records: TestRecord[] = []
    
    for (let i = 1; i <= count; i++) {
      records.push({
        id: `rec_${String(i).padStart(3, '0')}`,
        fields: {
          'Name': `Test User ${i}`,
          'Email': `user${i}@example.com`,
          'Phone': `+1-555-${String(i).padStart(4, '0')}`,
          'Status': i % 3 === 0 ? 'Inactive' : 'Active',
          'Created': new Date(2024, 0, i % 31 + 1).toISOString()
        },
        createdTime: new Date(2024, 0, i % 31 + 1).toISOString()
      })
    }
    
    return records
  },

  // Pagination scenarios to test
  scenarios: {
    firstPage: { page: 1, offset: 0, limit: 10 },
    middlePage: { page: 3, offset: 20, limit: 10 },
    lastPage: { page: 5, offset: 40, limit: 10 },
    oversizedPage: { page: 10, offset: 90, limit: 10 }, // Beyond available data
    invalidPage: { page: -1, offset: -10, limit: 10 }, // Invalid page number
    largePageSize: { page: 1, offset: 0, limit: 100 } // Larger than total records
  }
}

// API response templates
export const mockApiResponses = {
  // Successful responses
  success: {
    bases: {
      status: 200,
      body: { bases: mockBases }
    },
    
    records: {
      list: {
        status: 200,
        body: {
          records: mockBases[0].tables[0].records,
          totalRecords: mockBases[0].tables[0].records.length,
          hasMore: false
        }
      },
      
      create: {
        status: 201,
        body: {
          id: 'rec_new_001',
          fields: crudTestData.newRecords.customer,
          createdTime: new Date().toISOString()
        }
      },
      
      update: {
        status: 200,
        body: {
          id: 'rec_001',
          fields: crudTestData.updateData.customer.fields,
          createdTime: '2024-01-15T09:00:00.000Z'
        }
      },
      
      delete: {
        status: 200,
        body: {
          id: 'rec_003',
          deleted: true
        }
      }
    },

    search: {
      status: 200,
      body: {
        records: mockBases[0].tables[0].records.filter(r => 
          r.fields.Status === 'Active'
        ),
        query: 'Active',
        totalMatches: 2
      }
    },

    pagination: {
      page1: {
        status: 200,
        body: {
          records: paginationTestData.generateLargeDataset(50).slice(0, 10),
          totalRecords: 50,
          page: 1,
          pageSize: 10,
          hasMore: true,
          nextOffset: 10
        }
      },
      
      page3: {
        status: 200,
        body: {
          records: paginationTestData.generateLargeDataset(50).slice(20, 30),
          totalRecords: 50,
          page: 3,
          pageSize: 10,
          hasMore: true,
          nextOffset: 30
        }
      }
    }
  },

  // Error responses
  errors: {
    unauthorized: {
      status: 401,
      body: { error: 'Invalid Personal Access Token' }
    },
    
    forbidden: {
      status: 403,
      body: { error: 'Insufficient permissions' }
    },
    
    notFound: {
      status: 404,
      body: { error: 'Record not found' }
    },
    
    badRequest: {
      status: 400,
      body: { error: 'Invalid request data' }
    },
    
    rateLimited: {
      status: 429,
      body: { error: 'Rate limit exceeded' }
    },
    
    serverError: {
      status: 500,
      body: { error: 'Internal server error' }
    }
  }
}

// Test user workflows
export const userWorkflows = {
  // Happy path: Complete CRUD workflow
  completeCrud: [
    'login',
    'viewBases',
    'selectTable',
    'viewRecords',
    'createRecord',
    'editRecord',
    'deleteRecord',
    'logout'
  ],

  // Search and filter workflow
  searchWorkflow: [
    'login',
    'selectTable',
    'performSearch',
    'applyFilters',
    'clearFilters',
    'exportResults',
    'logout'
  ],

  // Pagination workflow
  paginationWorkflow: [
    'login',
    'selectTable',
    'navigateToPage2',
    'navigateToLastPage',
    'navigateToFirstPage',
    'changePageSize',
    'logout'
  ],

  // Error handling workflow
  errorHandling: [
    'login',
    'triggerApiError',
    'handleNetworkFailure',
    'recoverFromError',
    'logout'
  ]
}

// Performance test data
export const performanceTestData = {
  largeDataset: {
    recordCount: 1000,
    fieldCount: 20,
    batchSize: 100
  },
  
  searchPerformance: {
    queries: [
      'simple text search',
      'complex filter with multiple conditions',
      'full-text search across all fields',
      'date range search',
      'numeric range search'
    ]
  }
}

export default {
  mockBases,
  crudTestData,
  searchTestData,
  paginationTestData,
  mockApiResponses,
  userWorkflows,
  performanceTestData
}