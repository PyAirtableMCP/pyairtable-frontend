import { Reporter, TestCase, TestResult, TestStep, FullResult } from '@playwright/test/reporter';

/**
 * Custom reporter for long-running tests with detailed insights
 */
class LongRunningReporter implements Reporter {
  private testResults: Array<{
    testName: string;
    duration: number;
    status: string;
    steps: Array<{
      name: string;
      duration: number;
      status: string;
    }>;
    screenshots: string[];
    errors: string[];
  }> = [];

  private startTime: number = 0;

  onBegin() {
    console.log('🚀 Starting Long-Running Test Suite...');
    this.startTime = Date.now();
  }

  onTestBegin(test: TestCase) {
    console.log(`🏃 Starting test: ${test.title}`);
    console.log(`   Location: ${test.location?.file || 'unknown'}`);
    console.log(`   Expected timeout: ${test.timeout}ms`);
  }

  onStepBegin(test: TestCase, result: TestResult, step: TestStep) {
    console.log(`   📋 Step: ${step.title}`);
  }

  onStepEnd(test: TestCase, result: TestResult, step: TestStep) {
    const duration = step.duration || 0;
    const status = step.error ? '❌ FAILED' : '✅ PASSED';
    console.log(`   ${status} Step completed in ${Math.round(duration)}ms: ${step.title}`);
    
    if (step.error) {
      console.log(`      Error: ${step.error.message}`);
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const duration = result.duration;
    const status = result.status;
    
    console.log(`🏁 Test completed: ${test.title}`);
    console.log(`   Status: ${status}`);
    console.log(`   Duration: ${Math.round(duration)}ms (${Math.round(duration / 1000)}s)`);
    console.log(`   Attachments: ${result.attachments?.length || 0}`);

    // Collect screenshots
    const screenshots = (result.attachments || [])
      .filter(a => a.contentType?.startsWith('image/'))
      .map(a => a.path || a.name || 'screenshot');

    // Collect step information
    const steps = (result.steps || []).map(step => ({
      name: step.title,
      duration: step.duration || 0,
      status: step.error ? 'failed' : 'passed'
    }));

    // Collect errors
    const errors = result.errors?.map(e => e.message) || [];

    this.testResults.push({
      testName: test.title,
      duration,
      status,
      steps,
      screenshots,
      errors
    });

    if (result.status === 'failed') {
      console.log(`   ❌ Test failed with ${errors.length} error(s)`);
      errors.forEach(error => console.log(`      • ${error}`));
    } else if (result.status === 'passed') {
      console.log(`   ✅ Test passed successfully`);
    }

    console.log(''); // Empty line for readability
  }

  onEnd(result: FullResult) {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const total = this.testResults.length;

    console.log('');
    console.log('='.repeat(80));
    console.log('📊 LONG-RUNNING TEST SUITE SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Duration: ${Math.round(totalDuration / 1000)}s (${Math.round(totalDuration / 60000)}m)`);
    console.log(`Tests Passed: ${passed}/${total}`);
    console.log(`Tests Failed: ${failed}/${total}`);
    console.log('');

    if (this.testResults.length > 0) {
      console.log('📋 Individual Test Performance:');
      console.log('');
      
      this.testResults.forEach((test, index) => {
        const minutes = Math.round(test.duration / 60000);
        const seconds = Math.round((test.duration % 60000) / 1000);
        const statusIcon = test.status === 'passed' ? '✅' : '❌';
        
        console.log(`${index + 1}. ${statusIcon} ${test.testName}`);
        console.log(`   Duration: ${minutes}m ${seconds}s`);
        console.log(`   Steps: ${test.steps.length} (${test.steps.filter(s => s.status === 'passed').length} passed)`);
        console.log(`   Screenshots: ${test.screenshots.length}`);
        
        if (test.errors.length > 0) {
          console.log(`   Errors: ${test.errors.length}`);
          test.errors.forEach(error => console.log(`     • ${error}`));
        }
        
        // Show longest steps
        const longestSteps = test.steps
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 3);
        
        if (longestSteps.length > 0) {
          console.log(`   Longest steps:`);
          longestSteps.forEach(step => {
            console.log(`     • ${step.name}: ${Math.round(step.duration / 1000)}s`);
          });
        }
        
        console.log('');
      });
    }

    // Performance analysis
    if (this.testResults.length > 0) {
      const avgDuration = this.testResults.reduce((sum, test) => sum + test.duration, 0) / this.testResults.length;
      const longestTest = this.testResults.reduce((max, test) => test.duration > max.duration ? test : max);
      
      console.log('⚡ Performance Insights:');
      console.log(`Average test duration: ${Math.round(avgDuration / 1000)}s`);
      console.log(`Longest test: "${longestTest.testName}" (${Math.round(longestTest.duration / 1000)}s)`);
      
      // Find common slow operations
      const allSteps = this.testResults.flatMap(test => test.steps);
      const stepsByName = allSteps.reduce((acc, step) => {
        if (!acc[step.name]) {
          acc[step.name] = [];
        }
        acc[step.name].push(step.duration);
        return acc;
      }, {} as Record<string, number[]>);
      
      const slowSteps = Object.entries(stepsByName)
        .map(([name, durations]) => ({
          name,
          avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
          count: durations.length
        }))
        .sort((a, b) => b.avgDuration - a.avgDuration)
        .slice(0, 5);
      
      if (slowSteps.length > 0) {
        console.log('');
        console.log('🐌 Slowest operations:');
        slowSteps.forEach((step, index) => {
          console.log(`${index + 1}. ${step.name}: ${Math.round(step.avgDuration / 1000)}s avg (${step.count} times)`);
        });
      }
    }

    console.log('');
    console.log('='.repeat(80));
    
    if (failed > 0) {
      console.log('❌ Some tests failed. Check the detailed logs above for debugging information.');
    } else {
      console.log('🎉 All tests passed successfully!');
    }
    
    console.log('='.repeat(80));
  }
}

export default LongRunningReporter;