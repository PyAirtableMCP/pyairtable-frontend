"use client";

// Performance monitoring utilities for Core Web Vitals
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  url: string;
}

export interface WebVitalMetric extends PerformanceMetric {
  id: string;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Core Web Vitals thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
};

// Rate metric based on thresholds
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// Store performance metrics
const performanceMetrics: WebVitalMetric[] = [];

// Get stored metrics
export function getPerformanceMetrics(): WebVitalMetric[] {
  return [...performanceMetrics];
}

// Clear stored metrics
export function clearPerformanceMetrics(): void {
  performanceMetrics.length = 0;
}

// Record a performance metric
export function recordMetric(metric: Omit<WebVitalMetric, 'rating' | 'timestamp' | 'url'>): void {
  const webVitalMetric: WebVitalMetric = {
    ...metric,
    rating: getRating(metric.name, metric.value),
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : '',
  };
  
  performanceMetrics.push(webVitalMetric);
  
  // Send to analytics in production
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    sendToAnalytics(webVitalMetric);
  }
}

// Send metrics to analytics service
function sendToAnalytics(metric: WebVitalMetric): void {
  // Send to PostHog or other analytics service
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture('web_vital', {
      metric_name: metric.name,
      value: metric.value,
      delta: metric.delta,
      rating: metric.rating,
      url: metric.url,
    });
  }
}

// Initialize Web Vitals monitoring
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Dynamic import to avoid bundle bloat
  import('web-vitals').then(({ getCLS, getFCP, getFID, getLCP, getTTFB }) => {
    getCLS((metric) => {
      recordMetric({
        id: metric.id,
        name: 'CLS',
        value: metric.value,
        delta: metric.delta,
        unit: 'score',
      });
    });

    getFCP((metric) => {
      recordMetric({
        id: metric.id,
        name: 'FCP',
        value: metric.value,
        delta: metric.delta,
        unit: 'ms',
      });
    });

    getFID((metric) => {
      recordMetric({
        id: metric.id,
        name: 'FID',
        value: metric.value,
        delta: metric.delta,
        unit: 'ms',
      });
    });

    getLCP((metric) => {
      recordMetric({
        id: metric.id,
        name: 'LCP',
        value: metric.value,
        delta: metric.delta,
        unit: 'ms',
      });
    });

    getTTFB((metric) => {
      recordMetric({
        id: metric.id,
        name: 'TTFB',
        value: metric.value,
        delta: metric.delta,
        unit: 'ms',
      });
    });
  }).catch((error) => {
    console.warn('Failed to load web-vitals:', error);
  });
}

// Resource timing monitoring
export function monitorResourceTiming(): PerformanceMetric[] {
  if (typeof window === 'undefined' || !window.performance) return [];
  
  const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  return resources.map((resource) => ({
    name: resource.name.split('/').pop() || resource.name,
    value: resource.duration,
    unit: 'ms',
    timestamp: Date.now(),
    url: resource.name,
  }));
}

// Navigation timing metrics
export function getNavigationMetrics(): PerformanceMetric[] {
  if (typeof window === 'undefined' || !window.performance) return [];
  
  const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!navigation) return [];

  return [
    {
      name: 'DNS',
      value: navigation.domainLookupEnd - navigation.domainLookupStart,
      unit: 'ms',
      timestamp: Date.now(),
      url: window.location.href,
    },
    {
      name: 'Connect',
      value: navigation.connectEnd - navigation.connectStart,
      unit: 'ms',
      timestamp: Date.now(),
      url: window.location.href,
    },
    {
      name: 'Request',
      value: navigation.responseStart - navigation.requestStart,
      unit: 'ms',
      timestamp: Date.now(),
      url: window.location.href,
    },
    {
      name: 'Response',
      value: navigation.responseEnd - navigation.responseStart,
      unit: 'ms',
      timestamp: Date.now(),
      url: window.location.href,
    },
    {
      name: 'DOM Processing',
      value: navigation.domComplete - navigation.domLoading,
      unit: 'ms',
      timestamp: Date.now(),
      url: window.location.href,
    },
  ];
}

// Generate performance report
export function generatePerformanceReport(): {
  webVitals: WebVitalMetric[];
  resources: PerformanceMetric[];
  navigation: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    goodMetrics: number;
    needsImprovement: number;
    poorMetrics: number;
  };
} {
  const webVitals = getPerformanceMetrics();
  const resources = monitorResourceTiming();
  const navigation = getNavigationMetrics();
  
  const goodMetrics = webVitals.filter(m => m.rating === 'good').length;
  const needsImprovement = webVitals.filter(m => m.rating === 'needs-improvement').length;
  const poorMetrics = webVitals.filter(m => m.rating === 'poor').length;
  
  return {
    webVitals,
    resources,
    navigation,
    summary: {
      totalMetrics: webVitals.length,
      goodMetrics,
      needsImprovement,
      poorMetrics,
    },
  };
}