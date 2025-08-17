/**
 * E2E Testing Environment Architecture
 * 
 * This module defines the complete testing environment that integrates:
 * - Backend Services (API Gateway 8000, AI Processing 8001, Airtable Gateway 8002, Platform Services 8007)
 * - Test Data Management (PostgreSQL, Redis, Airtable sandbox)
 * - Long-running process support (WebSocket, progress tracking, health monitoring)
 * - Gemini integration points
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import WebSocket from 'ws';

export interface ServiceConfig {
  name: string;
  port: number;
  healthEndpoint: string;
  timeout: number;
  retries: number;
  dependencies?: string[];
}

export interface TestEnvironmentConfig {
  services: ServiceConfig[];
  databases: {
    postgres: {
      url: string;
      testDb: string;
    };
    redis: {
      url: string;
      testKeyPrefix: string;
    };
  };
  airtable: {
    sandboxBaseId: string;
    apiKey: string;
    testTablePrefix: string;
  };
  gemini: {
    apiKey: string;
    projectId: string;
    testBudgetLimit: number;
  };
  monitoring: {
    healthCheckInterval: number;
    progressTrackingTimeout: number;
    resourceMonitoringEnabled: boolean;
  };
}

export class TestEnvironmentManager {
  private config: TestEnvironmentConfig;
  private prisma: PrismaClient;
  private redis: Redis;
  private runningServices: Map<string, any> = new Map();
  private webSocketConnections: Map<string, WebSocket> = new Map();

  constructor(config: TestEnvironmentConfig) {
    this.config = config;
    this.prisma = new PrismaClient({
      datasources: { db: { url: config.databases.postgres.url } }
    });
    this.redis = new Redis(config.databases.redis.url);
  }

  /**
   * Complete environment setup orchestration
   */
  async setup(): Promise<void> {
    console.log('🚀 Initializing E2E Test Environment...');
    
    try {
      // Phase 1: Infrastructure setup
      await this.setupInfrastructure();
      
      // Phase 2: Service dependency resolution and startup
      await this.startServicesInOrder();
      
      // Phase 3: Test data preparation
      await this.setupTestData();
      
      // Phase 4: Health checks and warmup
      await this.performHealthChecks();
      await this.warmupServices();
      
      // Phase 5: Monitoring initialization
      await this.initializeMonitoring();
      
      console.log('✅ E2E Test Environment ready');
    } catch (error) {
      console.error('❌ Environment setup failed:', error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Infrastructure setup (Docker containers, databases)
   */
  private async setupInfrastructure(): Promise<void> {
    console.log('🏗️ Setting up infrastructure...');
    
    // Start Docker Compose services
    execSync('docker-compose -f e2e/docker/docker-compose.test.yml up -d postgres redis', {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    // Wait for databases to be ready
    await this.waitForDatabase('postgres', this.config.databases.postgres.url, 30000);
    await this.waitForDatabase('redis', this.config.databases.redis.url, 15000);
    
    // Setup test database schema
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: this.config.databases.postgres.url },
      stdio: 'pipe'
    });
  }

  /**
   * Start backend services in dependency order
   */
  private async startServicesInOrder(): Promise<void> {
    console.log('🔗 Starting backend services in dependency order...');
    
    const serviceDependencyGraph = this.buildDependencyGraph();
    const startOrder = this.topologicalSort(serviceDependencyGraph);
    
    for (const serviceName of startOrder) {
      const service = this.config.services.find(s => s.name === serviceName);
      if (service) {
        await this.startService(service);
      }
    }
  }

  /**
   * Start individual service with health check
   */
  private async startService(service: ServiceConfig): Promise<void> {
    console.log(`🚀 Starting ${service.name} on port ${service.port}...`);
    
    try {
      // Start service (implementation depends on your service architecture)
      const serviceProcess = execSync(
        `docker-compose -f e2e/docker/docker-compose.test.yml up -d ${service.name}`,
        { stdio: 'pipe' }
      );
      
      this.runningServices.set(service.name, serviceProcess);
      
      // Wait for service health check
      await this.waitForServiceHealth(service);
      
      console.log(`✅ ${service.name} is ready`);
    } catch (error) {
      throw new Error(`Failed to start ${service.name}: ${error.message}`);
    }
  }

  /**
   * Wait for service to become healthy
   */
  private async waitForServiceHealth(service: ServiceConfig): Promise<void> {
    const startTime = Date.now();
    let attempts = 0;
    
    while (Date.now() - startTime < service.timeout && attempts < service.retries) {
      try {
        const response = await fetch(`http://localhost:${service.port}${service.healthEndpoint}`);
        if (response.ok) {
          return;
        }
      } catch (error) {
        // Service not ready yet
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error(`Service ${service.name} failed health check after ${service.timeout}ms`);
  }

  /**
   * Setup comprehensive test data across all systems
   */
  private async setupTestData(): Promise<void> {
    console.log('📊 Setting up test data...');
    
    // Clear existing test data
    await this.clearTestData();
    
    // PostgreSQL test data
    await this.setupPostgresTestData();
    
    // Redis test data
    await this.setupRedisTestData();
    
    // Airtable sandbox data
    await this.setupAirtableTestData();
    
    // Gemini test configuration
    await this.setupGeminiTestConfig();
  }

  /**
   * Setup PostgreSQL test data with comprehensive user scenarios
   */
  private async setupPostgresTestData(): Promise<void> {
    const bcrypt = require('bcryptjs');
    const testPassword = await bcrypt.hash('TestPassword123!', 12);
    
    // Create test users for different scenarios
    const testUsers = [
      {
        email: 'testuser@example.com',
        name: 'Test User',
        role: 'USER',
        scenario: 'standard_user'
      },
      {
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        scenario: 'admin_user'
      },
      {
        email: 'premium@example.com',
        name: 'Premium User',
        role: 'PREMIUM',
        scenario: 'premium_features'
      },
      {
        email: 'longrunning@example.com',
        name: 'Long Running Test User',
        role: 'USER',
        scenario: 'long_running_operations'
      }
    ];
    
    for (const userData of testUsers) {
      await this.prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          ...userData,
          password: testPassword,
          emailVerified: new Date(),
        }
      });
    }
    
    // Create test workspaces and AI interaction history
    await this.setupWorkspaceTestData();
    await this.setupAIInteractionHistory();
  }

  /**
   * Setup Redis test data for session management and caching
   */
  private async setupRedisTestData(): Promise<void> {
    const prefix = this.config.databases.redis.testKeyPrefix;
    
    // Clear existing test keys
    const testKeys = await this.redis.keys(`${prefix}*`);
    if (testKeys.length > 0) {
      await this.redis.del(...testKeys);
    }
    
    // Setup test sessions
    await this.redis.setex(`${prefix}:session:test-session-1`, 3600, JSON.stringify({
      userId: 'testuser@example.com',
      role: 'USER',
      createdAt: new Date().toISOString()
    }));
    
    // Setup test cache data
    await this.redis.setex(`${prefix}:cache:gemini-tokens`, 3600, JSON.stringify({
      used: 1000,
      limit: 10000,
      resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  /**
   * Setup Airtable sandbox environment
   */
  private async setupAirtableTestData(): Promise<void> {
    // Create test tables in Airtable sandbox
    // This would integrate with your Airtable service on port 8002
    try {
      const response = await fetch('http://localhost:8002/api/test/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseId: this.config.airtable.sandboxBaseId,
          tablePrefix: this.config.airtable.testTablePrefix
        })
      });
      
      if (!response.ok) {
        throw new Error(`Airtable test setup failed: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('⚠️ Airtable test setup skipped (service not available):', error.message);
    }
  }

  /**
   * Initialize Gemini test configuration
   */
  private async setupGeminiTestConfig(): Promise<void> {
    // Setup test budget tracking
    try {
      await fetch('http://localhost:8001/api/test/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testMode: true,
          budgetLimit: this.config.gemini.testBudgetLimit,
          mockResponses: process.env.GEMINI_MOCK_MODE === 'true'
        })
      });
    } catch (error) {
      console.warn('⚠️ Gemini test setup skipped (service not available):', error.message);
    }
  }

  /**
   * Perform comprehensive health checks
   */
  private async performHealthChecks(): Promise<void> {
    console.log('🏥 Performing health checks...');
    
    const healthPromises = this.config.services.map(service => 
      this.checkServiceHealth(service)
    );
    
    const results = await Promise.allSettled(healthPromises);
    const failed = results.filter(result => result.status === 'rejected');
    
    if (failed.length > 0) {
      throw new Error(`Health checks failed for ${failed.length} services`);
    }
  }

  /**
   * Initialize monitoring and observability
   */
  private async initializeMonitoring(): Promise<void> {
    console.log('📊 Initializing monitoring...');
    
    if (this.config.monitoring.resourceMonitoringEnabled) {
      // Start resource monitoring
      setInterval(() => {
        this.collectResourceMetrics();
      }, this.config.monitoring.healthCheckInterval);
    }
    
    // Setup WebSocket connections for real-time monitoring
    await this.setupWebSocketConnections();
  }

  /**
   * Setup WebSocket connections for long-running process monitoring
   */
  private async setupWebSocketConnections(): Promise<void> {
    const wsEndpoints = [
      { name: 'ai-processor', url: 'ws://localhost:8001/ws/progress' },
      { name: 'platform-services', url: 'ws://localhost:8007/ws/analytics' }
    ];
    
    for (const endpoint of wsEndpoints) {
      try {
        const ws = new WebSocket(endpoint.url);
        
        ws.on('open', () => {
          console.log(`🔌 WebSocket connected: ${endpoint.name}`);
        });
        
        ws.on('message', (data) => {
          this.handleWebSocketMessage(endpoint.name, data);
        });
        
        ws.on('error', (error) => {
          console.warn(`⚠️ WebSocket error (${endpoint.name}):`, error.message);
        });
        
        this.webSocketConnections.set(endpoint.name, ws);
      } catch (error) {
        console.warn(`⚠️ Failed to connect WebSocket (${endpoint.name}):`, error.message);
      }
    }
  }

  /**
   * Handle WebSocket messages for progress tracking
   */
  private handleWebSocketMessage(source: string, data: any): void {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'progress') {
        console.log(`📈 Progress update from ${source}:`, message.progress);
      } else if (message.type === 'completion') {
        console.log(`✅ Operation completed from ${source}:`, message.result);
      } else if (message.type === 'error') {
        console.error(`❌ Error from ${source}:`, message.error);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to parse WebSocket message from ${source}:`, error.message);
    }
  }

  /**
   * Collect resource metrics for monitoring
   */
  private async collectResourceMetrics(): Promise<void> {
    // This would collect CPU, memory, and other resource metrics
    // Implementation depends on your monitoring requirements
  }

  /**
   * Cleanup all test resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test environment...');
    
    try {
      // Close WebSocket connections
      for (const [name, ws] of this.webSocketConnections) {
        ws.close();
      }
      this.webSocketConnections.clear();
      
      // Clear test data
      await this.clearTestData();
      
      // Stop services
      execSync('docker-compose -f e2e/docker/docker-compose.test.yml down', {
        stdio: 'pipe'
      });
      
      // Disconnect from databases
      await this.redis.quit();
      await this.prisma.$disconnect();
      
      console.log('✅ Test environment cleaned up');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  /**
   * Clear all test data
   */
  private async clearTestData(): Promise<void> {
    // Clear PostgreSQL test data
    await this.prisma.user.deleteMany({
      where: { email: { contains: 'example.com' } }
    });
    
    // Clear Redis test data
    const testKeys = await this.redis.keys(`${this.config.databases.redis.testKeyPrefix}*`);
    if (testKeys.length > 0) {
      await this.redis.del(...testKeys);
    }
  }

  /**
   * Utility methods
   */
  private async waitForDatabase(type: string, url: string, timeout: number): Promise<void> {
    // Implementation for database connection waiting
  }

  private buildDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const service of this.config.services) {
      graph.set(service.name, service.dependencies || []);
    }
    
    return graph;
  }

  private topologicalSort(graph: Map<string, string[]>): string[] {
    // Implementation of topological sort for service dependencies
    const visited = new Set<string>();
    const result: string[] = [];
    
    const visit = (node: string) => {
      if (visited.has(node)) return;
      visited.add(node);
      
      const dependencies = graph.get(node) || [];
      for (const dep of dependencies) {
        visit(dep);
      }
      
      result.push(node);
    };
    
    for (const node of graph.keys()) {
      visit(node);
    }
    
    return result;
  }

  private async checkServiceHealth(service: ServiceConfig): Promise<void> {
    const response = await fetch(`http://localhost:${service.port}${service.healthEndpoint}`);
    if (!response.ok) {
      throw new Error(`Health check failed for ${service.name}`);
    }
  }

  private async setupWorkspaceTestData(): Promise<void> {
    // Implementation for workspace test data
  }

  private async setupAIInteractionHistory(): Promise<void> {
    // Implementation for AI interaction history
  }

  private async warmupServices(): Promise<void> {
    // Implementation for service warmup
  }
}

