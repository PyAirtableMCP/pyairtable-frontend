/**
 * Test Execution Pipeline Architecture
 * 
 * Orchestrates Docker Compose services, frontend server management,
 * parallel test execution, result aggregation, and comprehensive reporting.
 */

import { execSync, spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

export interface TestExecutionConfig {
  environment: 'local' | 'ci' | 'staging';
  parallelism: {
    maxWorkers: number;
    shardCount: number;
    browserInstances: number;
  };
  services: {
    backend: {
      dockerCompose: string;
      healthCheckTimeout: number;
      startupRetries: number;
    };
    frontend: {
      command: string;
      port: number;
      buildCommand?: string;
      healthCheckUrl: string;
    };
  };
  testSuites: TestSuiteConfig[];
  reporting: {
    formats: string[];
    outputDir: string;
    aggregateResults: boolean;
    generateTrends: boolean;
  };
  monitoring: {
    resourceTracking: boolean;
    performanceMetrics: boolean;
    errorTracking: boolean;
  };
}

export interface TestSuiteConfig {
  name: string;
  pattern: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeout: number;
  retries: number;
  dependencies: string[];
  environment: Record<string, string>;
  browsers: string[];
  devices: string[];
  parallel: boolean;
}

export interface ExecutionResult {
  suiteId: string;
  suiteName: string;
  status: 'passed' | 'failed' | 'skipped' | 'timeout';
  duration: number;
  testResults: TestResult[];
  artifacts: Artifact[];
  metrics: ExecutionMetrics;
}

export interface TestResult {
  testId: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  retry: number;
  artifacts: string[];
}

export interface Artifact {
  type: 'screenshot' | 'video' | 'trace' | 'log' | 'report';
  path: string;
  size: number;
  metadata: Record<string, any>;
}

export interface ExecutionMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
  averageTestDuration: number;
  resourceUsage: {
    maxMemory: number;
    maxCPU: number;
    networkTraffic: number;
  };
}

/**
 * Main test execution pipeline orchestrator
 */
export class TestExecutionPipeline extends EventEmitter {
  private config: TestExecutionConfig;
  private runningProcesses: Map<string, ChildProcess> = new Map();
  private serviceHealth: Map<string, boolean> = new Map();
  private executionResults: ExecutionResult[] = [];
  private startTime: number = 0;
  private resourceMonitor?: NodeJS.Timer;

  constructor(config: TestExecutionConfig) {
    super();
    this.config = config;
  }

