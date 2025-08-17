/**
 * Long-Running Process Architecture for E2E Testing
 * 
 * Handles WebSocket connections, progress tracking, health monitoring,
 * and resource management for operations that take 5+ minutes.
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { Page } from '@playwright/test';

export interface LongRunningOperation {
  id: string;
  type: 'ai-processing' | 'data-sync' | 'batch-operation';
  startTime: number;
  expectedDuration: number;
  maxDuration: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  progress: number;
  metadata: Record<string, any>;
}

export interface ResourceMetrics {
  timestamp: number;
  cpu: number;
  memory: number;
  network: number;
  diskIO: number;
  activeConnections: number;
}

export interface ProgressUpdate {
  operationId: string;
  progress: number;
  stage: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  metrics: ResourceMetrics;
  alerts: string[];
}

/**
 * Manages long-running operations with comprehensive monitoring
 */
export class LongRunningOperationManager extends EventEmitter {
  private operations: Map<string, LongRunningOperation> = new Map();
  private webSocketConnections: Map<string, WebSocket> = new Map();
  private healthChecks: Map<string, NodeJS.Timer> = new Map();
  private resourceMonitors: Map<string, NodeJS.Timer> = new Map();
  private alertThresholds = {
    cpu: 80,
    memory: 85,
    responseTime: 5000,
    operationTimeout: 600000 // 10 minutes
  };

  constructor() {
    super();
    this.setupGlobalErrorHandling();
  }

  /**
   * Start a long-running operation with full monitoring
   */
  async startOperation(
    operationId: string, 
    type: LongRunningOperation['type'],
    expectedDuration: number,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const operation: LongRunningOperation = {
      id: operationId,
      type,
      startTime: Date.now(),
      expectedDuration,
      maxDuration: Math.max(expectedDuration * 2, 600000), // At least 10 minutes
      status: 'pending',
      progress: 0,
      metadata
    };

    this.operations.set(operationId, operation);
    
    // Setup monitoring for this operation
    await this.setupOperationMonitoring(operation);
    
    // Start the operation
    operation.status = 'running';
    this.emit('operationStarted', operation);
    
    console.log(`🚀 Long-running operation started: ${operationId} (${type})`);
  }

  /**
   * Setup comprehensive monitoring for an operation
   */
  private async setupOperationMonitoring(operation: LongRunningOperation): Promise<void> {
    // Setup WebSocket connection for progress tracking
    await this.setupWebSocketConnection(operation);
    
    // Setup health monitoring
    this.setupHealthMonitoring(operation);
    
    // Setup resource monitoring
    this.setupResourceMonitoring(operation);
    
    // Setup timeout handling
    this.setupTimeoutHandling(operation);
  }

