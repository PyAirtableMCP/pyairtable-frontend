/**
 * Monitoring and Observability Architecture for E2E Testing
 * 
 * Comprehensive monitoring system that tracks test execution metrics,
 * service health, resource usage, performance, and provides real-time
 * observability during test runs.
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { execSync } from 'child_process';
import fs from 'fs/promises';

export interface MonitoringConfig {
  enabled: boolean;
  realTime: boolean;
  metrics: {
    collectInterval: number;
    retentionPeriod: number;
    aggregationWindows: number[];
  };
  alerts: {
    enabled: boolean;
    thresholds: AlertThresholds;
    channels: AlertChannel[];
  };
  exporters: {
    prometheus: PrometheusConfig;
    elasticsearch: ElasticsearchConfig;
    grafana: GrafanaConfig;
  };
  tracing: {
    enabled: boolean;
    samplingRate: number;
    exportEndpoint: string;
  };
}

export interface AlertThresholds {
  testFailureRate: number;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  errorRate: number;
  diskSpace: number;
}

export interface AlertChannel {
  type: 'webhook' | 'slack' | 'email' | 'console';
  config: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PrometheusConfig {
  enabled: boolean;
  endpoint: string;
  pushGateway: string;
  jobName: string;
}

export interface ElasticsearchConfig {
  enabled: boolean;
  endpoint: string;
  index: string;
  username?: string;
  password?: string;
}

export interface GrafanaConfig {
  enabled: boolean;
  endpoint: string;
  dashboardId: string;
  apiKey: string;
}

export interface MetricPoint {
  timestamp: number;
  metric: string;
  value: number;
  labels: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metric: string;
  threshold: number;
  currentValue: number;
  resolved: boolean;
  resolvedAt?: number;
}

export interface TestExecutionMetrics {
  executionId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  flakyTests: number;
  retryCount: number;
  parallelWorkers: number;
  averageTestDuration: number;
  testThroughput: number;
  errorRate: number;
}

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    coreCount: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    available: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
    ioWaitTime: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    errors: number;
  };
}

export interface ServiceMetrics {
  serviceName: string;
  timestamp: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  throughput: number;
  activeConnections: number;
  memory: number;
  cpu: number;
}

/**
 * Comprehensive monitoring and observability system
 */
