/**
 * Error Recovery and Retry Strategies for E2E Testing
 * 
 * Comprehensive error handling, automatic recovery, intelligent retry logic,
 * and fault tolerance for complex test scenarios with multiple dependencies.
 */

import { Page, Browser } from '@playwright/test';
import { EventEmitter } from 'events';

export interface RecoveryConfig {
  retryStrategies: RetryStrategy[];
  errorClassification: ErrorClassificationConfig;
  recoveryActions: RecoveryAction[];
  circuitBreaker: CircuitBreakerConfig;
  fallbackMechanisms: FallbackConfig[];
}

export interface RetryStrategy {
  name: string;
  errorTypes: string[];
  maxAttempts: number;
  backoffStrategy: 'exponential' | 'linear' | 'fixed' | 'fibonacci';
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
  condition?: (error: Error, attempt: number) => boolean;
}

export interface ErrorClassificationConfig {
  transient: string[];
  infrastructure: string[];
  application: string[];
  test: string[];
  environment: string[];
  network: string[];
  timeout: string[];
}

export interface RecoveryAction {
  name: string;
  errorTypes: string[];
  action: (context: RecoveryContext) => Promise<boolean>;
  timeout: number;
  dependencies?: string[];
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringWindow: number;
  halfOpenMaxAttempts: number;
}

export interface FallbackConfig {
  name: string;
  triggers: string[];
  action: (context: RecoveryContext) => Promise<void>;
  timeout: number;
  priority: number;
}

export interface RecoveryContext {
  page: Page;
  browser: Browser;
  testName: string;
  error: Error;
  attempt: number;
  metadata: Record<string, any>;
  services: Map<string, boolean>;
}

export interface ErrorAnalysis {
  category: 'transient' | 'infrastructure' | 'application' | 'test' | 'environment' | 'network' | 'timeout';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  suggestedAction: string;
  confidence: number;
}

export interface RecoveryAttempt {
  id: string;
  timestamp: number;
  errorType: string;
  strategy: string;
  action: string;
  success: boolean;
  duration: number;
  metadata: Record<string, any>;
}

/**
 * Comprehensive error recovery and retry system
 */
export class ErrorRecoverySystem extends EventEmitter {
  private config: RecoveryConfig;
  private recoveryHistory: Map<string, RecoveryAttempt[]> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private activeRecoveries: Map<string, Promise<boolean>> = new Map();

  constructor(config: RecoveryConfig) {
    super();
    this.config = config;
    this.initializeCircuitBreakers();
  }

  /**
   * Main error recovery entry point
   */
  async handleError(
    error: Error,
    context: RecoveryContext
  ): Promise<{ recovered: boolean; action?: string; attempts: RecoveryAttempt[] }> {
    const errorKey = this.generateErrorKey(error, context);
    
    console.log(`🔧 Starting error recovery for: ${error.message}`);
    
    // Prevent concurrent recovery for the same error
    if (this.activeRecoveries.has(errorKey)) {
      const result = await this.activeRecoveries.get(errorKey)!;
      return { recovered: result, attempts: this.getRecoveryHistory(errorKey) };
    }

    // Start recovery process
    const recoveryPromise = this.executeRecovery(error, context);
    this.activeRecoveries.set(errorKey, recoveryPromise);

    try {
      const recovered = await recoveryPromise;
      const attempts = this.getRecoveryHistory(errorKey);
      
      console.log(`${recovered ? '✅' : '❌'} Error recovery ${recovered ? 'succeeded' : 'failed'}: ${error.message}`);
      
      return { 
        recovered, 
        action: attempts.length > 0 ? attempts[attempts.length - 1].action : undefined,
        attempts 
      };
    } finally {
      this.activeRecoveries.delete(errorKey);
    }
  }