  /**
   * Execute the complete test pipeline
   */
  async execute(): Promise<ExecutionSummary> {
    console.log('🚀 Starting test execution pipeline...');
    this.startTime = Date.now();

    try {
      // Phase 1: Environment preparation
      await this.prepareEnvironment();

      // Phase 2: Service startup
      await this.startServices();

      // Phase 3: Health checks
      await this.waitForServiceHealth();

      // Phase 4: Test execution
      const results = await this.executeTestSuites();

      // Phase 5: Result aggregation and reporting
      const summary = await this.generateExecutionSummary(results);

      // Phase 6: Cleanup
      await this.cleanup();

      console.log('✅ Test execution pipeline completed successfully');
      return summary;
    } catch (error) {
      console.error('❌ Test execution pipeline failed:', error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Prepare test environment
   */
  private async prepareEnvironment(): Promise<void> {
    console.log('🏗️ Preparing test environment...');

    // Create output directories
    await fs.mkdir(this.config.reporting.outputDir, { recursive: true });
    await fs.mkdir(path.join(this.config.reporting.outputDir, 'artifacts'), { recursive: true });
    await fs.mkdir(path.join(this.config.reporting.outputDir, 'logs'), { recursive: true });

    // Clean previous runs
    await this.cleanPreviousRuns();

    // Setup environment variables
    await this.setupEnvironmentVariables();

    // Initialize monitoring
    if (this.config.monitoring.resourceTracking) {
      this.startResourceMonitoring();
    }

    this.emit('environmentPrepared');
  }

  /**
   * Start all required services
   */
  private async startServices(): Promise<void> {
    console.log('🔧 Starting services...');

    // Start backend services with Docker Compose
    await this.startBackendServices();

    // Build and start frontend service
    await this.startFrontendService();

    this.emit('servicesStarted');
  }

  /**
   * Start backend services using Docker Compose
   */
  private async startBackendServices(): Promise<void> {
    console.log('🐳 Starting backend services with Docker Compose...');

    const dockerComposeFile = this.config.services.backend.dockerCompose;
    
    try {
      // Pull latest images
      execSync(`docker-compose -f ${dockerComposeFile} pull`, {
        stdio: 'pipe',
        timeout: 300000 // 5 minutes
      });

      // Start services
      const dockerProcess = spawn('docker-compose', [
        '-f', dockerComposeFile,
        'up', '--build', '--remove-orphans'
      ], {
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Capture logs
      this.captureProcessLogs(dockerProcess, 'docker-compose');
      
      this.runningProcesses.set('docker-compose', dockerProcess);

      // Wait for services to start
      await this.waitForDockerServices();

      console.log('✅ Backend services started successfully');
    } catch (error) {
      throw new Error(`Failed to start backend services: ${error.message}`);
    }
  }

  /**
   * Start frontend service
   */
  private async startFrontendService(): Promise<void> {
    console.log('⚛️ Starting frontend service...');

    try {
      // Build if needed
      if (this.config.services.frontend.buildCommand) {
        console.log('🔨 Building frontend...');
        execSync(this.config.services.frontend.buildCommand, {
          stdio: 'pipe',
          timeout: 600000 // 10 minutes
        });
      }

      // Start development server
      const frontendProcess = spawn('sh', ['-c', this.config.services.frontend.command], {
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PORT: this.config.services.frontend.port.toString(),
          NODE_ENV: 'test'
        }
      });

      this.captureProcessLogs(frontendProcess, 'frontend');
      this.runningProcesses.set('frontend', frontendProcess);

      // Wait for frontend to be ready
      await this.waitForFrontendReady();

      console.log('✅ Frontend service started successfully');
    } catch (error) {
      throw new Error(`Failed to start frontend service: ${error.message}`);
    }
  }

  /**
   * Wait for all services to be healthy
   */
  private async waitForServiceHealth(): Promise<void> {
    console.log('🏥 Waiting for service health checks...');

    const services = [
      { name: 'postgres', url: 'http://localhost:5432', type: 'database' },
      { name: 'redis', url: 'http://localhost:6379', type: 'cache' },
      { name: 'api-gateway', url: 'http://localhost:8000/health', type: 'http' },
      { name: 'ai-processor', url: 'http://localhost:8001/health', type: 'http' },
      { name: 'airtable-gateway', url: 'http://localhost:8002/health', type: 'http' },
      { name: 'platform-services', url: 'http://localhost:8007/health', type: 'http' },
      { name: 'frontend', url: this.config.services.frontend.healthCheckUrl, type: 'http' }
    ];

    const healthCheckPromises = services.map(service => 
      this.checkServiceHealth(service.name, service.url, service.type)
    );

    await Promise.all(healthCheckPromises);

    console.log('✅ All services are healthy');
    this.emit('servicesHealthy');
  }

  /**
   * Check individual service health
   */
  private async checkServiceHealth(
    serviceName: string, 
    url: string, 
    type: string
  ): Promise<void> {
    const maxAttempts = this.config.services.backend.startupRetries;
    const timeout = this.config.services.backend.healthCheckTimeout;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (type === 'http') {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(url, {
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            this.serviceHealth.set(serviceName, true);
            console.log(`✅ Service healthy: ${serviceName}`);
            return;
          }
        } else if (type === 'database' || type === 'cache') {
          // Use Docker health check status
          const healthOutput = execSync(
            `docker-compose -f ${this.config.services.backend.dockerCompose} ps --services --filter "health=healthy" | grep ${serviceName}`,
            { stdio: 'pipe', encoding: 'utf8' }
          );

          if (healthOutput.trim() === serviceName) {
            this.serviceHealth.set(serviceName, true);
            console.log(`✅ Service healthy: ${serviceName}`);
            return;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Health check attempt ${attempt}/${maxAttempts} failed for ${serviceName}: ${error.message}`);
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    this.serviceHealth.set(serviceName, false);
    throw new Error(`Service health check failed: ${serviceName}`);
  }

  /**
   * Execute all test suites
   */
  private async executeTestSuites(): Promise<ExecutionResult[]> {
    console.log('🧪 Executing test suites...');

    const results: ExecutionResult[] = [];
    const sortedSuites = this.sortTestSuitesByPriority();

    // Execute critical and high priority suites first (sequential)
    const criticalSuites = sortedSuites.filter(s => s.priority === 'critical' || s.priority === 'high');
    for (const suite of criticalSuites) {
      const result = await this.executeSingleTestSuite(suite);
      results.push(result);
      
      // Fail fast for critical tests
      if (suite.priority === 'critical' && result.status === 'failed') {
        throw new Error(`Critical test suite failed: ${suite.name}`);
      }
    }

    // Execute medium and low priority suites in parallel
    const parallelSuites = sortedSuites.filter(s => s.priority === 'medium' || s.priority === 'low');
    if (parallelSuites.length > 0) {
      const parallelResults = await this.executeTestSuitesInParallel(parallelSuites);
      results.push(...parallelResults);
    }

    this.executionResults = results;
    this.emit('testSuitesCompleted', results);

    return results;
  }

  /**
   * Execute test suites in parallel
   */
  private async executeTestSuitesInParallel(suites: TestSuiteConfig[]): Promise<ExecutionResult[]> {
    const chunks = this.chunkSuites(suites, this.config.parallelism.maxWorkers);
    const allResults: ExecutionResult[] = [];

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(suite => this.executeSingleTestSuite(suite));
      const chunkResults = await Promise.allSettled(chunkPromises);

      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          allResults.push(result.value);
        } else {
          console.error('❌ Parallel test suite execution failed:', result.reason);
        }
      }
    }

    return allResults;
  }

  /**
   * Execute a single test suite
   */
  private async executeSingleTestSuite(suite: TestSuiteConfig): Promise<ExecutionResult> {
    console.log(`🎯 Executing test suite: ${suite.name}`);

    const startTime = Date.now();
    let playwrightProcess: ChildProcess;

    try {
      // Build Playwright command
      const command = this.buildPlaywrightCommand(suite);
      
      // Execute tests
      playwrightProcess = spawn('npx', command.split(' ').slice(1), {
        stdio: 'pipe',
        env: {
          ...process.env,
          ...suite.environment
        }
      });

      this.captureProcessLogs(playwrightProcess, `suite-${suite.name}`);

      // Wait for completion
      const exitCode = await this.waitForProcessCompletion(
        playwrightProcess, 
        suite.timeout
      );

      const duration = Date.now() - startTime;

      // Parse results
      const result = await this.parseTestSuiteResults(suite, exitCode, duration);
      
      console.log(`✅ Test suite completed: ${suite.name} (${duration}ms)`);
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error(`❌ Test suite failed: ${suite.name} - ${error.message}`);
      
      return {
        suiteId: suite.name,
        suiteName: suite.name,
        status: 'failed',
        duration,
        testResults: [],
        artifacts: [],
        metrics: this.createEmptyMetrics()
      };
    }
  }

  /**
   * Build Playwright command for test suite
   */
  private buildPlaywrightCommand(suite: TestSuiteConfig): string {
    const parts = [
      'npx playwright test',
      `--config=playwright.config.ts`,
      `--testNamePattern="${suite.pattern}"`,
      `--timeout=${suite.timeout}`,
      `--retries=${suite.retries}`,
      `--output-dir=${this.config.reporting.outputDir}/suite-${suite.name}`,
      `--reporter=json:${this.config.reporting.outputDir}/suite-${suite.name}/results.json`
    ];

    if (suite.parallel) {
      parts.push(`--workers=${this.config.parallelism.maxWorkers}`);
    } else {
      parts.push('--workers=1');
    }

    if (suite.browsers.length > 0) {
      parts.push(`--project=${suite.browsers.join(',')}`);
    }

    return parts.join(' ');
  }

  /**
   * Parse test suite results from Playwright output
   */
  private async parseTestSuiteResults(
    suite: TestSuiteConfig, 
    exitCode: number, 
    duration: number
  ): Promise<ExecutionResult> {
    const resultsFile = path.join(
      this.config.reporting.outputDir, 
      `suite-${suite.name}`, 
      'results.json'
    );

    try {
      const resultsData = await fs.readFile(resultsFile, 'utf8');
      const playwrightResults = JSON.parse(resultsData);

      const testResults: TestResult[] = playwrightResults.suites
        .flatMap((s: any) => s.specs || [])
        .flatMap((spec: any) => spec.tests || [])
        .map((test: any) => ({
          testId: test.id || test.title,
          testName: test.title,
          status: this.mapPlaywrightStatus(test.status),
          duration: test.duration || 0,
          error: test.error?.message,
          retry: test.retry || 0,
          artifacts: this.extractArtifacts(test)
        }));

      const metrics = this.calculateMetrics(testResults, duration);

      return {
        suiteId: suite.name,
        suiteName: suite.name,
        status: exitCode === 0 ? 'passed' : 'failed',
        duration,
        testResults,
        artifacts: await this.collectArtifacts(suite.name),
        metrics
      };
    } catch (error) {
      console.warn(`⚠️ Failed to parse results for ${suite.name}:`, error.message);
      
      return {
        suiteId: suite.name,
        suiteName: suite.name,
        status: exitCode === 0 ? 'passed' : 'failed',
        duration,
        testResults: [],
        artifacts: [],
        metrics: this.createEmptyMetrics()
      };
    }
  }

  /**
   * Generate comprehensive execution summary
   */
  private async generateExecutionSummary(results: ExecutionResult[]): Promise<ExecutionSummary> {
    const totalDuration = Date.now() - this.startTime;
    
    const summary: ExecutionSummary = {
      executionId: `execution-${Date.now()}`,
      timestamp: new Date().toISOString(),
      totalDuration,
      environment: this.config.environment,
      configuration: this.config,
      results,
      aggregateMetrics: this.calculateAggregateMetrics(results),
      artifacts: await this.collectAllArtifacts(),
      trends: this.config.reporting.generateTrends ? await this.generateTrends() : undefined
    };

    // Generate reports
    await this.generateReports(summary);

    this.emit('executionCompleted', summary);
    return summary;
  }

  /**
   * Generate various report formats
   */
  private async generateReports(summary: ExecutionSummary): Promise<void> {
    console.log('📊 Generating test reports...');

    for (const format of this.config.reporting.formats) {
      try {
        switch (format) {
          case 'html':
            await this.generateHTMLReport(summary);
            break;
          case 'json':
            await this.generateJSONReport(summary);
            break;
          case 'junit':
            await this.generateJUnitReport(summary);
            break;
          case 'allure':
            await this.generateAllureReport(summary);
            break;
          default:
            console.warn(`⚠️ Unknown report format: ${format}`);
        }
      } catch (error) {
        console.error(`❌ Failed to generate ${format} report:`, error.message);
      }
    }

    console.log('✅ Test reports generated');
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test execution pipeline...');

    try {
      // Stop resource monitoring
      if (this.resourceMonitor) {
        clearInterval(this.resourceMonitor);
      }

      // Stop all running processes
      for (const [name, process] of this.runningProcesses) {
        console.log(`🛑 Stopping process: ${name}`);
        process.kill('SIGTERM');
        
        // Wait for graceful shutdown, then force kill
        setTimeout(() => {
          if (!process.killed) {
            process.kill('SIGKILL');
          }
        }, 10000);
      }

      // Stop Docker services
      try {
        execSync(`docker-compose -f ${this.config.services.backend.dockerCompose} down -v`, {
          stdio: 'pipe',
          timeout: 60000
        });
      } catch (error) {
        console.warn('⚠️ Failed to stop Docker services:', error.message);
      }

      // Clear process map
      this.runningProcesses.clear();

      console.log('✅ Test execution pipeline cleaned up');
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }

  // Helper methods...
  private sortTestSuitesByPriority(): TestSuiteConfig[] {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...this.config.testSuites].sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  private chunkSuites(suites: TestSuiteConfig[], chunkSize: number): TestSuiteConfig[][] {
    const chunks: TestSuiteConfig[][] = [];
    for (let i = 0; i < suites.length; i += chunkSize) {
      chunks.push(suites.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async cleanPreviousRuns(): Promise<void> {
    // Implementation for cleaning previous test runs
  }

  private async setupEnvironmentVariables(): Promise<void> {
    // Implementation for setting up environment variables
  }

  private startResourceMonitoring(): void {
    // Implementation for resource monitoring
  }

  private captureProcessLogs(process: ChildProcess, name: string): void {
    // Implementation for capturing process logs
  }

  private async waitForDockerServices(): Promise<void> {
    // Implementation for waiting for Docker services
  }

  private async waitForFrontendReady(): Promise<void> {
    // Implementation for waiting for frontend readiness
  }

  private async waitForProcessCompletion(process: ChildProcess, timeout: number): Promise<number> {
    // Implementation for waiting for process completion
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        process.kill('SIGKILL');
        reject(new Error(`Process timed out after ${timeout}ms`));
      }, timeout);

      process.on('exit', (code) => {
        clearTimeout(timeoutId);
        resolve(code || 0);
      });
    });
  }

  private mapPlaywrightStatus(status: string): 'passed' | 'failed' | 'skipped' {
    switch (status) {
      case 'passed': return 'passed';
      case 'failed': return 'failed';
      case 'skipped': return 'skipped';
      default: return 'failed';
    }
  }

  private extractArtifacts(test: any): string[] {
    // Implementation for extracting test artifacts
    return [];
  }

  private calculateMetrics(testResults: TestResult[], duration: number): ExecutionMetrics {
    return {
      totalTests: testResults.length,
      passedTests: testResults.filter(t => t.status === 'passed').length,
      failedTests: testResults.filter(t => t.status === 'failed').length,
      skippedTests: testResults.filter(t => t.status === 'skipped').length,
      totalDuration: duration,
      averageTestDuration: testResults.length > 0 ? duration / testResults.length : 0,
      resourceUsage: {
        maxMemory: 0,
        maxCPU: 0,
        networkTraffic: 0
      }
    };
  }

  private createEmptyMetrics(): ExecutionMetrics {
    return {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalDuration: 0,
      averageTestDuration: 0,
      resourceUsage: {
        maxMemory: 0,
        maxCPU: 0,
        networkTraffic: 0
      }
    };
  }

  private async collectArtifacts(suiteName: string): Promise<Artifact[]> {
    // Implementation for collecting test artifacts
    return [];
  }

  private calculateAggregateMetrics(results: ExecutionResult[]): ExecutionMetrics {
    // Implementation for calculating aggregate metrics
    return this.createEmptyMetrics();
  }

  private async collectAllArtifacts(): Promise<Artifact[]> {
    // Implementation for collecting all artifacts
    return [];
  }

  private async generateTrends(): Promise<any> {
    // Implementation for generating test trends
    return {};
  }

  private async generateHTMLReport(summary: ExecutionSummary): Promise<void> {
    // Implementation for HTML report generation
  }

  private async generateJSONReport(summary: ExecutionSummary): Promise<void> {
    const reportPath = path.join(this.config.reporting.outputDir, 'execution-summary.json');
    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
  }

  private async generateJUnitReport(summary: ExecutionSummary): Promise<void> {
    // Implementation for JUnit report generation
  }

  private async generateAllureReport(summary: ExecutionSummary): Promise<void> {
    // Implementation for Allure report generation
  }
}

export interface ExecutionSummary {
  executionId: string;
  timestamp: string;
  totalDuration: number;
  environment: string;
  configuration: TestExecutionConfig;
  results: ExecutionResult[];
  aggregateMetrics: ExecutionMetrics;
  artifacts: Artifact[];
  trends?: any;
}

/**
 * Default configuration for different environments
 */
export const defaultConfigurations = {
  local: {
    environment: 'local',
    parallelism: {
      maxWorkers: 2,
      shardCount: 1,
      browserInstances: 2
    },
    services: {
      backend: {
        dockerCompose: 'e2e/docker/docker-compose.test.yml',
        healthCheckTimeout: 60000,
        startupRetries: 10
      },
      frontend: {
        command: 'npm run dev',
        port: 3000,
        healthCheckUrl: 'http://localhost:3000'
      }
    },
    reporting: {
      formats: ['html', 'json'],
      outputDir: 'test-results',
      aggregateResults: true,
      generateTrends: false
    },
    monitoring: {
      resourceTracking: true,
      performanceMetrics: true,
      errorTracking: true
    }
  },

  ci: {
    environment: 'ci',
    parallelism: {
      maxWorkers: 4,
      shardCount: 2,
      browserInstances: 4
    },
    services: {
      backend: {
        dockerCompose: 'e2e/docker/docker-compose.test.yml',
        healthCheckTimeout: 120000,
        startupRetries: 15
      },
      frontend: {
        command: 'npm run build && npm run start',
        port: 3000,
        buildCommand: 'npm run build',
        healthCheckUrl: 'http://localhost:3000'
      }
    },
    reporting: {
      formats: ['html', 'json', 'junit', 'allure'],
      outputDir: 'test-results',
      aggregateResults: true,
      generateTrends: true
    },
    monitoring: {
      resourceTracking: true,
      performanceMetrics: true,
      errorTracking: true
    }
  }
} as const;