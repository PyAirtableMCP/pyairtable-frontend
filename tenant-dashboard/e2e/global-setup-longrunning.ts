import { chromium, FullConfig } from '@playwright/test'

/**
 * Global Setup for Long-Running Journey Tests
 * Prepares the environment for complex AI operations and extended test sessions
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for long-running tests...')
  
  const startTime = Date.now()
  
  try {
    // Launch browser for setup operations
    const browser = await chromium.launch()
    const context = await browser.newContext()
    const page = await context.newPage()
    
    // 1. Verify base application is accessible
    console.log('🌐 Verifying application accessibility...')
    const baseUrl = config.webServer?.port 
      ? `http://localhost:${config.webServer.port}` 
      : 'http://localhost:3000'
    
    try {
      await page.goto(baseUrl, { timeout: 60000 })
      await page.waitForLoadState('networkidle')
      console.log('✅ Application is accessible')
    } catch (error) {
      console.error('❌ Application not accessible:', error)
      throw new Error(`Application at ${baseUrl} is not accessible`)
    }
    
    // 2. Pre-warm AI services by sending a test request
    console.log('🤖 Pre-warming AI services...')
    try {
      // Navigate to chat and send a warming request
      await page.goto('/chat')
      await page.waitForLoadState('networkidle')
      
      const chatInput = page.getByPlaceholder(/ask anything about your data/i)
      if (await chatInput.isVisible({ timeout: 10000 })) {
        await chatInput.fill('System warmup test - please respond with OK')
        await page.keyboard.press('Enter')
        
        // Wait for response (with timeout)
        try {
          await page.waitForSelector('.ai-response', { timeout: 30000 })
          console.log('✅ AI services pre-warmed successfully')
        } catch (error) {
          console.warn('⚠️ AI warmup timeout - services may be slow to start')
        }
      } else {
        console.warn('⚠️ Chat interface not available for warmup')
      }
    } catch (error) {
      console.warn('⚠️ AI service warmup failed:', error)
      // Don't fail setup - tests should handle AI service issues
    }
    
    // 3. Verify backend services are responsive
    console.log('🔌 Checking backend service health...')
    const healthChecks = [
      '/api/health',
      '/api/auth/session',
      '/api/airtable/status'
    ]
    
    for (const endpoint of healthChecks) {
      try {
        const response = await page.request.get(`${baseUrl}${endpoint}`)
        if (response.ok()) {
          console.log(`✅ ${endpoint} is healthy`)
        } else {
          console.warn(`⚠️ ${endpoint} returned ${response.status()}`)
        }
      } catch (error) {
        console.warn(`⚠️ ${endpoint} health check failed:`, error)
      }
    }
    
    // 4. Set up test data directories
    console.log('📁 Setting up test data directories...')
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const testDirs = [
      'test-results-longrunning',
      'test-results-longrunning/screenshots',
      'test-results-longrunning/traces',
      'test-results-longrunning/videos',
      'test-results-longrunning/reports'
    ]
    
    for (const dir of testDirs) {
      try {
        await fs.mkdir(dir, { recursive: true })
        console.log(`✅ Created directory: ${dir}`)
      } catch (error) {
        console.warn(`⚠️ Failed to create directory ${dir}:`, error)
      }
    }
    
    // 5. Log system information for debugging
    console.log('💻 System Information:')
    console.log('  Node Version:', process.version)
    console.log('  Platform:', process.platform)
    console.log('  Architecture:', process.arch)
    console.log('  Memory:', `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`)
    console.log('  Environment:', process.env.NODE_ENV || 'unknown')
    
    // 6. Check environment variables for AI services
    console.log('🔑 Checking AI service configuration...')
    const requiredEnvVars = [
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY', 
      'GOOGLE_APPLICATION_CREDENTIALS'
    ]
    
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar} is configured`)
      } else {
        console.warn(`⚠️ ${envVar} is not configured - some tests may fail`)
      }
    }
    
    // 7. Write setup metadata
    const setupMetadata = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      baseUrl,
      environment: process.env.NODE_ENV || 'test',
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      memoryUsage: process.memoryUsage(),
      aiServicesWarmed: true,
      status: 'completed'
    }
    
    try {
      await fs.writeFile(
        'test-results-longrunning/setup-metadata.json',
        JSON.stringify(setupMetadata, null, 2)
      )
    } catch (error) {
      console.warn('⚠️ Failed to write setup metadata:', error)
    }
    
    // Cleanup
    await browser.close()
    
    const totalDuration = Date.now() - startTime
    console.log(`✅ Global setup completed in ${Math.round(totalDuration / 1000)}s`)
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    
    // Write failure metadata
    try {
      const fs = await import('fs/promises')
      const failureMetadata = {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: error.message,
        status: 'failed'
      }
      
      await fs.mkdir('test-results-longrunning', { recursive: true })
      await fs.writeFile(
        'test-results-longrunning/setup-failure.json',
        JSON.stringify(failureMetadata, null, 2)
      )
    } catch (writeError) {
      console.error('Failed to write failure metadata:', writeError)
    }
    
    throw error
  }
}

export default globalSetup