import { Page, expect } from '@playwright/test'

/**
 * Long-Running Test Helpers
 * Specialized utilities for handling complex, time-intensive test scenarios
 */
export class LongRunningTestHelpers {
  
  /**
   * Enhanced retry mechanism with exponential backoff and detailed logging
   */
  static async withRetryAndTimeout<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number
      timeoutMs?: number
      backoffMs?: number
      description?: string
      onRetry?: (attempt: number, error: Error) => void
    } = {}
  ): Promise<T> {
    
    const {
      maxRetries = 3,
      timeoutMs = 120000,
      backoffMs = 2000,
      description = 'Operation',
      onRetry
    } = options
    
    console.log(`🔄 Starting ${description} with ${maxRetries} retries, ${timeoutMs}ms timeout`)
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`⏳ Attempt ${attempt}/${maxRetries}...`)
        
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`${description} timed out after ${timeoutMs}ms`)), timeoutMs)
          )
        ])
        
        console.log(`✅ ${description} succeeded on attempt ${attempt}`)
        return result
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.log(`❌ Attempt ${attempt} failed: ${errorMessage}`)
        
        if (onRetry) {
          onRetry(attempt, error instanceof Error ? error : new Error(String(error)))
        }
        
        if (attempt === maxRetries) {
          console.error(`💥 ${description} failed after ${maxRetries} attempts`)
          throw new Error(`${description} failed after ${maxRetries} attempts. Last error: ${errorMessage}`)
        }
        
        // Exponential backoff
        const waitTime = backoffMs * Math.pow(2, attempt - 1)
        console.log(`⏸️ Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
    
    throw new Error(`${description} failed unexpectedly`)
  }

  /**
   * Advanced AI processing waiter with progress tracking and health checks
   */
  static async waitForAIProcessing(
    page: Page, 
    maxWaitMs: number = 180000,
    options: {
      progressCallback?: (elapsed: number) => void
      healthCheckInterval?: number
      expectedMinProcessingTime?: number
    } = {}
  ): Promise<void> {
    
    const {
      progressCallback,
      healthCheckInterval = 10000,
      expectedMinProcessingTime = 2000
    } = options
    
    console.log(`🤖 Waiting for AI processing (max ${Math.round(maxWaitMs/1000)}s)...`)
    
    const startTime = Date.now()
    let lastHealthCheck = startTime
    let healthCheckCount = 0
    
    // Define all possible AI processing indicators
    const processingIndicators = [
      '.ai-thinking',
      '.processing-indicator',
      '.loading-spinner',
      '.ai-response-loading',
      '[data-testid="ai-processing"]',
      '.thinking-dots',
      '.ai-typing',
      '.response-generating'
    ]
    
    // Wait for processing to start (with minimum expected time)
    let processingStarted = false
    
    for (let i = 0; i < 10; i++) { // Check for 10 seconds
      for (const indicator of processingIndicators) {
        try {
          if (await page.locator(indicator).isVisible({ timeout: 1000 })) {
            processingStarted = true
            console.log('🔄 AI processing detected...')
            break
          }
        } catch (error) {
          // Continue checking
        }
      }
      
      if (processingStarted) break
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // If we don't see processing indicators, still wait minimum time
    if (!processingStarted) {
      console.log('⚠️ No processing indicators found, waiting minimum time...')
      await new Promise(resolve => setTimeout(resolve, expectedMinProcessingTime))
    }
    
    // Main processing wait loop
    const endTime = startTime + maxWaitMs
    
    while (Date.now() < endTime) {
      const elapsed = Date.now() - startTime
      
      // Progress callback
      if (progressCallback) {
        progressCallback(elapsed)
      }
      
      // Health check - ensure page is still responsive
      if (elapsed - lastHealthCheck > healthCheckInterval) {
        try {
          await page.locator('body').isVisible({ timeout: 2000 })
          healthCheckCount++
          lastHealthCheck = elapsed
          console.log(`💓 Health check ${healthCheckCount} passed (${Math.round(elapsed/1000)}s elapsed)`)
        } catch (error) {
          console.warn('⚠️ Page health check failed, but continuing...')
        }
      }
      
      // Check if processing is complete
      let processingComplete = true
      for (const indicator of processingIndicators) {
        try {
          if (await page.locator(indicator).isVisible({ timeout: 500 })) {
            processingComplete = false
            break
          }
        } catch (error) {
          // Indicator not visible, which is good
        }
      }
      
      // Also check for new AI response
      try {
        const latestResponse = page.locator('.ai-response').last()
        const responseVisible = await latestResponse.isVisible({ timeout: 1000 })
        
        if (responseVisible && processingComplete) {
          const finalElapsed = Date.now() - startTime
          console.log(`✅ AI processing completed in ${Math.round(finalElapsed/1000)}s`)
          
          // Give a brief moment for final rendering
          await new Promise(resolve => setTimeout(resolve, 1000))
          return
        }
      } catch (error) {
        // Continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // Timeout reached
    const finalElapsed = Date.now() - startTime
    console.error(`⏰ AI processing timeout after ${Math.round(finalElapsed/1000)}s`)
    
    // Try to capture what's happening
    await this.captureProgressScreenshots(page, 'ai-processing-timeout')
    
    throw new Error(`AI processing timed out after ${Math.round(maxWaitMs/1000)}s`)
  }

  /**
   * Smart screenshot capture with metadata
   */
  static async captureProgressScreenshots(
    page: Page, 
    testName: string,
    options: {
      fullPage?: boolean
      includeMetadata?: boolean
      timestamp?: boolean
    } = {}
  ): Promise<string> {
    
    const {
      fullPage = true,
      includeMetadata = true,
      timestamp = true
    } = options
    
    const now = new Date()
    const timestampStr = timestamp 
      ? `-${now.getFullYear()}${String(now.getMonth()+1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
      : ''
    
    const filename = `test-results/${testName}${timestampStr}.png`
    
    try {
      await page.screenshot({ 
        path: filename,
        fullPage 
      })
      
      if (includeMetadata) {
        // Capture page metadata
        const metadata = await page.evaluate(() => ({
          url: window.location.href,
          title: document.title,
          timestamp: new Date().toISOString(),
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          userAgent: navigator.userAgent
        }))
        
        console.log(`📸 Screenshot captured: ${filename}`, metadata)
      } else {
        console.log(`📸 Screenshot captured: ${filename}`)
      }
      
      return filename
      
    } catch (error) {
      console.error(`❌ Failed to capture screenshot: ${error}`)
      return ''
    }
  }

  /**
   * Monitor network activity during long operations
   */
  static async monitorNetworkActivity(
    page: Page, 
    operationName: string,
    callback: () => Promise<void>
  ): Promise<{
    requestCount: number
    failedRequests: string[]
    slowRequests: Array<{url: string, duration: number}>
    totalDuration: number
  }> {
    
    console.log(`🌐 Starting network monitoring for: ${operationName}`)
    
    const startTime = Date.now()
    const requests: Array<{url: string, startTime: number, endTime?: number, failed?: boolean}> = []
    const failedRequests: string[] = []
    const slowRequests: Array<{url: string, duration: number}> = []
    
    // Track requests
    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        startTime: Date.now()
      })
    })
    
    page.on('requestfinished', (request) => {
      const req = requests.find(r => r.url === request.url() && !r.endTime)
      if (req) {
        req.endTime = Date.now()
        const duration = req.endTime - req.startTime
        
        if (duration > 10000) { // Slow request > 10s
          slowRequests.push({ url: request.url(), duration })
        }
      }
    })
    
    page.on('requestfailed', (request) => {
      const url = request.url()
      failedRequests.push(url)
      console.warn(`❌ Request failed: ${url}`)
      
      const req = requests.find(r => r.url === url && !r.failed)
      if (req) {
        req.failed = true
        req.endTime = Date.now()
      }
    })
    
    // Execute the operation
    await callback()
    
    const totalDuration = Date.now() - startTime
    
    console.log(`🌐 Network monitoring complete for ${operationName}:`, {
      requestCount: requests.length,
      failedRequests: failedRequests.length,
      slowRequests: slowRequests.length,
      totalDuration: `${Math.round(totalDuration/1000)}s`
    })
    
    return {
      requestCount: requests.length,
      failedRequests,
      slowRequests,
      totalDuration
    }
  }

  /**
   * Advanced error recovery with context preservation
   */
  static async handleErrorWithRecovery(
    page: Page,
    error: Error,
    recoveryActions: Array<{
      name: string
      action: () => Promise<void>
      condition?: () => Promise<boolean>
    }>
  ): Promise<boolean> {
    
    console.log(`🚨 Error occurred: ${error.message}`)
    console.log('🔧 Attempting recovery...')
    
    // Capture error state
    await this.captureProgressScreenshots(page, 'error-state')
    
    // Try recovery actions in order
    for (const recovery of recoveryActions) {
      try {
        console.log(`🔄 Trying recovery: ${recovery.name}`)
        
        // Check condition if provided
        if (recovery.condition) {
          const shouldTry = await recovery.condition()
          if (!shouldTry) {
            console.log(`⏭️ Skipping ${recovery.name} - condition not met`)
            continue
          }
        }
        
        await recovery.action()
        
        // Brief wait for recovery to take effect
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        console.log(`✅ Recovery successful: ${recovery.name}`)
        return true
        
      } catch (recoveryError) {
        console.log(`❌ Recovery failed: ${recovery.name} - ${recoveryError}`)
      }
    }
    
    console.error('💥 All recovery attempts failed')
    return false
  }

  /**
   * Performance monitoring during test execution
   */
  static async measurePerformance<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<{
    result: T
    metrics: {
      duration: number
      memoryUsage?: any
      cpuUsage?: number
    }
  }> {
    
    console.log(`⚡ Starting performance measurement: ${operationName}`)
    
    const startTime = Date.now()
    const startMemory = process.memoryUsage()
    
    try {
      const result = await operation()
      
      const endTime = Date.now()
      const endMemory = process.memoryUsage()
      const duration = endTime - startTime
      
      const metrics = {
        duration,
        memoryUsage: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          external: endMemory.external - startMemory.external
        }
      }
      
      console.log(`⚡ Performance metrics for ${operationName}:`, {
        duration: `${Math.round(duration/1000)}s`,
        memoryDelta: `${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`
      })
      
      return { result, metrics }
      
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`⚡ Performance measurement failed after ${Math.round(duration/1000)}s:`, error)
      throw error
    }
  }

  /**
   * Comprehensive test session cleanup
   */
  static async cleanupTestSession(
    page: Page,
    sessionInfo: {
      testName: string
      startTime: number
      screenshotsTaken: string[]
      errors: Error[]
    }
  ): Promise<void> {
    
    console.log(`🧹 Cleaning up test session: ${sessionInfo.testName}`)
    
    const duration = Date.now() - sessionInfo.startTime
    
    try {
      // Final screenshot
      const finalScreenshot = await this.captureProgressScreenshots(
        page, 
        `${sessionInfo.testName}-final`
      )
      
      // Clear any modal dialogs or overlays
      await page.keyboard.press('Escape')
      await page.keyboard.press('Escape')
      
      // Navigate to safe state
      await page.goto('/chat')
      await page.waitForLoadState('networkidle')
      
      // Clear local storage and session storage
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })
      
      console.log(`✅ Test session cleanup complete: ${sessionInfo.testName}`, {
        duration: `${Math.round(duration/1000)}s`,
        screenshots: sessionInfo.screenshotsTaken.length,
        errors: sessionInfo.errors.length
      })
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error)
    }
  }
}