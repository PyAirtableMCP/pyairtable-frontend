import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Configuration for Long-Running Complex User Journeys
 * Optimized for metadata table creation, AI processing, and Gemini integration tests
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Filter to only run long-running journey tests */
  testMatch: [
    '**/metadata-table-journey.spec.ts',
    '**/journeys/*.spec.ts',
    '**/*journey*.spec.ts'
  ],
  
  /* Output directory for test results */
  outputDir: 'test-results-longrunning',
  
  /* Disable parallel execution for complex workflows to avoid resource conflicts */
  fullyParallel: false,
  
  /* Allow only 1 worker to prevent overwhelming AI services */
  workers: 1,
  
  /* Increase retries for long-running tests due to network/AI service variability */
  retries: process.env.CI ? 2 : 1,
  
  /* No failure limit - let long tests complete */
  maxFailures: undefined,
  
  /* Extended timeout for complex AI operations */
  timeout: 600000, // 10 minutes per test
  
  /* Enhanced reporting for long-running tests */
  reporter: [
    ['list', { printSteps: true }],
    ['html', { 
      open: 'on-failure', 
      outputFolder: 'test-results-longrunning/html',
      attachmentsBaseURL: 'data:' 
    }],
    ['json', { outputFile: 'test-results-longrunning/results.json' }],
    ['junit', { outputFile: 'test-results-longrunning/junit.xml' }],
    // Custom reporter for long-running test insights
    ['./e2e/reporters/long-running-reporter.ts']
  ],
  
  /* Global configuration optimized for AI and long operations */
  use: {
    /* Base URL */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* Extended timeouts for AI operations */
    actionTimeout: 30000,        // 30s for individual actions
    navigationTimeout: 60000,    // 60s for navigation
    
    /* Always capture traces for debugging complex flows */
    trace: 'on',
    
    /* Video recording for all long-running tests */
    video: 'on',
    
    /* Screenshot on failure and success milestones */
    screenshot: 'on',
    
    /* Ignore HTTPS errors for local testing */
    ignoreHTTPSErrors: true,
    
    /* Locale and timezone for consistent behavior */
    locale: 'en-US',
    timezoneId: 'America/New_York',
    
    /* Browser context settings for stability */
    viewport: { width: 1920, height: 1080 },
    
    /* Extended expect timeout for AI responses */
    expect: { timeout: 30000 },
    
    /* Extra HTTP headers for API debugging */
    extraHTTPHeaders: {
      'X-Test-Type': 'long-running-journey',
      'X-Test-Timeout': '600000'
    }
  },

  /* Projects optimized for long-running tests */
  projects: [
    {
      name: 'chromium-longrunning',
      use: { 
        ...devices['Desktop Chrome'],
        // Increase browser memory for long sessions
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--max_old_space_size=4096'  // 4GB memory limit
          ]
        }
      },
      testMatch: [
        '**/metadata-table-journey.spec.ts',
        '**/journeys/*.spec.ts'
      ]
    },
    
    // Separate project for individual component testing
    {
      name: 'components-longrunning', 
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--no-sandbox', '--disable-dev-shm-usage']
        }
      },
      testMatch: [
        '**/individual-*.spec.ts',
        '**/component-*.spec.ts'
      ]
    }
  ],

  /* Enhanced web server configuration for long-running tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 180000, // 3 minutes to start
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pyairtable',
      // AI service configuration
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      // Increase timeouts for AI services
      AI_REQUEST_TIMEOUT: '300000',
      AI_MAX_RETRIES: '3'
    },
  },

  /* Global setup for long-running tests */
  globalSetup: require.resolve('./e2e/global-setup-longrunning.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown-longrunning.ts'),

  /* Extended expect configuration */
  expect: {
    /* Very long timeout for AI responses */
    timeout: 60000,
    
    /* More lenient screenshot comparison for AI-generated content */
    threshold: 0.3,
    
    /* Disable animations for consistent screenshots */
    toHaveScreenshot: { 
      animations: 'disabled',
      threshold: 0.3,
      maxDiffPixels: 1000
    },
    toMatchSnapshot: { 
      animations: 'disabled',
      threshold: 0.3
    }
  },

  /* Test metadata for reporting */
  metadata: {
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'test',
    testType: 'long-running-journey',
    browser: 'chromium',
    os: process.platform,
    aiServices: 'gemini-2.5-flash',
    maxTestTimeout: '600s',
    expectedDuration: '5-15 minutes per test'
  }
})