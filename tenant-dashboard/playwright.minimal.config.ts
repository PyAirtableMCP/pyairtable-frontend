import { defineConfig, devices } from '@playwright/test'

/**
 * Minimal Playwright Configuration for Metadata Table Journey Test
 * Bypasses database setup for direct testing
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Only run the metadata table journey test */
  testMatch: [
    '**/metadata-table-journey.spec.ts',
    '**/simple-metadata-test.spec.ts'
  ],
  
  /* Output directory for test results */
  outputDir: 'test-results-minimal',
  
  /* Disable parallel execution for complex workflows */
  fullyParallel: false,
  workers: 1,
  
  /* Basic retries */
  retries: 0,
  
  /* Extended timeout for complex AI operations */
  timeout: 600000, // 10 minutes per test
  
  /* Minimal reporting */
  reporter: [
    ['list', { printSteps: true }],
    ['html', { 
      open: 'on-failure', 
      outputFolder: 'test-results-minimal-html'
    }]
  ],
  
  /* Global configuration optimized for AI operations */
  use: {
    /* Base URL */
    baseURL: 'http://localhost:3000',
    
    /* Extended timeouts for AI operations */
    actionTimeout: 30000,
    navigationTimeout: 60000,
    
    /* Capture traces and videos for debugging */
    trace: 'on',
    video: 'on',
    screenshot: 'on',
    
    /* Browser settings */
    viewport: { width: 1920, height: 1080 },
    
    /* Extended expect timeout for AI responses */
    expect: { timeout: 30000 }
  },

  /* Single project for testing */
  projects: [
    {
      name: 'chromium-minimal',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage'
          ]
        }
      }
    }
  ],

  /* No global setup or teardown */
  // globalSetup: undefined,
  // globalTeardown: undefined,

  /* Extended expect configuration */
  expect: {
    timeout: 60000
  }
})