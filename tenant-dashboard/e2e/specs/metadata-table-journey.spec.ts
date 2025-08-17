import { test, expect } from '@playwright/test'
import { AuthHelpers } from '../helpers/auth-helpers'
import { GeminiWorkspaceHelpers } from '../helpers/gemini-helpers'
import { LongRunningTestHelpers } from '../helpers/long-running-helpers'
import { MetadataTableJourney } from '../journeys/MetadataTableJourney'
import { generateUniqueTestUser } from '../fixtures/test-users'

test.describe('Metadata Table Creation and Management Journey', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for this complex test suite
    test.setTimeout(600000) // 10 minutes
  })

  test('should complete full metadata table workflow with Gemini integration', async ({ page }) => {
    // Generate unique user for this journey
    const testUser = generateUniqueTestUser('metadata-journey')
    const sessionInfo = {
      testName: 'metadata-table-journey',
      startTime: Date.now(),
      screenshotsTaken: [] as string[],
      errors: [] as Error[]
    }
    
    try {
      
      test.step('User Authentication and Setup', async () => {
        console.log('🔐 Setting up authenticated user...')
        
        await AuthHelpers.registerUser(page, testUser)
        await page.goto('/chat')
        await AuthHelpers.verifyAuthenticated(page)
        
        // Capture initial state
        const screenshot = await LongRunningTestHelpers.captureProgressScreenshots(
          page, 
          'initial-authenticated-state'
        )
        sessionInfo.screenshotsTaken.push(screenshot)
        
        console.log('✅ User authenticated and ready')
      })

      test.step('Validate Google Workspace Integration', async () => {
        console.log('🔗 Validating Google Workspace integration...')
        
        const integrationStatus = await GeminiWorkspaceHelpers.validateWorkspaceIntegration(page)
        
        expect(integrationStatus.overallStatus).toMatch(/connected|partial/)
        
        if (integrationStatus.overallStatus === 'partial') {
          console.log('⚠️ Partial integration detected, continuing with available features')
        }
        
        console.log('✅ Google Workspace integration validated')
      })

      test.step('Execute Complete Metadata Table Journey', async () => {
        console.log('🚀 Starting complete metadata table journey...')
        
        const journey = new MetadataTableJourney(page)
        
        // Execute with performance monitoring
        const { result: journeyResult, metrics } = await LongRunningTestHelpers.measurePerformance(
          () => journey.executeCompleteJourney(),
          'Complete Metadata Table Journey'
        )
        
        // Validate journey success
        expect(journeyResult.success).toBe(true)
        expect(journeyResult.metadataTableId).toBeTruthy()
        expect(journeyResult.analyzedTables.length).toBeGreaterThan(0)
        
        // Log results
        console.log('🎉 Journey completed successfully:', {
          metadataTableId: journeyResult.metadataTableId,
          tablesAnalyzed: journeyResult.analyzedTables.length,
          googleSheetCreated: !!journeyResult.googleSheetUrl,
          duration: `${Math.round(metrics.duration / 1000)}s`,
          memoryUsed: `${Math.round((metrics.memoryUsage?.heapUsed || 0) / 1024 / 1024)}MB`
        })
        
        // Capture success state
        const successScreenshot = await LongRunningTestHelpers.captureProgressScreenshots(
          page,
          'journey-success'
        )
        sessionInfo.screenshotsTaken.push(successScreenshot)
      })

      test.step('Verify Metadata Table Quality', async () => {
        console.log('🔍 Verifying metadata table quality...')
        
        // Request summary of created metadata table
        await page.getByPlaceholder(/ask anything about your data/i)
          .fill('Please provide a summary of the metadata table we just created. Include record count, column details, and data quality assessment.')
        
        await page.keyboard.press('Enter')
        
        // Wait for comprehensive response
        await LongRunningTestHelpers.waitForAIProcessing(page, 60000)
        
        // Verify quality response
        const qualityVerified = await GeminiWorkspaceHelpers.verifyAIResponseQuality(page, [
          'metadata table',
          'records',
          'columns',
          'improvements',
          'quality'
        ])
        
        expect(qualityVerified).toBe(true)
        
        console.log('✅ Metadata table quality verified')
      })

      test.step('Test Advanced Gemini Features', async () => {
        console.log('🤖 Testing advanced Gemini features...')
        
        // Test complex analytical query
        const complexQuery = `Based on the metadata table and improvements we've identified, please:
        1. Prioritize the top 3 most critical improvements
        2. Create a implementation timeline with dependencies
        3. Estimate the impact of each improvement on data quality and performance
        4. Generate a executive summary for stakeholders
        5. Suggest automation opportunities to maintain data quality going forward`
        
        await page.getByPlaceholder(/ask anything about your data/i).fill(complexQuery)
        await page.keyboard.press('Enter')
        
        // Monitor network activity during this complex operation
        const networkActivity = await LongRunningTestHelpers.monitorNetworkActivity(
          page,
          'Complex Analytical Query',
          async () => {
            await LongRunningTestHelpers.waitForAIProcessing(page, 240000) // 4 minutes for complex analysis
          }
        )
        
        // Validate response quality
        const advancedResponseQuality = await GeminiWorkspaceHelpers.verifyAIResponseQuality(page, [
          'prioritize',
          'implementation',
          'timeline',
          'impact',
          'executive summary',
          'automation'
        ])
        
        expect(advancedResponseQuality).toBe(true)
        expect(networkActivity.failedRequests.length).toBe(0)
        
        console.log('✅ Advanced Gemini features working correctly')
      })

      test.step('Test Error Recovery and Resilience', async () => {
        console.log('🛡️ Testing error recovery...')
        
        // Simulate network interruption
        await page.route('**/api/chat/**', route => route.abort())
        
        const errorQuery = 'This should fail due to network interruption'
        await page.getByPlaceholder(/ask anything about your data/i).fill(errorQuery)
        await page.keyboard.press('Enter')
        
        // Wait for error state
        await page.waitForTimeout(5000)
        
        // Test error recovery
        const recoverySuccessful = await LongRunningTestHelpers.handleErrorWithRecovery(
          page,
          new Error('Network interruption test'),
          [
            {
              name: 'Restore network connection',
              action: async () => {
                await page.unroute('**/api/chat/**')
                await page.waitForTimeout(2000)
              }
            },
            {
              name: 'Retry failed operation',
              action: async () => {
                await page.getByPlaceholder(/ask anything about your data/i)
                  .fill('Testing recovery - please confirm you can process this request')
                await page.keyboard.press('Enter')
                await LongRunningTestHelpers.waitForAIProcessing(page, 30000)
              }
            }
          ]
        )
        
        expect(recoverySuccessful).toBe(true)
        
        console.log('✅ Error recovery successful')
      })

      test.step('Performance and Load Testing', async () => {
        console.log('⚡ Testing performance with multiple concurrent requests...')
        
        // Test rapid successive queries (simulating power user behavior)
        const rapidQueries = [
          'Quick status check of metadata table',
          'Count total records in all analyzed tables', 
          'Show improvement completion percentage',
          'Generate brief quality score summary'
        ]
        
        const startTime = Date.now()
        
        // Send all queries rapidly
        for (let i = 0; i < rapidQueries.length; i++) {
          await page.getByPlaceholder(/ask anything about your data/i).fill(rapidQueries[i])
          await page.keyboard.press('Enter')
          
          if (i < rapidQueries.length - 1) {
            await page.waitForTimeout(1000) // Brief pause between queries
          }
        }
        
        // Wait for all responses
        await LongRunningTestHelpers.waitForAIProcessing(page, 120000)
        
        const totalTime = Date.now() - startTime
        const averageTimePerQuery = totalTime / rapidQueries.length
        
        // Performance assertions
        expect(totalTime).toBeLessThan(180000) // All queries should complete within 3 minutes
        expect(averageTimePerQuery).toBeLessThan(45000) // Average query should be under 45 seconds
        
        console.log('✅ Performance testing completed:', {
          totalTime: `${Math.round(totalTime/1000)}s`,
          averagePerQuery: `${Math.round(averageTimePerQuery/1000)}s`,
          queriesProcessed: rapidQueries.length
        })
      })

      test.step('Mobile Responsiveness Testing', async () => {
        console.log('📱 Testing mobile responsiveness...')
        
        // Test mobile viewport
        await page.setViewportSize({ width: 375, height: 667 })
        await page.waitForTimeout(1000)
        
        // Verify chat interface still works
        await expect(page.getByPlaceholder(/ask anything about your data/i)).toBeVisible()
        
        // Test mobile query
        await page.getByPlaceholder(/ask anything about your data/i)
          .fill('Mobile test - summarize our metadata journey progress')
        
        await page.keyboard.press('Enter')
        await LongRunningTestHelpers.waitForAIProcessing(page, 60000)
        
        // Capture mobile screenshot
        const mobileScreenshot = await LongRunningTestHelpers.captureProgressScreenshots(
          page,
          'mobile-responsive-test'
        )
        sessionInfo.screenshotsTaken.push(mobileScreenshot)
        
        // Reset to desktop
        await page.setViewportSize({ width: 1920, height: 1080 })
        
        console.log('✅ Mobile responsiveness verified')
      })

    } catch (error) {
      console.error('❌ Test failed:', error)
      sessionInfo.errors.push(error instanceof Error ? error : new Error(String(error)))
      
      // Capture failure state
      const errorScreenshot = await LongRunningTestHelpers.captureProgressScreenshots(
        page,
        'test-failure'
      )
      sessionInfo.screenshotsTaken.push(errorScreenshot)
      
      throw error
      
    } finally {
      // Cleanup test session
      await LongRunningTestHelpers.cleanupTestSession(page, sessionInfo)
    }
  })

  test('should handle individual journey steps independently', async ({ page }) => {
    const testUser = generateUniqueTestUser('individual-steps')
    
    test.step('Setup', async () => {
      await AuthHelpers.registerUser(page, testUser)
      await page.goto('/chat')
    })

    test.step('Test Metadata Table Creation Only', async () => {
      const journey = new MetadataTableJourney(page)
      
      const tableId = await LongRunningTestHelpers.withRetryAndTimeout(
        () => journey.createMetadataTable('Individual Test Table'),
        {
          maxRetries: 3,
          timeoutMs: 120000,
          description: 'Metadata table creation'
        }
      )
      
      expect(tableId).toBeTruthy()
      console.log('✅ Individual table creation test passed')
    })
  })

  test('should recover from partial failures', async ({ page }) => {
    const testUser = generateUniqueTestUser('recovery-test')
    
    test.step('Setup', async () => {
      await AuthHelpers.registerUser(page, testUser)
      await page.goto('/chat')
    })

    test.step('Test Recovery from Partial Journey Failure', async () => {
      const journey = new MetadataTableJourney(page)
      
      // Start journey
      const tableId = await journey.createMetadataTable('Recovery Test Table')
      expect(tableId).toBeTruthy()
      
      // Simulate failure during analysis
      await page.route('**/api/chat/**', route => {
        // Allow some requests through, fail others randomly
        if (Math.random() > 0.7) {
          route.abort()
        } else {
          route.continue()
        }
      })
      
      // Attempt analysis with potential failures
      try {
        await journey.describeExistingTables()
      } catch (error) {
        console.log('Expected failure occurred during analysis phase')
      }
      
      // Restore connection
      await page.unroute('**/api/chat/**')
      
      // Continue with remaining steps
      await journey.addImprovementColumn(tableId)
      
      console.log('✅ Recovery from partial failure successful')
    })
  })
})