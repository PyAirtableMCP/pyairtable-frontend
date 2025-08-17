/**
 * API Integration Test Script
 * Run this to verify API connections are working properly
 */

import { api } from './endpoints';
import { authApi } from './auth';

export interface TestResult {
  service: string;
  endpoint: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  responseTime?: number;
  data?: any;
}

export class ApiIntegrationTester {
  private results: TestResult[] = [];

  async testAuthService(): Promise<TestResult[]> {
    const authResults: TestResult[] = [];

    // Test auth service health
    try {
      const start = Date.now();
      await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:8082'}/health`);
      const responseTime = Date.now() - start;
      
      authResults.push({
        service: 'Auth Service',
        endpoint: '/health',
        status: 'success',
        message: 'Auth service is reachable',
        responseTime,
      });
    } catch (error) {
      authResults.push({
        service: 'Auth Service',
        endpoint: '/health',
        status: 'error',
        message: `Auth service unreachable: ${error}`,
      });
    }

    // Test auth profile endpoint (requires auth)
    try {
      const response = await api.auth.getProfile();
      authResults.push({
        service: 'Auth Service',
        endpoint: '/auth/profile',
        status: 'success',
        message: 'Profile endpoint working',
        data: response.data,
      });
    } catch (error: any) {
      const status = error?.status === 401 ? 'warning' : 'error';
      const message = error?.status === 401 
        ? 'Profile endpoint requires authentication (expected)'
        : `Profile endpoint error: ${error?.message}`;
      
      authResults.push({
        service: 'Auth Service',
        endpoint: '/auth/profile',
        status,
        message,
      });
    }

    return authResults;
  }

  async testApiGateway(): Promise<TestResult[]> {
    const gatewayResults: TestResult[] = [];

    // Test API Gateway health
    try {
      const start = Date.now();
      await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8080'}/health`);
      const responseTime = Date.now() - start;
      
      gatewayResults.push({
        service: 'API Gateway',
        endpoint: '/health',
        status: 'success',
        message: 'API Gateway is reachable',
        responseTime,
      });
    } catch (error) {
      gatewayResults.push({
        service: 'API Gateway',
        endpoint: '/health',
        status: 'error',
        message: `API Gateway unreachable: ${error}`,
      });
    }

    // Test system status endpoint
    try {
      const response = await api.system.getStatus();
      gatewayResults.push({
        service: 'API Gateway',
        endpoint: '/system/status',
        status: 'success',
        message: 'System status endpoint working',
        data: response.data,
      });
    } catch (error: any) {
      gatewayResults.push({
        service: 'API Gateway',
        endpoint: '/system/status',
        status: 'error',
        message: `System status error: ${error?.message}`,
      });
    }

    // Test tenant endpoint (requires auth)
    try {
      const response = await api.tenant.getCurrent();
      gatewayResults.push({
        service: 'API Gateway',
        endpoint: '/tenant',
        status: 'success',
        message: 'Tenant endpoint working',
        data: response.data,
      });
    } catch (error: any) {
      const status = error?.status === 401 ? 'warning' : 'error';
      const message = error?.status === 401 
        ? 'Tenant endpoint requires authentication (expected)'
        : `Tenant endpoint error: ${error?.message}`;
      
      gatewayResults.push({
        service: 'API Gateway',
        endpoint: '/tenant',
        status,
        message,
      });
    }

    return gatewayResults;
  }

  async testWorkspaceService(): Promise<TestResult[]> {
    const workspaceResults: TestResult[] = [];

    // Test workspace service if separate
    if (process.env.NEXT_PUBLIC_WORKSPACE_SERVICE_URL) {
      try {
        const start = Date.now();
        await fetch(`${process.env.NEXT_PUBLIC_WORKSPACE_SERVICE_URL}/health`);
        const responseTime = Date.now() - start;
        
        workspaceResults.push({
          service: 'Workspace Service',
          endpoint: '/health',
          status: 'success',
          message: 'Workspace service is reachable',
          responseTime,
        });
      } catch (error) {
        workspaceResults.push({
          service: 'Workspace Service',
          endpoint: '/health',
          status: 'error',
          message: `Workspace service unreachable: ${error}`,
        });
      }

      // Test workspaces endpoint
      try {
        const response = await api.workspace.getAll();
        workspaceResults.push({
          service: 'Workspace Service',
          endpoint: '/workspaces',
          status: 'success',
          message: 'Workspaces endpoint working',
          data: response.data,
        });
      } catch (error: any) {
        const status = error?.status === 401 ? 'warning' : 'error';
        const message = error?.status === 401 
          ? 'Workspaces endpoint requires authentication (expected)'
          : `Workspaces endpoint error: ${error?.message}`;
        
        workspaceResults.push({
          service: 'Workspace Service',
          endpoint: '/workspaces',
          status,
          message,
        });
      }
    } else {
      workspaceResults.push({
        service: 'Workspace Service',
        endpoint: 'N/A',
        status: 'warning',
        message: 'Workspace service URL not configured (using API Gateway)',
      });
    }

    return workspaceResults;
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting API Integration Tests...');
    
    const authResults = await this.testAuthService();
    const gatewayResults = await this.testApiGateway();
    const workspaceResults = await this.testWorkspaceService();
    
    this.results = [
      ...authResults,
      ...gatewayResults,
      ...workspaceResults,
    ];

    return this.results;
  }

  generateReport(): string {
    const totalTests = this.results.length;
    const successCount = this.results.filter(r => r.status === 'success').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;

    let report = '\n📊 API Integration Test Report\n';
    report += '='.repeat(50) + '\n\n';
    
    report += `Total Tests: ${totalTests}\n`;
    report += `✅ Success: ${successCount}\n`;
    report += `⚠️  Warning: ${warningCount}\n`;
    report += `❌ Error: ${errorCount}\n\n`;

    report += 'Detailed Results:\n';
    report += '-'.repeat(30) + '\n';

    this.results.forEach((result, index) => {
      const icon = result.status === 'success' ? '✅' : 
                   result.status === 'warning' ? '⚠️' : '❌';
      
      report += `${index + 1}. ${icon} ${result.service} - ${result.endpoint}\n`;
      report += `   ${result.message}\n`;
      
      if (result.responseTime) {
        report += `   Response Time: ${result.responseTime}ms\n`;
      }
      
      if (result.data && typeof result.data === 'object') {
        report += `   Data: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...\n`;
      }
      
      report += '\n';
    });

    // Recommendations
    report += '\n📋 Recommendations:\n';
    report += '-'.repeat(20) + '\n';

    if (errorCount > 0) {
      report += '• Fix connection errors to backend services\n';
      report += '• Verify service URLs in environment configuration\n';
      report += '• Check if backend services are running\n';
    }

    if (warningCount > 0) {
      report += '• Authentication warnings are expected for protected endpoints\n';
      report += '• Configure missing service URLs if needed\n';
    }

    if (successCount === totalTests) {
      report += '• All systems operational! 🎉\n';
    }

    return report;
  }

  logResults(): void {
    console.log(this.generateReport());
  }
}

// Convenience function for quick testing
export async function testApiConnections(): Promise<TestResult[]> {
  const tester = new ApiIntegrationTester();
  const results = await tester.runAllTests();
  tester.logResults();
  return results;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testApiConnections = testApiConnections;
  console.log('💡 Run testApiConnections() in the console to test API integrations');
}