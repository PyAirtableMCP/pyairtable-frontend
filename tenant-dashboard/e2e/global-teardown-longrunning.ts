import { FullConfig } from '@playwright/test'

/**
 * Global Teardown for Long-Running Journey Tests
 * Cleans up resources and generates comprehensive test reports
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for long-running tests...')
  
  const startTime = Date.now()
  
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    // 1. Collect test execution statistics
    console.log('📊 Collecting test execution statistics...')
    
    const resultsDir = 'test-results-longrunning'
    let testStats = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalDuration: 0,
      averageDuration: 0,
      longestTest: 0,
      shortestTest: Infinity,
      screenshotCount: 0,
      videoCount: 0,
      traceCount: 0
    }
    
    try {
      // Read test results JSON if available
      const resultsPath = path.join(resultsDir, 'results.json')
      const resultsData = await fs.readFile(resultsPath, 'utf8')
      const results = JSON.parse(resultsData)
      
      if (results.suites) {
        for (const suite of results.suites) {
          for (const spec of suite.specs || []) {
            testStats.totalTests++
            
            for (const test of spec.tests || []) {
              const duration = test.results?.[0]?.duration || 0
              testStats.totalDuration += duration
              
              if (duration > testStats.longestTest) testStats.longestTest = duration
              if (duration < testStats.shortestTest) testStats.shortestTest = duration
              
              const status = test.results?.[0]?.status
              switch (status) {
                case 'passed': testStats.passedTests++; break
                case 'failed': testStats.failedTests++; break
                case 'skipped': testStats.skippedTests++; break
              }
            }
          }
        }
      }
      
      testStats.averageDuration = testStats.totalTests > 0 
        ? testStats.totalDuration / testStats.totalTests 
        : 0
        
      if (testStats.shortestTest === Infinity) testStats.shortestTest = 0
      
    } catch (error) {
      console.warn('⚠️ Could not read test results for statistics:', error)
    }
    
    // 2. Count generated assets
    console.log('📁 Counting generated test assets...')
    
    try {
      const files = await fs.readdir(resultsDir, { recursive: true })
      
      for (const file of files as string[]) {
        const filePath = file.toString()
        if (filePath.endsWith('.png') || filePath.endsWith('.jpg')) {
          testStats.screenshotCount++
        } else if (filePath.endsWith('.webm') || filePath.endsWith('.mp4')) {
          testStats.videoCount++
        } else if (filePath.endsWith('.zip') && filePath.includes('trace')) {
          testStats.traceCount++
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not count test assets:', error)
    }
    
    // 3. Calculate disk usage
    console.log('💾 Calculating disk usage...')
    
    let totalSize = 0
    try {
      const calculateSize = async (dirPath: string): Promise<number> => {
        let size = 0
        const files = await fs.readdir(dirPath, { withFileTypes: true })
        
        for (const file of files) {
          const filePath = path.join(dirPath, file.name)
          if (file.isDirectory()) {
            size += await calculateSize(filePath)
          } else {
            const stats = await fs.stat(filePath)
            size += stats.size
          }
        }
        return size
      }
      
      totalSize = await calculateSize(resultsDir)
    } catch (error) {
      console.warn('⚠️ Could not calculate disk usage:', error)
    }
    
    // 4. Generate comprehensive teardown report
    console.log('📋 Generating teardown report...')
    
    const teardownReport = {
      timestamp: new Date().toISOString(),
      teardownDuration: Date.now() - startTime,
      testExecutionStats: {
        ...testStats,
        totalDuration: `${Math.round(testStats.totalDuration / 1000)}s`,
        averageDuration: `${Math.round(testStats.averageDuration / 1000)}s`,
        longestTest: `${Math.round(testStats.longestTest / 1000)}s`,
        shortestTest: `${Math.round(testStats.shortestTest / 1000)}s`
      },
      assetsSummary: {
        screenshots: testStats.screenshotCount,
        videos: testStats.videoCount,
        traces: testStats.traceCount,
        totalSizeMB: Math.round(totalSize / 1024 / 1024)
      },
      systemInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      },
      recommendations: []
    }
    
    // 5. Generate recommendations based on test results
    console.log('💡 Generating performance recommendations...')
    
    if (testStats.averageDuration > 300000) { // > 5 minutes
      teardownReport.recommendations.push('Consider optimizing AI request timeouts - average test duration is high')
    }
    
    if (testStats.failedTests > 0) {
      teardownReport.recommendations.push(`${testStats.failedTests} tests failed - check error patterns for AI service reliability issues`)
    }
    
    if (totalSize > 1024 * 1024 * 1024) { // > 1GB
      teardownReport.recommendations.push('Test assets are using significant disk space - consider cleanup strategies')
    }
    
    if (testStats.screenshotCount > testStats.totalTests * 5) {
      teardownReport.recommendations.push('High screenshot count - consider reducing debug screenshots in passing tests')
    }
    
    // 6. Write teardown report
    try {
      await fs.writeFile(
        path.join(resultsDir, 'teardown-report.json'),
        JSON.stringify(teardownReport, null, 2)
      )
      console.log('✅ Teardown report written')
    } catch (error) {
      console.error('❌ Failed to write teardown report:', error)
    }
    
    // 7. Generate human-readable summary
    console.log('📝 Generating human-readable summary...')
    
    const summary = `
# Long-Running Test Execution Summary

## Test Results
- **Total Tests**: ${testStats.totalTests}
- **Passed**: ${testStats.passedTests}
- **Failed**: ${testStats.failedTests} 
- **Skipped**: ${testStats.skippedTests}
- **Success Rate**: ${testStats.totalTests > 0 ? Math.round((testStats.passedTests / testStats.totalTests) * 100) : 0}%

## Performance Metrics
- **Total Execution Time**: ${Math.round(testStats.totalDuration / 1000)}s (${Math.round(testStats.totalDuration / 60000)}m)
- **Average Test Duration**: ${Math.round(testStats.averageDuration / 1000)}s
- **Longest Test**: ${Math.round(testStats.longestTest / 1000)}s
- **Shortest Test**: ${Math.round(testStats.shortestTest / 1000)}s

## Generated Assets
- **Screenshots**: ${testStats.screenshotCount}
- **Videos**: ${testStats.videoCount} 
- **Traces**: ${testStats.traceCount}
- **Total Size**: ${Math.round(totalSize / 1024 / 1024)}MB

## Recommendations
${teardownReport.recommendations.map(rec => `- ${rec}`).join('\n')}

---
Generated: ${new Date().toISOString()}
Platform: ${process.platform}
Node: ${process.version}
    `
    
    try {
      await fs.writeFile(
        path.join(resultsDir, 'SUMMARY.md'),
        summary.trim()
      )
      console.log('✅ Human-readable summary written')
    } catch (error) {
      console.error('❌ Failed to write summary:', error)
    }
    
    // 8. Clean up old assets if requested
    if (process.env.CLEANUP_OLD_ASSETS === 'true') {
      console.log('🗑️ Cleaning up old test assets...')
      
      try {
        // Keep only last 10 test runs worth of assets
        const assetDirs = await fs.readdir(resultsDir)
        const timestampDirs = assetDirs.filter(dir => 
          /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/.test(dir)
        ).sort().slice(0, -10)
        
        for (const dir of timestampDirs) {
          await fs.rmdir(path.join(resultsDir, dir), { recursive: true })
          console.log(`🗑️ Cleaned up old assets: ${dir}`)
        }
      } catch (error) {
        console.warn('⚠️ Asset cleanup failed:', error)
      }
    }
    
    // 9. Display final summary
    const teardownDuration = Date.now() - startTime
    console.log('')
    console.log('📊 TEARDOWN COMPLETE')
    console.log('=' .repeat(50))
    console.log(`Tests Run: ${testStats.totalTests}`)
    console.log(`Passed: ${testStats.passedTests} | Failed: ${testStats.failedTests} | Skipped: ${testStats.skippedTests}`)
    console.log(`Total Duration: ${Math.round(testStats.totalDuration / 60000)}m ${Math.round((testStats.totalDuration % 60000) / 1000)}s`)
    console.log(`Assets Generated: ${testStats.screenshotCount + testStats.videoCount + testStats.traceCount} files (${Math.round(totalSize / 1024 / 1024)}MB)`)
    console.log(`Teardown Duration: ${Math.round(teardownDuration / 1000)}s`)
    console.log('')
    
    if (teardownReport.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:')
      teardownReport.recommendations.forEach(rec => console.log(`  • ${rec}`))
      console.log('')
    }
    
    console.log(`📋 Detailed reports available in: ${resultsDir}/`)
    console.log('✅ Global teardown completed successfully')
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    
    // Still try to write error info
    try {
      const fs = await import('fs/promises')
      const errorInfo = {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime
      }
      
      await fs.mkdir('test-results-longrunning', { recursive: true })
      await fs.writeFile(
        'test-results-longrunning/teardown-error.json',
        JSON.stringify(errorInfo, null, 2)
      )
    } catch (writeError) {
      console.error('Failed to write teardown error:', writeError)
    }
  }
}

export default globalTeardown