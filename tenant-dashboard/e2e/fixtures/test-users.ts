// Test user data for E2E tests
export interface TestUser {
  email: string
  password: string
  name: string
  role?: string
}

export const testUsers = {
  // Standard test user for login tests - using REAL local fallback password
  standard: {
    email: 'user@pyairtable.com',
    password: 'test123456', // Local fallback accepts this password 
    name: 'Test User',
    role: 'user'
  } as TestUser,

  // Admin user for admin flow tests - also using real local fallback password
  admin: {
    email: 'admin@example.com',
    password: 'test123456', // Changed to work with local fallback
    name: 'Admin User',
    role: 'admin'
  } as TestUser,

  // New user for registration tests
  newUser: {
    email: 'newuser@example.com',
    password: 'test123456', // Using working local fallback password
    name: 'New Test User',
    role: 'user'
  } as TestUser,

  // User with special characters for edge case testing
  specialUser: {
    email: 'special.user+test@example.com',
    password: 'test123456', // Using working local fallback password
    name: 'Special Test User',
    role: 'user'
  } as TestUser,

  // User for concurrent testing
  concurrentUser: {
    email: 'concurrent@example.com',
    password: 'test123456', // Using working local fallback password
    name: 'Concurrent Test User',
    role: 'user'
  } as TestUser
}

// Generate unique test user for parallel test execution
export function generateUniqueTestUser(baseName: string = 'test'): TestUser {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  
  return {
    email: `${baseName}.${timestamp}.${randomId}@example.com`,
    password: 'UniquePassword123!',
    name: `Unique Test User ${randomId}`,
    role: 'user'
  }
}

// Test data for various scenarios
export const testData = {
  // Valid form data
  validRegistration: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
    agreeToTerms: true
  },

  // Chat test messages
  chatMessages: {
    simple: 'Hello, can you help me with my data?',
    airtableQuery: 'Show me all records from my Posts table',
    formulaRequest: 'Create a formula to calculate engagement rate',
    complex: 'I need to analyze the performance of my social media posts from last month and create an automated workflow for high-performing content'
  },

  // Airtable test data
  airtableData: {
    tableName: 'Posts',
    fieldNames: ['Title', 'Content', 'Engagement', 'Date'],
    sampleRecords: [
      { Title: 'Test Post 1', Content: 'This is a test post', Engagement: 100, Date: '2024-01-01' },
      { Title: 'Test Post 2', Content: 'Another test post', Engagement: 200, Date: '2024-01-02' }
    ]
  },

  // Error scenarios
  invalidData: {
    registration: {
      invalidEmail: 'not-an-email',
      weakPassword: '123',
      missingFields: {},
      passwordMismatch: {
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!'
      }
    },
    login: {
      invalidCredentials: {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      },
      malformedEmail: {
        email: 'malformed.email',
        password: 'SomePassword123!'
      }
    }
  }
}