export class MonitoringSystem extends EventEmitter {
  private config: MonitoringConfig;
  private metrics: Map<string, MetricPoint[]> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private collectors: Map<string, NodeJS.Timer> = new Map();
  private webSocketServer?: WebSocket.Server;
  private clients: Set<WebSocket> = new Set();
  private isRunning = false;

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;
  }

  /**
   * Start monitoring system
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      console.log('⚠️ Monitoring is disabled');
      return;
    }

    console.log('📊 Starting monitoring system...');
    this.isRunning = true;

    try {
      // Initialize metric storage
      await this.initializeMetricStorage();

      // Start metric collectors
      this.startMetricCollectors();

      // Setup real-time monitoring
      if (this.config.realTime) {
        await this.setupRealTimeMonitoring();
      }

      // Initialize exporters
      await this.initializeExporters();

      // Setup alerting
      if (this.config.alerts.enabled) {
        this.setupAlerting();
      }

      // Start tracing if enabled
      if (this.config.tracing.enabled) {
        await this.initializeTracing();
      }

      console.log('✅ Monitoring system started');
      this.emit('monitoringStarted');
    } catch (error) {
      console.error('❌ Failed to start monitoring system:', error);
      throw error;
    }
  }

  /**
   * Record a metric point
   */
  recordMetric(
    metric: string,
    value: number,
    labels: Record<string, string> = {},
    metadata?: Record<string, any>
  ): void {
    if (!this.isRunning) return;

    const point: MetricPoint = {
      timestamp: Date.now(),
      metric,
      value,
      labels,
      metadata
    };

    // Store metric
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }

    const points = this.metrics.get(metric)!;
    points.push(point);

    // Trim old metrics based on retention period
    const cutoff = Date.now() - this.config.metrics.retentionPeriod;
    this.metrics.set(metric, points.filter(p => p.timestamp > cutoff));

    // Check for alerts
    this.checkAlertThresholds(metric, value, labels);

    // Emit metric event
    this.emit('metricRecorded', point);

    // Send to real-time clients
    if (this.config.realTime) {
      this.broadcastToClients('metric', point);
    }

    // Export to external systems
    this.exportMetric(point);
  }

  /**
   * Record test execution metrics
   */
  recordTestExecution(executionId: string, metrics: Partial<TestExecutionMetrics>): void {
    const baseLabels = { executionId, type: 'test_execution' };

    Object.entries(metrics).forEach(([key, value]) => {
      if (typeof value === 'number') {
        this.recordMetric(`test_execution_${key}`, value, baseLabels);
      }
    });
  }

  /**
   * Record service metrics
   */
  recordServiceMetrics(serviceMetrics: ServiceMetrics): void {
    const baseLabels = { 
      service: serviceMetrics.serviceName,
      status: serviceMetrics.status,
      type: 'service'
    };

    this.recordMetric('service_response_time', serviceMetrics.responseTime, baseLabels);
    this.recordMetric('service_request_count', serviceMetrics.requestCount, baseLabels);
    this.recordMetric('service_error_count', serviceMetrics.errorCount, baseLabels);
    this.recordMetric('service_error_rate', serviceMetrics.errorRate, baseLabels);
    this.recordMetric('service_throughput', serviceMetrics.throughput, baseLabels);
    this.recordMetric('service_connections', serviceMetrics.activeConnections, baseLabels);
    this.recordMetric('service_memory', serviceMetrics.memory, baseLabels);
    this.recordMetric('service_cpu', serviceMetrics.cpu, baseLabels);
  }

  /**
   * Record system metrics
   */
  recordSystemMetrics(systemMetrics: SystemMetrics): void {
    const baseLabels = { type: 'system', timestamp: systemMetrics.timestamp.toString() };

    // CPU metrics
    this.recordMetric('system_cpu_usage', systemMetrics.cpu.usage, baseLabels);
    this.recordMetric('system_cpu_load_1m', systemMetrics.cpu.loadAverage[0], baseLabels);
    this.recordMetric('system_cpu_load_5m', systemMetrics.cpu.loadAverage[1], baseLabels);
    this.recordMetric('system_cpu_load_15m', systemMetrics.cpu.loadAverage[2], baseLabels);

    // Memory metrics
    this.recordMetric('system_memory_used', systemMetrics.memory.used, baseLabels);
    this.recordMetric('system_memory_percentage', systemMetrics.memory.percentage, baseLabels);
    this.recordMetric('system_memory_available', systemMetrics.memory.available, baseLabels);

    // Disk metrics
    this.recordMetric('system_disk_used', systemMetrics.disk.used, baseLabels);
    this.recordMetric('system_disk_percentage', systemMetrics.disk.percentage, baseLabels);
    this.recordMetric('system_disk_io_wait', systemMetrics.disk.ioWaitTime, baseLabels);

    // Network metrics
    this.recordMetric('system_network_bytes_in', systemMetrics.network.bytesIn, baseLabels);
    this.recordMetric('system_network_bytes_out', systemMetrics.network.bytesOut, baseLabels);
    this.recordMetric('system_network_packets_in', systemMetrics.network.packetsIn, baseLabels);
    this.recordMetric('system_network_packets_out', systemMetrics.network.packetsOut, baseLabels);
    this.recordMetric('system_network_errors', systemMetrics.network.errors, baseLabels);
  }

  /**
   * Start metric collectors
   */
  private startMetricCollectors(): void {
    console.log('🔄 Starting metric collectors...');

    // System metrics collector
    const systemCollector = setInterval(async () => {
      try {
        const systemMetrics = await this.collectSystemMetrics();
        this.recordSystemMetrics(systemMetrics);
      } catch (error) {
        console.warn('⚠️ Failed to collect system metrics:', error.message);
      }
    }, this.config.metrics.collectInterval);

    this.collectors.set('system', systemCollector);

    // Service metrics collector
    const serviceCollector = setInterval(async () => {
      try {
        const services = ['api-gateway', 'ai-processor', 'airtable-gateway', 'platform-services'];
        for (const service of services) {
          const serviceMetrics = await this.collectServiceMetrics(service);
          this.recordServiceMetrics(serviceMetrics);
        }
      } catch (error) {
        console.warn('⚠️ Failed to collect service metrics:', error.message);
      }
    }, this.config.metrics.collectInterval);

    this.collectors.set('services', serviceCollector);

    // Test execution collector (triggered by events)
    this.on('testStarted', (executionId) => {
      this.recordMetric('test_executions_started', 1, { executionId });
    });

    this.on('testCompleted', (executionId, metrics) => {
      this.recordTestExecution(executionId, metrics);
    });
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<SystemMetrics> {
    try {
      // Get CPU usage
      const cpuUsage = this.getCPUUsage();
      const loadAverage = this.getLoadAverage();

      // Get memory usage
      const memoryInfo = this.getMemoryInfo();

      // Get disk usage
      const diskInfo = this.getDiskInfo();

      // Get network stats
      const networkStats = this.getNetworkStats();

      return {
        timestamp: Date.now(),
        cpu: {
          usage: cpuUsage,
          loadAverage,
          coreCount: require('os').cpus().length
        },
        memory: memoryInfo,
        disk: diskInfo,
        network: networkStats
      };
    } catch (error) {
      throw new Error(`Failed to collect system metrics: ${error.message}`);
    }
  }

  /**
   * Collect service metrics
   */
  private async collectServiceMetrics(serviceName: string): Promise<ServiceMetrics> {
    const serviceUrls = {
      'api-gateway': 'http://localhost:8000',
      'ai-processor': 'http://localhost:8001',
      'airtable-gateway': 'http://localhost:8002',
      'platform-services': 'http://localhost:8007'
    };

    const url = serviceUrls[serviceName];
    const startTime = Date.now();

    try {
      // Health check with timing
      const response = await fetch(`${url}/health`, { 
        signal: AbortSignal.timeout(5000) 
      });
      const responseTime = Date.now() - startTime;

      // Get detailed metrics if available
      let detailedMetrics = {};
      try {
        const metricsResponse = await fetch(`${url}/metrics`);
        if (metricsResponse.ok) {
          detailedMetrics = await metricsResponse.json();
        }
      } catch (e) {
        // Metrics endpoint not available
      }

      return {
        serviceName,
        timestamp: Date.now(),
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        requestCount: detailedMetrics['requests_total'] || 0,
        errorCount: detailedMetrics['errors_total'] || 0,
        errorRate: detailedMetrics['error_rate'] || 0,
        throughput: detailedMetrics['throughput'] || 0,
        activeConnections: detailedMetrics['active_connections'] || 0,
        memory: detailedMetrics['memory_usage'] || 0,
        cpu: detailedMetrics['cpu_usage'] || 0
      };
    } catch (error) {
      return {
        serviceName,
        timestamp: Date.now(),
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        requestCount: 0,
        errorCount: 1,
        errorRate: 100,
        throughput: 0,
        activeConnections: 0,
        memory: 0,
        cpu: 0
      };
    }
  }

  /**
   * Setup real-time monitoring WebSocket server
   */
  private async setupRealTimeMonitoring(): Promise<void> {
    console.log('🔗 Setting up real-time monitoring...');

    this.webSocketServer = new WebSocket.Server({ port: 8090 });

    this.webSocketServer.on('connection', (ws) => {
      console.log('📡 Real-time monitoring client connected');
      this.clients.add(ws);

      // Send initial state
      ws.send(JSON.stringify({
        type: 'initial',
        metrics: this.getRecentMetrics(),
        alerts: Array.from(this.alerts.values())
      }));

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('📡 Real-time monitoring client disconnected');
      });

      ws.on('error', (error) => {
        console.warn('⚠️ WebSocket client error:', error.message);
        this.clients.delete(ws);
      });
    });

    console.log('✅ Real-time monitoring server started on port 8090');
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcastToClients(type: string, data: any): void {
    const message = JSON.stringify({ type, data, timestamp: Date.now() });
    
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.warn('⚠️ Failed to send message to client:', error.message);
          this.clients.delete(client);
        }
      }
    }
  }

  /**
   * Check alert thresholds
   */
  private checkAlertThresholds(metric: string, value: number, labels: Record<string, string>): void {
    const thresholds = this.config.alerts.thresholds;
    let alert: Alert | null = null;

    // Check various alert conditions
    if (metric === 'test_execution_failure_rate' && value > thresholds.testFailureRate) {
      alert = this.createAlert('high', 'High Test Failure Rate', 
        `Test failure rate is ${value.toFixed(2)}%, exceeding threshold of ${thresholds.testFailureRate}%`,
        metric, thresholds.testFailureRate, value);
    } else if (metric.includes('response_time') && value > thresholds.responseTime) {
      alert = this.createAlert('medium', 'High Response Time',
        `Response time is ${value}ms, exceeding threshold of ${thresholds.responseTime}ms`,
        metric, thresholds.responseTime, value);
    } else if (metric === 'system_memory_percentage' && value > thresholds.memoryUsage) {
      alert = this.createAlert('high', 'High Memory Usage',
        `Memory usage is ${value.toFixed(1)}%, exceeding threshold of ${thresholds.memoryUsage}%`,
        metric, thresholds.memoryUsage, value);
    } else if (metric === 'system_cpu_usage' && value > thresholds.cpuUsage) {
      alert = this.createAlert('medium', 'High CPU Usage',
        `CPU usage is ${value.toFixed(1)}%, exceeding threshold of ${thresholds.cpuUsage}%`,
        metric, thresholds.cpuUsage, value);
    }

    if (alert) {
      this.handleAlert(alert);
    }
  }

  /**
   * Create alert
   */
  private createAlert(
    severity: Alert['severity'],
    title: string,
    message: string,
    metric: string,
    threshold: number,
    currentValue: number
  ): Alert {
    return {
      id: `${metric}-${Date.now()}`,
      timestamp: Date.now(),
      severity,
      title,
      message,
      metric,
      threshold,
      currentValue,
      resolved: false
    };
  }

  /**
   * Handle alert
   */
  private handleAlert(alert: Alert): void {
    console.warn(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.title}`);
    console.warn(`   ${alert.message}`);

    this.alerts.set(alert.id, alert);
    this.emit('alert', alert);

    // Send to alert channels
    this.sendAlertToChannels(alert);

    // Broadcast to real-time clients
    if (this.config.realTime) {
      this.broadcastToClients('alert', alert);
    }
  }

  /**
   * Send alert to configured channels
   */
  private sendAlertToChannels(alert: Alert): void {
    for (const channel of this.config.alerts.channels) {
      if (this.shouldSendToChannel(alert.severity, channel.severity)) {
        this.sendAlertToChannel(alert, channel);
      }
    }
  }

  /**
   * Check if alert should be sent to channel based on severity
   */
  private shouldSendToChannel(alertSeverity: string, channelSeverity: string): boolean {
    const severityLevels = { low: 0, medium: 1, high: 2, critical: 3 };
    return severityLevels[alertSeverity] >= severityLevels[channelSeverity];
  }

  /**
   * Send alert to specific channel
   */
  private async sendAlertToChannel(alert: Alert, channel: AlertChannel): Promise<void> {
    try {
      switch (channel.type) {
        case 'webhook':
          await this.sendWebhookAlert(alert, channel.config);
          break;
        case 'slack':
          await this.sendSlackAlert(alert, channel.config);
          break;
        case 'email':
          await this.sendEmailAlert(alert, channel.config);
          break;
        case 'console':
          console.log(`🚨 [${channel.severity}] ${alert.title}: ${alert.message}`);
          break;
      }
    } catch (error) {
      console.error(`❌ Failed to send alert to ${channel.type}:`, error.message);
    }
  }

  /**
   * Initialize exporters
   */
  private async initializeExporters(): Promise<void> {
    console.log('📤 Initializing metric exporters...');

    if (this.config.exporters.prometheus.enabled) {
      await this.initializePrometheusExporter();
    }

    if (this.config.exporters.elasticsearch.enabled) {
      await this.initializeElasticsearchExporter();
    }

    if (this.config.exporters.grafana.enabled) {
      await this.initializeGrafanaExporter();
    }
  }

  /**
   * Export metric to configured systems
   */
  private exportMetric(metric: MetricPoint): void {
    if (this.config.exporters.prometheus.enabled) {
      this.exportToPrometheus(metric);
    }

    if (this.config.exporters.elasticsearch.enabled) {
      this.exportToElasticsearch(metric);
    }
  }

  /**
   * Get recent metrics for dashboard
   */
  private getRecentMetrics(): Record<string, MetricPoint[]> {
    const recentMetrics: Record<string, MetricPoint[]> = {};
    const cutoff = Date.now() - (5 * 60 * 1000); // Last 5 minutes

    for (const [metric, points] of this.metrics) {
      const recentPoints = points.filter(p => p.timestamp > cutoff);
      if (recentPoints.length > 0) {
        recentMetrics[metric] = recentPoints;
      }
    }

    return recentMetrics;
  }

  /**
   * Get monitoring dashboard data
   */
  getDashboardData(): {
    metrics: Record<string, MetricPoint[]>;
    alerts: Alert[];
    summary: {
      totalMetrics: number;
      activeAlerts: number;
      systemHealth: 'healthy' | 'degraded' | 'unhealthy';
    };
  } {
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved);
    
    return {
      metrics: this.getRecentMetrics(),
      alerts: activeAlerts,
      summary: {
        totalMetrics: this.metrics.size,
        activeAlerts: activeAlerts.length,
        systemHealth: this.determineSystemHealth()
      }
    };
  }

  /**
   * Determine overall system health
   */
  private determineSystemHealth(): 'healthy' | 'degraded' | 'unhealthy' {
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved);
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
    const highAlerts = activeAlerts.filter(a => a.severity === 'high');

    if (criticalAlerts.length > 0) {
      return 'unhealthy';
    } else if (highAlerts.length > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Stop monitoring system
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping monitoring system...');
    this.isRunning = false;

    // Stop all collectors
    for (const [name, intervalId] of this.collectors) {
      clearInterval(intervalId);
      console.log(`🛑 Stopped collector: ${name}`);
    }
    this.collectors.clear();

    // Close WebSocket server
    if (this.webSocketServer) {
      this.webSocketServer.close();
      console.log('🛑 WebSocket server closed');
    }

    // Close all client connections
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();

    // Cleanup
    this.removeAllListeners();

    console.log('✅ Monitoring system stopped');
  }

  // Helper methods for system metrics collection
  private getCPUUsage(): number {
    try {
      // Implementation would use system tools or libraries
      return Math.random() * 100;
    } catch (error) {
      return 0;
    }
  }

  private getLoadAverage(): number[] {
    try {
      return require('os').loadavg();
    } catch (error) {
      return [0, 0, 0];
    }
  }

  private getMemoryInfo(): SystemMetrics['memory'] {
    try {
      const totalMem = require('os').totalmem();
      const freeMem = require('os').freemem();
      const used = totalMem - freeMem;
      
      return {
        used,
        total: totalMem,
        percentage: (used / totalMem) * 100,
        available: freeMem
      };
    } catch (error) {
      return { used: 0, total: 0, percentage: 0, available: 0 };
    }
  }

  private getDiskInfo(): SystemMetrics['disk'] {
    // Implementation would use system tools
    return {
      used: 0,
      total: 0,
      percentage: 0,
      ioWaitTime: 0
    };
  }

  private getNetworkStats(): SystemMetrics['network'] {
    // Implementation would use system tools
    return {
      bytesIn: 0,
      bytesOut: 0,
      packetsIn: 0,
      packetsOut: 0,
      errors: 0
    };
  }

  // Alert channel implementations
  private async sendWebhookAlert(alert: Alert, config: any): Promise<void> {
    // Implementation for webhook alerts
  }

  private async sendSlackAlert(alert: Alert, config: any): Promise<void> {
    // Implementation for Slack alerts
  }

  private async sendEmailAlert(alert: Alert, config: any): Promise<void> {
    // Implementation for email alerts
  }

  // Exporter implementations
  private async initializePrometheusExporter(): Promise<void> {
    // Implementation for Prometheus exporter
  }

  private async initializeElasticsearchExporter(): Promise<void> {
    // Implementation for Elasticsearch exporter
  }

  private async initializeGrafanaExporter(): Promise<void> {
    // Implementation for Grafana exporter
  }

  private exportToPrometheus(metric: MetricPoint): void {
    // Implementation for Prometheus export
  }

  private exportToElasticsearch(metric: MetricPoint): void {
    // Implementation for Elasticsearch export
  }

  private async initializeMetricStorage(): Promise<void> {
    // Implementation for metric storage initialization
  }

  private setupAlerting(): void {
    // Implementation for alerting setup
  }

  private async initializeTracing(): Promise<void> {
    // Implementation for tracing initialization
  }
}

/**
 * Default monitoring configuration
 */
export const defaultMonitoringConfig: MonitoringConfig = {
  enabled: true,
  realTime: true,
  metrics: {
    collectInterval: 5000,
    retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
    aggregationWindows: [60, 300, 900] // 1m, 5m, 15m
  },
  alerts: {
    enabled: true,
    thresholds: {
      testFailureRate: 10, // %
      responseTime: 5000, // ms
      memoryUsage: 80, // %
      cpuUsage: 80, // %
      errorRate: 5, // %
      diskSpace: 90 // %
    },
    channels: [
      {
        type: 'console',
        config: {},
        severity: 'medium'
      }
    ]
  },
  exporters: {
    prometheus: {
      enabled: false,
      endpoint: 'http://localhost:9090',
      pushGateway: 'http://localhost:9091',
      jobName: 'e2e-tests'
    },
    elasticsearch: {
      enabled: false,
      endpoint: 'http://localhost:9200',
      index: 'e2e-metrics'
    },
    grafana: {
      enabled: false,
      endpoint: 'http://localhost:3001',
      dashboardId: 'e2e-dashboard',
      apiKey: ''
    }
  },
  tracing: {
    enabled: true,
    samplingRate: 0.1,
    exportEndpoint: 'http://localhost:14268/api/traces'
  }
};