  /**
   * Execute recovery process
   */
  private async executeRecovery(error: Error, context: RecoveryContext): Promise<boolean> {
    // Analyze error
    const analysis = this.analyzeError(error);
    
    console.log(`🔍 Error analysis: ${analysis.category} (${analysis.severity}) - ${analysis.recoverable ? 'Recoverable' : 'Not recoverable'}`);
    
    if (!analysis.recoverable) {
      console.log('❌ Error marked as non-recoverable');
      return false;
    }

    // Check circuit breaker
    const circuitBreaker = this.getCircuitBreaker(analysis.category);
    if (circuitBreaker.isOpen()) {
      console.log('⚡ Circuit breaker is open, attempting fallback');
      return await this.executeFallback(error, context, analysis);
    }

    // Try recovery strategies in order of preference
    const strategies = this.getApplicableStrategies(error, analysis);
    
    for (const strategy of strategies) {
      console.log(`🎯 Trying recovery strategy: ${strategy.name}`);
      
      const recovered = await this.executeStrategy(strategy, error, context);
      
      if (recovered) {
        circuitBreaker.recordSuccess();
        this.emit('recoverySuccess', { error, strategy: strategy.name, context });
        return true;
      } else {
        circuitBreaker.recordFailure();
      }
    }

    // All strategies failed, try fallback
    console.log('🔄 All recovery strategies failed, attempting fallback');
    const fallbackSuccess = await this.executeFallback(error, context, analysis);
    
    if (!fallbackSuccess) {
      this.emit('recoveryFailed', { error, context, analysis });
    }
    
    return fallbackSuccess;
  }

  /**
   * Execute a specific recovery strategy
   */
  private async executeStrategy(
    strategy: RetryStrategy,
    error: Error,
    context: RecoveryContext
  ): Promise<boolean> {
    let attempt = 1;
    
    while (attempt <= strategy.maxAttempts) {
      // Check if we should attempt retry based on condition
      if (strategy.condition && !strategy.condition(error, attempt)) {
        console.log(`❌ Strategy condition failed for attempt ${attempt}`);
        break;
      }

      // Calculate delay
      const delay = this.calculateDelay(strategy, attempt);
      
      if (attempt > 1) {
        console.log(`⏳ Waiting ${delay}ms before retry attempt ${attempt}`);
        await this.sleep(delay);
      }

      console.log(`🔄 Recovery attempt ${attempt}/${strategy.maxAttempts} using strategy: ${strategy.name}`);

      // Record attempt
      const attemptRecord = this.recordAttempt(error, context, strategy.name, 'retry');
      
      try {
        // Execute recovery actions
        const recoveryActions = this.getApplicableRecoveryActions(error);
        let recovered = false;

        for (const action of recoveryActions) {
          console.log(`🛠️ Executing recovery action: ${action.name}`);
          
          const actionSuccess = await this.executeRecoveryAction(action, context);
          
          if (actionSuccess) {
            recovered = true;
            break;
          }
        }

        // If no specific recovery actions, try generic retry
        if (recoveryActions.length === 0) {
          recovered = await this.executeGenericRetry(context);
        }

        // Update attempt record
        this.updateAttemptRecord(attemptRecord.id, recovered, Date.now() - attemptRecord.timestamp);

        if (recovered) {
          console.log(`✅ Recovery successful on attempt ${attempt}`);
          return true;
        }
        
        console.log(`❌ Recovery attempt ${attempt} failed`);
        
      } catch (recoveryError) {
        console.error(`❌ Recovery attempt ${attempt} threw error:`, recoveryError.message);
        this.updateAttemptRecord(attemptRecord.id, false, Date.now() - attemptRecord.timestamp, recoveryError);
      }

      attempt++;
    }

    console.log(`❌ All ${strategy.maxAttempts} recovery attempts failed for strategy: ${strategy.name}`);
    return false;
  }

  /**
   * Execute fallback mechanism
   */
  private async executeFallback(
    error: Error,
    context: RecoveryContext,
    analysis: ErrorAnalysis
  ): Promise<boolean> {
    const applicableFallbacks = this.config.fallbackMechanisms
      .filter(fallback => 
        fallback.triggers.includes(analysis.category) || 
        fallback.triggers.includes('all')
      )
      .sort((a, b) => b.priority - a.priority);

    for (const fallback of applicableFallbacks) {
      console.log(`🔄 Executing fallback: ${fallback.name}`);
      
      const attemptRecord = this.recordAttempt(error, context, 'fallback', fallback.name);
      
      try {
        await Promise.race([
          fallback.action(context),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Fallback timeout')), fallback.timeout)
          )
        ]);
        
        this.updateAttemptRecord(attemptRecord.id, true, Date.now() - attemptRecord.timestamp);
        console.log(`✅ Fallback successful: ${fallback.name}`);
        
        this.emit('fallbackSuccess', { error, fallback: fallback.name, context });
        return true;
        
      } catch (fallbackError) {
        console.error(`❌ Fallback failed: ${fallback.name} - ${fallbackError.message}`);
        this.updateAttemptRecord(attemptRecord.id, false, Date.now() - attemptRecord.timestamp, fallbackError);
      }
    }