  /**
   * Setup WebSocket connection for real-time progress updates
   */
  private async setupWebSocketConnection(operation: LongRunningOperation): Promise<void> {
    const wsUrl = this.getWebSocketUrl(operation.type);
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        console.log(`🔌 WebSocket connected for operation ${operation.id}`);
        
        // Subscribe to operation updates
        ws.send(JSON.stringify({
          type: 'subscribe',
          operationId: operation.id
        }));
      });
      
      ws.on('message', (data) => {
        this.handleWebSocketMessage(operation.id, data);
      });
      
      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for operation ${operation.id}:`, error);
        this.handleWebSocketError(operation.id, error);
      });
      
      ws.on('close', () => {
        console.log(`🔌 WebSocket closed for operation ${operation.id}`);
        this.handleWebSocketClose(operation.id);
      });
      
      this.webSocketConnections.set(operation.id, ws);
    } catch (error) {
      console.error(`❌ Failed to setup WebSocket for operation ${operation.id}:`, error);
      // Fallback to polling
      this.setupPollingFallback(operation);
    }
  }

  /**
   * Get WebSocket URL based on operation type
   */
  private getWebSocketUrl(type: LongRunningOperation['type']): string {
    const baseUrls = {
      'ai-processing': 'ws://localhost:8001/ws/progress',
      'data-sync': 'ws://localhost:8002/ws/sync',
      'batch-operation': 'ws://localhost:8000/ws/batch'
    };
    
    return baseUrls[type];
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(operationId: string, data: any): void {
    try {
      const message = JSON.parse(data.toString());
      const operation = this.operations.get(operationId);
      
      if (!operation) return;
      
      switch (message.type) {
        case 'progress':
          this.updateProgress(operationId, message);
          break;
        case 'stage_change':
          this.updateStage(operationId, message);
          break;
        case 'completion':
          this.completeOperation(operationId, message);
          break;
        case 'error':
          this.failOperation(operationId, message);
          break;
        case 'resource_alert':
          this.handleResourceAlert(operationId, message);
          break;
        default:
          console.warn(`Unknown WebSocket message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`❌ Failed to parse WebSocket message for operation ${operationId}:`, error);
    }
  }

  /**
   * Update operation progress
   */
  private updateProgress(operationId: string, message: ProgressUpdate): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;
    
    operation.progress = message.progress;
    operation.metadata.currentStage = message.stage;
    operation.metadata.lastMessage = message.message;
    operation.metadata.lastUpdate = Date.now();
    
    this.emit('progressUpdate', { operationId, ...message });
    
    console.log(`📈 Progress update: ${operationId} - ${message.progress}% (${message.stage})`);
  }

  /**
   * Update operation stage
   */
  private updateStage(operationId: string, message: any): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;
    
    operation.metadata.currentStage = message.stage;
    operation.metadata.stageStartTime = Date.now();
    
    this.emit('stageChange', { operationId, stage: message.stage });
    
    console.log(`🔄 Stage change: ${operationId} - ${message.stage}`);
  }

  /**
   * Complete an operation
   */
  private completeOperation(operationId: string, result: any): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;
    
    operation.status = 'completed';
    operation.progress = 100;
    operation.metadata.completionTime = Date.now();
    operation.metadata.duration = Date.now() - operation.startTime;
    operation.metadata.result = result;
    
    this.cleanupOperationMonitoring(operationId);
    this.emit('operationCompleted', { operationId, result });
    
    console.log(`✅ Operation completed: ${operationId} (${operation.metadata.duration}ms)`);
  }

  /**
   * Fail an operation
   */
  private failOperation(operationId: string, error: any): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;
    
    operation.status = 'failed';
    operation.metadata.error = error;
    operation.metadata.failureTime = Date.now();
    
    this.cleanupOperationMonitoring(operationId);
    this.emit('operationFailed', { operationId, error });
    
    console.error(`❌ Operation failed: ${operationId} - ${error.message || error}`);
  }

  /**
   * Setup health monitoring for services
   */
  private setupHealthMonitoring(operation: LongRunningOperation): void {
    const services = this.getRelatedServices(operation.type);
    
    for (const service of services) {
      const intervalId = setInterval(async () => {
        const healthResult = await this.performHealthCheck(service);
        
        if (healthResult.status === 'unhealthy') {
          this.handleUnhealthyService(operation.id, service, healthResult);
        }
        
        this.emit('healthCheck', { operationId: operation.id, service, result: healthResult });
      }, 10000); // Check every 10 seconds
      
      this.healthChecks.set(`${operation.id}-${service}`, intervalId);
    }
  }

  /**
   * Setup resource monitoring
   */
  private setupResourceMonitoring(operation: LongRunningOperation): void {
    const services = this.getRelatedServices(operation.type);
    
    for (const service of services) {
      const intervalId = setInterval(async () => {
        const metrics = await this.collectResourceMetrics(service);
        
        // Check for resource alerts
        this.checkResourceAlerts(operation.id, service, metrics);
        
        this.emit('resourceMetrics', { operationId: operation.id, service, metrics });
      }, 5000); // Collect every 5 seconds
      
      this.resourceMonitors.set(`${operation.id}-${service}`, intervalId);
    }
  }

  /**
   * Setup timeout handling
   */
  private setupTimeoutHandling(operation: LongRunningOperation): void {
    setTimeout(() => {
      if (operation.status === 'running') {
        operation.status = 'timeout';
        this.cleanupOperationMonitoring(operation.id);
        this.emit('operationTimeout', { operationId: operation.id });
        
        console.error(`⏰ Operation timed out: ${operation.id} after ${operation.maxDuration}ms`);
      }
    }, operation.maxDuration);
  }

  /**
   * Perform health check on a service
   */
  private async performHealthCheck(service: string): Promise<HealthCheckResult> {
    const serviceUrls = {
      'api-gateway': 'http://localhost:8000',
      'ai-processor': 'http://localhost:8001',
      'airtable-gateway': 'http://localhost:8002',
      'platform-services': 'http://localhost:8007'
    };
    
    const url = serviceUrls[service];
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${url}/health`, { 
        timeout: 5000,
        signal: AbortSignal.timeout(5000)
      });
      
      const responseTime = Date.now() - startTime;
      const healthData = await response.json();
      const metrics = await this.collectResourceMetrics(service);
      
      return {
        service,
        status: response.ok && healthData.status === 'healthy' ? 'healthy' : 'degraded',
        responseTime,
        metrics,
        alerts: this.generateHealthAlerts(responseTime, metrics)
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        service,
        status: 'unhealthy',
        responseTime,
        metrics: { timestamp: Date.now(), cpu: 0, memory: 0, network: 0, diskIO: 0, activeConnections: 0 },
        alerts: [`Service unreachable: ${error.message}`]
      };
    }
  }

  /**
   * Collect resource metrics for a service
   */
  private async collectResourceMetrics(service: string): Promise<ResourceMetrics> {
    try {
      // This would integrate with your monitoring system
      // For now, return mock metrics
      return {
        timestamp: Date.now(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        network: Math.random() * 1000,
        diskIO: Math.random() * 100,
        activeConnections: Math.floor(Math.random() * 50)
      };
    } catch (error) {
      console.warn(`⚠️ Failed to collect metrics for ${service}:`, error.message);
      return {
        timestamp: Date.now(),
        cpu: 0,
        memory: 0,
        network: 0,
        diskIO: 0,
        activeConnections: 0
      };
    }
  }

  /**
   * Check for resource alerts
   */
  private checkResourceAlerts(operationId: string, service: string, metrics: ResourceMetrics): void {
    const alerts: string[] = [];
    
    if (metrics.cpu > this.alertThresholds.cpu) {
      alerts.push(`High CPU usage: ${metrics.cpu.toFixed(1)}%`);
    }
    
    if (metrics.memory > this.alertThresholds.memory) {
      alerts.push(`High memory usage: ${metrics.memory.toFixed(1)}%`);
    }
    
    if (alerts.length > 0) {
      this.handleResourceAlert(operationId, { service, alerts, metrics });
    }
  }

  /**
   * Handle resource alerts
   */
  private handleResourceAlert(operationId: string, alert: any): void {
    console.warn(`⚠️ Resource alert for operation ${operationId}:`, alert);
    this.emit('resourceAlert', { operationId, ...alert });
  }

  /**
   * Handle unhealthy service
   */
  private handleUnhealthyService(operationId: string, service: string, healthResult: HealthCheckResult): void {
    console.error(`❌ Unhealthy service detected: ${service} for operation ${operationId}`);
    
    // Attempt to restart or recover the service
    this.attemptServiceRecovery(service);
    
    this.emit('serviceUnhealthy', { operationId, service, healthResult });
  }

  /**
   * Attempt service recovery
   */
  private async attemptServiceRecovery(service: string): Promise<void> {
    console.log(`🔧 Attempting recovery for service: ${service}`);
    
    try {
      // This would implement actual recovery logic
      // For example, restart Docker container, clear cache, etc.
      
      // Wait for recovery
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log(`✅ Recovery completed for service: ${service}`);
    } catch (error) {
      console.error(`❌ Recovery failed for service ${service}:`, error);
    }
  }

  /**
   * Setup polling fallback when WebSocket fails
   */
  private setupPollingFallback(operation: LongRunningOperation): void {
    const pollInterval = setInterval(async () => {
      try {
        const statusUrl = this.getStatusUrl(operation.type, operation.id);
        const response = await fetch(statusUrl);
        const status = await response.json();
        
        if (status.progress !== undefined) {
          this.updateProgress(operation.id, {
            operationId: operation.id,
            progress: status.progress,
            stage: status.stage || 'unknown',
            message: status.message || 'Processing...'
          });
        }
        
        if (status.completed) {
          clearInterval(pollInterval);
          this.completeOperation(operation.id, status.result);
        }
        
        if (status.failed) {
          clearInterval(pollInterval);
          this.failOperation(operation.id, status.error);
        }
      } catch (error) {
        console.warn(`⚠️ Polling failed for operation ${operation.id}:`, error.message);
      }
    }, 5000); // Poll every 5 seconds
    
    // Store interval for cleanup
    this.resourceMonitors.set(`${operation.id}-polling`, pollInterval);
  }

  /**
   * Get status URL for polling
   */
  private getStatusUrl(type: LongRunningOperation['type'], operationId: string): string {
    const baseUrls = {
      'ai-processing': 'http://localhost:8001/api/operations',
      'data-sync': 'http://localhost:8002/api/sync',
      'batch-operation': 'http://localhost:8000/api/batch'
    };
    
    return `${baseUrls[type]}/${operationId}/status`;
  }

  /**
   * Get related services for operation type
   */
  private getRelatedServices(type: LongRunningOperation['type']): string[] {
    const serviceMap = {
      'ai-processing': ['api-gateway', 'ai-processor'],
      'data-sync': ['api-gateway', 'airtable-gateway'],
      'batch-operation': ['api-gateway', 'platform-services']
    };
    
    return serviceMap[type] || ['api-gateway'];
  }

  /**
   * Generate health alerts based on metrics
   */
  private generateHealthAlerts(responseTime: number, metrics: ResourceMetrics): string[] {
    const alerts: string[] = [];
    
    if (responseTime > this.alertThresholds.responseTime) {
      alerts.push(`High response time: ${responseTime}ms`);
    }
    
    return alerts;
  }

  /**
   * Cleanup monitoring for an operation
   */
  private cleanupOperationMonitoring(operationId: string): void {
    // Close WebSocket connection
    const ws = this.webSocketConnections.get(operationId);
    if (ws) {
      ws.close();
      this.webSocketConnections.delete(operationId);
    }
    
    // Clear health check intervals
    for (const [key, intervalId] of this.healthChecks) {
      if (key.startsWith(operationId)) {
        clearInterval(intervalId);
        this.healthChecks.delete(key);
      }
    }
    
    // Clear resource monitoring intervals
    for (const [key, intervalId] of this.resourceMonitors) {
      if (key.startsWith(operationId)) {
        clearInterval(intervalId);
        this.resourceMonitors.delete(key);
      }
    }
  }

  /**
   * Handle WebSocket errors
   */
  private handleWebSocketError(operationId: string, error: Error): void {
    console.error(`❌ WebSocket error for operation ${operationId}:`, error);
    
    // Setup polling fallback
    const operation = this.operations.get(operationId);
    if (operation) {
      this.setupPollingFallback(operation);
    }
  }

  /**
   * Handle WebSocket close
   */
  private handleWebSocketClose(operationId: string): void {
    console.warn(`⚠️ WebSocket closed for operation ${operationId}`);
    
    // Setup polling fallback if operation is still running
    const operation = this.operations.get(operationId);
    if (operation && operation.status === 'running') {
      this.setupPollingFallback(operation);
    }
  }

  /**
   * Setup global error handling
   */
  private setupGlobalErrorHandling(): void {
    process.on('unhandledRejection', (error) => {
      console.error('❌ Unhandled promise rejection in LongRunningOperationManager:', error);
    });
    
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught exception in LongRunningOperationManager:', error);
    });
  }

  /**
   * Get operation status
   */
  getOperation(operationId: string): LongRunningOperation | undefined {
    return this.operations.get(operationId);
  }

  /**
   * Get all operations
   */
  getAllOperations(): LongRunningOperation[] {
    return Array.from(this.operations.values());
  }

  /**
   * Cancel an operation
   */
  async cancelOperation(operationId: string): Promise<void> {
    const operation = this.operations.get(operationId);
    if (!operation) return;
    
    // Send cancellation request to service
    try {
      const cancelUrl = this.getCancelUrl(operation.type, operationId);
      await fetch(cancelUrl, { method: 'POST' });
    } catch (error) {
      console.warn(`⚠️ Failed to cancel operation ${operationId}:`, error.message);
    }
    
    // Cleanup monitoring
    this.cleanupOperationMonitoring(operationId);
    
    // Update status
    operation.status = 'failed';
    operation.metadata.cancelled = true;
    operation.metadata.cancellationTime = Date.now();
    
    this.emit('operationCancelled', { operationId });
    
    console.log(`🛑 Operation cancelled: ${operationId}`);
  }

  /**
   * Get cancellation URL
   */
  private getCancelUrl(type: LongRunningOperation['type'], operationId: string): string {
    const baseUrls = {
      'ai-processing': 'http://localhost:8001/api/operations',
      'data-sync': 'http://localhost:8002/api/sync',
      'batch-operation': 'http://localhost:8000/api/batch'
    };
    
    return `${baseUrls[type]}/${operationId}/cancel`;
  }

  /**
   * Cleanup all operations and monitoring
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up long-running operation manager...');
    
    // Cancel all running operations
    for (const [operationId, operation] of this.operations) {
      if (operation.status === 'running') {
        await this.cancelOperation(operationId);
      }
    }
    
    // Clear all operations
    this.operations.clear();
    
    console.log('✅ Long-running operation manager cleaned up');
  }
}

/**
 * Playwright helpers for long-running operations
 */
export class PlaywrightLongRunningHelpers {
  constructor(
    private page: Page,
    private operationManager: LongRunningOperationManager
  ) {}

  /**
   * Wait for operation to complete with UI feedback
   */
  async waitForOperationCompletion(
    operationId: string,
    options: {
      maxWait?: number;
      checkInterval?: number;
      expectedStages?: string[];
    } = {}
  ): Promise<void> {
    const { maxWait = 600000, checkInterval = 1000, expectedStages = [] } = options;
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const operation = this.operationManager.getOperation(operationId);
      
      if (!operation) {
        throw new Error(`Operation not found: ${operationId}`);
      }
      
      // Check UI for progress indicators
      await this.checkUIProgressIndicators(operation);
      
      if (operation.status === 'completed') {
        console.log(`✅ Operation completed: ${operationId}`);
        return;
      }
      
      if (operation.status === 'failed') {
        throw new Error(`Operation failed: ${operationId} - ${operation.metadata.error}`);
      }
      
      if (operation.status === 'timeout') {
        throw new Error(`Operation timed out: ${operationId}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    throw new Error(`Operation did not complete within ${maxWait}ms: ${operationId}`);
  }

  /**
   * Check UI progress indicators
   */
  private async checkUIProgressIndicators(operation: LongRunningOperation): Promise<void> {
    try {
      // Check for progress bar
      const progressBar = await this.page.$('[data-testid="progress-bar"]');
      if (progressBar) {
        const progressValue = await progressBar.getAttribute('value');
        if (progressValue) {
          const uiProgress = parseFloat(progressValue);
          console.log(`📊 UI Progress: ${uiProgress}% (Operation: ${operation.progress}%)`);
        }
      }
      
      // Check for status messages
      const statusMessage = await this.page.$('[data-testid="operation-status"]');
      if (statusMessage) {
        const message = await statusMessage.textContent();
        console.log(`📝 UI Status: ${message}`);
      }
      
      // Check for stage indicators
      const stageIndicator = await this.page.$('[data-testid="current-stage"]');
      if (stageIndicator) {
        const stage = await stageIndicator.textContent();
        console.log(`🎭 UI Stage: ${stage}`);
      }
      
    } catch (error) {
      console.warn('⚠️ Failed to check UI progress indicators:', error.message);
    }
  }

  /**
   * Monitor operation with screenshots at key stages
   */
  async monitorOperationWithScreenshots(
    operationId: string,
    screenshotOptions: { 
      interval?: number; 
      stages?: string[];
      path?: string;
    } = {}
  ): Promise<void> {
    const { interval = 30000, stages = [], path = 'test-results/screenshots' } = screenshotOptions;
    
    const operation = this.operationManager.getOperation(operationId);
    if (!operation) return;
    
    // Take initial screenshot
    await this.page.screenshot({
      path: `${path}/${operationId}-start.png`,
      fullPage: true
    });
    
    // Setup interval screenshots
    const screenshotInterval = setInterval(async () => {
      const currentOperation = this.operationManager.getOperation(operationId);
      if (!currentOperation || currentOperation.status !== 'running') {
        clearInterval(screenshotInterval);
        return;
      }
      
      const timestamp = Date.now();
      await this.page.screenshot({
        path: `${path}/${operationId}-progress-${timestamp}.png`,
        fullPage: true
      });
    }, interval);
    
    // Listen for stage changes
    this.operationManager.on('stageChange', async (event) => {
      if (event.operationId === operationId && stages.includes(event.stage)) {
        await this.page.screenshot({
          path: `${path}/${operationId}-stage-${event.stage}.png`,
          fullPage: true
        });
      }
    });
    
    // Take final screenshot
    this.operationManager.on('operationCompleted', async (event) => {
      if (event.operationId === operationId) {
        await this.page.screenshot({
          path: `${path}/${operationId}-completed.png`,
          fullPage: true
        });
      }
    });
  }
}