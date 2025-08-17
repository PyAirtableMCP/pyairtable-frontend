import { defineConfig, devices } from '@playwright/test';
import { TestEnvironmentManager, defaultTestConfig } from './e2e/architecture/test-environment';
import { MonitoringSystem, defaultMonitoringConfig } from './e2e/architecture/monitoring-observability';
import { ErrorRecoverySystem, defaultRecoveryConfig } from './e2e/architecture/error-recovery-strategies';
import { GeminiIntegrationManager } from './e2e/architecture/gemini-integration';
import { LongRunningOperationManager } from './e2e/architecture/long-running-processes';

/**
 * Comprehensive E2E Testing Configuration with Journey-Based Architecture
 * 
 * This configuration integrates all architecture components for production-grade
 * E2E testing with comprehensive service management, monitoring, and error recovery.
 */

const isCI = !!process.env.CI;
const isLongRunning = process.env.TEST_TYPE === 'longrunning';
const enableMonitoring = process.env.ENABLE_MONITORING !== 'false';
const mockGemini = process.env.GEMINI_MOCK_MODE === 'true';

export default defineConfig({
  testDir: './e2e',
  
  /* Output directory for test results */
  outputDir: 'test-results/comprehensive',
  
  /* Run tests in files in parallel */
  fullyParallel: !isLongRunning, // Sequential for long-running tests
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: isCI,
  
  /* Retry on CI with intelligent retry strategies */
  retries: isCI ? 3 : 1,
  
  /* Workers based on environment and test type */
  workers: isLongRunning ? 1 : (isCI ? 4 : 2),
  
  /* Maximum number of failures before stopping */
  maxFailures: isCI ? 10 : 5,
  
  /* Reporter configuration with comprehensive reporting */
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/comprehensive/results.json' }],
    ['html', { 
      open: isCI ? 'never' : 'on-failure', 
      outputFolder: 'test-results/comprehensive/html' 
    }],
    ...(isCI ? [
      ['github'],
      ['junit', { outputFile: 'test-results/comprehensive/junit.xml' }],
      ['blob', { outputDir: 'test-results/comprehensive/blob' }]
    ] : [])
  ],
  
  /* Shared settings for all projects */
  use: {
    /* Base URL */
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    
    /* Trace collection with comprehensive debugging */
    trace: isCI ? 'retain-on-failure' : 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording for complex journeys */
    video: isLongRunning ? 'on' : (isCI ? 'retain-on-failure' : 'on-first-retry'),
    
    /* Extended timeouts for long-running operations */
    actionTimeout: isLongRunning ? 30000 : 15000,
    navigationTimeout: isLongRunning ? 60000 : 30000,
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
    
    /* Locale and timezone */
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },

  /* Test timeout configuration */
  timeout: isLongRunning ? 600000 : (isCI ? 60000 : 30000), // 10 minutes for long-running tests
  
  /* Expect timeout */
  expect: {
    timeout: isLongRunning ? 30000 : 10000,
    threshold: 0.2,
    toHaveScreenshot: { animations: 'disabled' },
    toMatchSnapshot: { animations: 'disabled' }
  },

  /* Projects for different test scenarios */
  projects: [
    // Critical Journey Tests - Run first, sequentially
    {
      name: 'critical-journeys',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        '**/journeys/complete-user-onboarding.spec.ts',
        '**/journeys/ai-processing-journey.spec.ts',
        '**/journeys/airtable-integration-journey.spec.ts'
      ],
      fullyParallel: false,
      retries: isCI ? 2 : 1,
      timeout: 300000 // 5 minutes
    },

    // Long-Running AI Operations
    {
      name: 'ai-operations',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-dev-shm-usage', '--no-sandbox'] // For stability
        }
      },
      testMatch: [
        '**/specs/ai-long-operations.spec.ts',
        '**/specs/gemini-integration.spec.ts'
      ],
      fullyParallel: false,
      timeout: 600000, // 10 minutes
      retries: 1
    },

    // Airtable Data Operations
    {
      name: 'airtable-operations',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        '**/specs/airtable-*.spec.ts',
        '**/journeys/airtable-*.spec.ts'
      ],
      timeout: 180000 // 3 minutes
    },

    // Cross-browser Compatibility (Essential flows only)
    {
      name: 'firefox-essential',
      use: { ...devices['Desktop Firefox'] },
      testMatch: '**/essential-*.spec.ts',
      timeout: 120000
    },

    {
      name: 'webkit-essential', 
      use: { ...devices['Desktop Safari'] },
      testMatch: '**/essential-*.spec.ts',
      timeout: 120000
    },

    // Mobile Testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: [
        '**/mobile-*.spec.ts',
        '**/responsive-*.spec.ts'
      ]
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      testMatch: [
        '**/mobile-*.spec.ts',
        '**/responsive-*.spec.ts'
      ]
    },

    // Visual Regression Testing
    {
      name: 'visual-regression',
      use: { 
        ...devices['Desktop Chrome'],
        // Consistent visual testing environment
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1
      },
      testMatch: '**/visual-*.spec.ts'
    }
  ],

  /* Web server configuration with service orchestration */
  webServer: isCI ? undefined : {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pyairtable_test'
    }
  },

  /* Global setup with comprehensive environment management */
  globalSetup: require.resolve('./e2e/global-setup-comprehensive.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown-comprehensive.ts'),

  /* Metadata for comprehensive reporting */
  metadata: {
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'test',
    testType: process.env.TEST_TYPE || 'standard',
    monitoring: enableMonitoring,
    geminiMockMode: mockGemini,
    architecture: 'journey-based',
    services: ['api-gateway:8000', 'ai-processor:8001', 'airtable-gateway:8002', 'platform-services:8007'],
    infrastructure: ['postgres:5432', 'redis:6379', 'docker-compose'],
    features: [
      'journey-patterns',
      'long-running-operations', 
      'websocket-monitoring',
      'error-recovery',
      'gemini-integration',
      'comprehensive-monitoring',
      'circuit-breakers',
      'intelligent-retry'
    ]
  }
});

/**
 * Global test fixtures with architecture integration
 */
declare global {
  namespace PlaywrightTest {
    interface TestType<TestArgs, WorkerArgs> {
      environmentManager: TestEnvironmentManager;
      monitoringSystem: MonitoringSystem;
      errorRecoverySystem: ErrorRecoverySystem;
      geminiManager: GeminiIntegrationManager;
      operationManager: LongRunningOperationManager;
    }
  }
}

/**
 * Export configuration variants for different scenarios
 */
export const configurations = {
  // Quick smoke tests
  smoke: defineConfig({
    ...module.exports.default,
    testMatch: '**/smoke-*.spec.ts',
    workers: 1,
    timeout: 30000,
    retries: 0
  }),
  
  // Long-running comprehensive tests
  comprehensive: defineConfig({
    ...module.exports.default,
    testMatch: '**/journeys/*.spec.ts',
    timeout: 600000,
    workers: 1,
    fullyParallel: false
  }),
  
  // Visual regression only
  visual: defineConfig({
    ...module.exports.default,
    testMatch: '**/visual-*.spec.ts',
    projects: [
      {
        name: 'visual-chrome',
        use: { 
          ...devices['Desktop Chrome'],
          viewport: { width: 1280, height: 720 }
        }
      }
    ]
  }),
  
  // Mobile-focused testing
  mobile: defineConfig({
    ...module.exports.default,
    projects: [
      {
        name: 'mobile-chrome',
        use: { ...devices['Pixel 5'] }
      },
      {
        name: 'mobile-safari', 
        use: { ...devices['iPhone 12'] }
      }
    ]
  })
};