    console.log('❌ All fallback mechanisms failed');
    this.emit('fallbackFailed', { error, context, analysis });
    return false;
  }

  /**
   * Execute recovery action
   */
  private async executeRecoveryAction(
    action: RecoveryAction,
    context: RecoveryContext
  ): Promise<boolean> {
    try {
      const result = await Promise.race([
        action.action(context),
        new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error('Recovery action timeout')), action.timeout)
        )
      ]);
      
      return result;
    } catch (error) {
      console.error(`❌ Recovery action failed: ${action.name} - ${error.message}`);
      return false;
    }
  }

  /**
   * Execute generic retry (refresh page, re-navigate, etc.)
   */
  private async executeGenericRetry(context: RecoveryContext): Promise<boolean> {
    try {
      console.log('🔄 Executing generic retry (page refresh + re-navigation)');
      
      // Get current URL before refresh
      const currentUrl = context.page.url();
      
      // Refresh the page
      await context.page.reload({ waitUntil: 'networkidle' });
      
      // Wait for page to be ready
      await context.page.waitForLoadState('domcontentloaded');
      
      // Re-navigate if URL changed
      if (context.page.url() !== currentUrl) {
        await context.page.goto(currentUrl, { waitUntil: 'networkidle' });
      }
      
      // Wait a bit for any dynamic content
      await this.sleep(2000);
      
      return true;
      
    } catch (error) {
      console.error(`❌ Generic retry failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Analyze error to determine recovery strategy
   */
  private analyzeError(error: Error): ErrorAnalysis {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    const errorText = `${message} ${stack}`;

    // Check each error category
    for (const [category, patterns] of Object.entries(this.config.errorClassification)) {
      for (const pattern of patterns) {
        if (errorText.includes(pattern.toLowerCase())) {
          return {
            category: category as any,
            severity: this.determineSeverity(error, category),
            recoverable: this.isRecoverable(category),
            suggestedAction: this.getSuggestedAction(category),
            confidence: 0.8
          };
        }
      }
    }

    // Default classification for unknown errors
    return {
      category: 'application',
      severity: 'medium',
      recoverable: true,
      suggestedAction: 'retry_with_delay',
      confidence: 0.5
    };
  }

  /**
   * Get applicable retry strategies for error
   */
  private getApplicableStrategies(error: Error, analysis: ErrorAnalysis): RetryStrategy[] {
    return this.config.retryStrategies
      .filter(strategy => 
        strategy.errorTypes.includes(analysis.category) || 
        strategy.errorTypes.includes('all')
      )
      .sort((a, b) => {
        // Sort by specificity and effectiveness
        const aSpecific = a.errorTypes.includes(analysis.category) ? 1 : 0;
        const bSpecific = b.errorTypes.includes(analysis.category) ? 1 : 0;
        return bSpecific - aSpecific;
      });
  }

  /**
   * Get applicable recovery actions for error
   */
  private getApplicableRecoveryActions(error: Error): RecoveryAction[] {
    const analysis = this.analyzeError(error);
    
    return this.config.recoveryActions
      .filter(action => 
        action.errorTypes.includes(analysis.category) || 
        action.errorTypes.includes('all')
      );
  }

  /**
   * Calculate delay for retry attempt
   */
  private calculateDelay(strategy: RetryStrategy, attempt: number): number {
    let delay: number;

    switch (strategy.backoffStrategy) {
      case 'exponential':
        delay = strategy.baseDelay * Math.pow(2, attempt - 1);
        break;
      case 'linear':
        delay = strategy.baseDelay * attempt;
        break;
      case 'fibonacci':
        delay = strategy.baseDelay * this.fibonacci(attempt);
        break;
      case 'fixed':
      default:
        delay = strategy.baseDelay;
        break;
    }

    // Apply max delay limit
    delay = Math.min(delay, strategy.maxDelay);

    // Apply jitter if enabled
    if (strategy.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += Math.random() * jitterAmount - jitterAmount / 2;
    }

    return Math.max(0, Math.round(delay));
  }

  /**
   * Initialize circuit breakers for different error categories
   */
  private initializeCircuitBreakers(): void {
    if (!this.config.circuitBreaker.enabled) return;

    const categories = ['transient', 'infrastructure', 'application', 'network', 'timeout'];
    
    for (const category of categories) {
      this.circuitBreakers.set(category, new CircuitBreaker(this.config.circuitBreaker));
    }
  }

  /**
   * Get circuit breaker for error category
   */
  private getCircuitBreaker(category: string): CircuitBreaker {
    return this.circuitBreakers.get(category) || 
           this.circuitBreakers.get('application') || 
           new CircuitBreaker(this.config.circuitBreaker);
  }

  /**
   * Record recovery attempt
   */
  private recordAttempt(
    error: Error,
    context: RecoveryContext,
    strategy: string,
    action: string
  ): RecoveryAttempt {
    const attempt: RecoveryAttempt = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      errorType: error.constructor.name,
      strategy,
      action,
      success: false,
      duration: 0,
      metadata: {
        testName: context.testName,
        errorMessage: error.message,
        attempt: context.attempt
      }
    };

    const errorKey = this.generateErrorKey(error, context);
    if (!this.recoveryHistory.has(errorKey)) {
      this.recoveryHistory.set(errorKey, []);
    }
    
    this.recoveryHistory.get(errorKey)!.push(attempt);
    
    this.emit('attemptStarted', attempt);
    return attempt;
  }

  /**
   * Update recovery attempt record
   */
  private updateAttemptRecord(
    attemptId: string,
    success: boolean,
    duration: number,
    error?: Error
  ): void {
    for (const attempts of this.recoveryHistory.values()) {
      const attempt = attempts.find(a => a.id === attemptId);
      if (attempt) {
        attempt.success = success;
        attempt.duration = duration;
        if (error) {
          attempt.metadata.recoveryError = error.message;
        }
        
        this.emit('attemptCompleted', attempt);
        break;
      }
    }
  }

  /**
   * Generate unique error key for tracking
   */
  private generateErrorKey(error: Error, context: RecoveryContext): string {
    return `${context.testName}-${error.constructor.name}-${error.message.substring(0, 50)}`;
  }

  /**
   * Get recovery history for error
   */
  private getRecoveryHistory(errorKey: string): RecoveryAttempt[] {
    return this.recoveryHistory.get(errorKey) || [];
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStatistics(): {
    totalAttempts: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    successRate: number;
    commonErrorTypes: Record<string, number>;
    effectiveStrategies: Record<string, { attempts: number; successes: number; rate: number }>;
  } {
    const allAttempts = Array.from(this.recoveryHistory.values()).flat();
    const successful = allAttempts.filter(a => a.success);
    
    const commonErrorTypes: Record<string, number> = {};
    const strategies: Record<string, { attempts: number; successes: number }> = {};
    
    for (const attempt of allAttempts) {
      // Count error types
      commonErrorTypes[attempt.errorType] = (commonErrorTypes[attempt.errorType] || 0) + 1;
      
      // Count strategy effectiveness
      if (!strategies[attempt.strategy]) {
        strategies[attempt.strategy] = { attempts: 0, successes: 0 };
      }
      strategies[attempt.strategy].attempts++;
      if (attempt.success) {
        strategies[attempt.strategy].successes++;
      }
    }
    
    const effectiveStrategies = Object.fromEntries(
      Object.entries(strategies).map(([name, stats]) => [
        name,
        { ...stats, rate: stats.attempts > 0 ? stats.successes / stats.attempts : 0 }
      ])
    );

    return {
      totalAttempts: allAttempts.length,
      successfulRecoveries: successful.length,
      failedRecoveries: allAttempts.length - successful.length,
      successRate: allAttempts.length > 0 ? successful.length / allAttempts.length : 0,
      commonErrorTypes,
      effectiveStrategies
    };
  }

  // Helper methods
  private determineSeverity(error: Error, category: string): ErrorAnalysis['severity'] {
    if (category === 'infrastructure' || category === 'environment') return 'high';
    if (category === 'network' || category === 'timeout') return 'medium';
    return 'medium';
  }

  private isRecoverable(category: string): boolean {
    return category !== 'test'; // Test errors are typically not recoverable through retry
  }

  private getSuggestedAction(category: string): string {
    const actions = {
      transient: 'retry_with_backoff',
      infrastructure: 'restart_services',
      application: 'refresh_and_retry',
      network: 'reconnect_and_retry',
      timeout: 'increase_timeout_and_retry',
      environment: 'check_environment'
    };
    
    return actions[category] || 'generic_retry';
  }

  private fibonacci(n: number): number {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
      const temp = a + b;
      a = b;
      b = temp;
    }
    return b;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Circuit breaker implementation
 */
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures = 0;
  private lastFailureTime = 0;
  private successes = 0;

  constructor(private config: CircuitBreakerConfig) {}

  isOpen(): boolean {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = 'half-open';
        this.successes = 0;
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failures = 0;
    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.config.halfOpenMaxAttempts) {
        this.state = 'closed';
      }
    }
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'half-open') {
      this.state = 'open';
    } else if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }
}

/**
 * Default recovery configuration
 */
export const defaultRecoveryConfig: RecoveryConfig = {
  retryStrategies: [
    {
      name: 'transient-exponential',
      errorTypes: ['transient', 'network'],
      maxAttempts: 5,
      backoffStrategy: 'exponential',
      baseDelay: 1000,
      maxDelay: 30000,
      jitter: true
    },
    {
      name: 'infrastructure-linear',
      errorTypes: ['infrastructure'],
      maxAttempts: 3,
      backoffStrategy: 'linear',
      baseDelay: 5000,
      maxDelay: 15000,
      jitter: false
    },
    {
      name: 'timeout-fixed',
      errorTypes: ['timeout'],
      maxAttempts: 3,
      backoffStrategy: 'fixed',
      baseDelay: 3000,
      maxDelay: 3000,
      jitter: false
    },
    {
      name: 'general-fibonacci',
      errorTypes: ['all'],
      maxAttempts: 4,
      backoffStrategy: 'fibonacci',
      baseDelay: 1000,
      maxDelay: 20000,
      jitter: true
    }
  ],
  errorClassification: {
    transient: ['timeout', 'connection reset', 'temporary failure', 'rate limit'],
    infrastructure: ['service unavailable', 'database connection', 'redis connection', 'docker'],
    application: ['element not found', 'navigation failed', 'click failed'],
    test: ['assertion failed', 'test logic error'],
    environment: ['permission denied', 'file not found', 'invalid configuration'],
    network: ['network error', 'dns resolution', 'connection refused'],
    timeout: ['timeout', 'timed out', 'deadline exceeded']
  },
  recoveryActions: [
    {
      name: 'refresh-page',
      errorTypes: ['application', 'transient'],
      action: async (context) => {
        await context.page.reload({ waitUntil: 'networkidle' });
        return true;
      },
      timeout: 30000
    },
    {
      name: 'restart-browser',
      errorTypes: ['infrastructure'],
      action: async (context) => {
        await context.browser.close();
        // Browser restart would be handled by the test framework
        return true;
      },
      timeout: 60000
    },
    {
      name: 'wait-for-element',
      errorTypes: ['application'],
      action: async (context) => {
        // Wait for common elements to be available
        try {
          await context.page.waitForSelector('body', { timeout: 10000 });
          return true;
        } catch {
          return false;
        }
      },
      timeout: 15000
    }
  ],
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,
    recoveryTimeout: 60000,
    monitoringWindow: 300000,
    halfOpenMaxAttempts: 3
  },
  fallbackMechanisms: [
    {
      name: 'skip-test',
      triggers: ['infrastructure', 'environment'],
      action: async (context) => {
        console.log(`⚠️ Skipping test due to infrastructure issues: ${context.testName}`);
        // Mark test as skipped
      },
      timeout: 1000,
      priority: 1
    },
    {
      name: 'alternative-path',
      triggers: ['application'],
      action: async (context) => {
        // Try alternative navigation or interaction path
        await context.page.goto('/', { waitUntil: 'networkidle' });
      },
      timeout: 30000,
      priority: 2
    }
  ]
};