/**
 * Default test environment configuration
 */
export const defaultTestConfig: TestEnvironmentConfig = {
  services: [
    {
      name: 'api-gateway',
      port: 8000,
      healthEndpoint: '/health',
      timeout: 30000,
      retries: 15,
      dependencies: ['postgres', 'redis']
    },
    {
      name: 'ai-processor',
      port: 8001,
      healthEndpoint: '/health',
      timeout: 45000,
      retries: 20,
      dependencies: ['api-gateway']
    },
    {
      name: 'airtable-gateway',
      port: 8002,
      healthEndpoint: '/health',
      timeout: 30000,
      retries: 15,
      dependencies: ['api-gateway']
    },
    {
      name: 'platform-services',
      port: 8007,
      healthEndpoint: '/health',
      timeout: 30000,
      retries: 15,
      dependencies: ['postgres', 'redis']
    }
  ],
  databases: {
    postgres: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pyairtable_test',
      testDb: 'pyairtable_test'
    },
    redis: {
      url: process.env.TEST_REDIS_URL || 'redis://localhost:6379/1',
      testKeyPrefix: 'test:e2e'
    }
  },
  airtable: {
    sandboxBaseId: process.env.AIRTABLE_TEST_BASE_ID || 'test-base',
    apiKey: process.env.AIRTABLE_TEST_API_KEY || 'test-key',
    testTablePrefix: 'test_'
  },
  gemini: {
    apiKey: process.env.GEMINI_TEST_API_KEY || 'test-key',
    projectId: process.env.GEMINI_TEST_PROJECT_ID || 'test-project',
    testBudgetLimit: 1000 // tokens
  },
  monitoring: {
    healthCheckInterval: 30000,
    progressTrackingTimeout: 300000, // 5 minutes for long-running operations
    resourceMonitoringEnabled: true
  }
};