"use client"

import { useEffect, useState } from 'react'
import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals'

// Web Vitals thresholds (Google recommended values)
const VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 }
} as const

type VitalScore = 'good' | 'needs-improvement' | 'poor'

interface VitalData {
  name: string
  value: number
  rating: VitalScore
  id: string
  delta: number
  entries: any[]
  navigationType: string
}

interface WebVitalsState {
  vitals: Record<string, VitalData>
  isSupported: boolean
  performanceScore: number
}

// Calculate performance score based on Core Web Vitals
const calculatePerformanceScore = (vitals: Record<string, VitalData>): number => {
  const coreVitals = ['CLS', 'INP', 'LCP']
  const scores = coreVitals.map(vital => {
    const vitalData = vitals[vital]
    if (!vitalData) return 0
    
    const threshold = VITALS_THRESHOLDS[vital as keyof typeof VITALS_THRESHOLDS]
    if (vitalData.value <= threshold.good) return 100
    if (vitalData.value <= threshold.poor) return 50
    return 0
  })
  
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}

// Get performance rating
const getVitalRating = (name: string, value: number): VitalScore => {
  const threshold = VITALS_THRESHOLDS[name as keyof typeof VITALS_THRESHOLDS]
  if (!threshold) return 'good'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

// Format metric value for display
const formatVitalValue = (name: string, value: number): string => {
  switch (name) {
    case 'CLS':
      return value.toFixed(3)
    case 'INP':
    case 'FCP':
    case 'LCP':
    case 'TTFB':
      return `${Math.round(value)}ms`
    default:
      return value.toString()
  }
}

// Web Vitals tracking hook
export const useWebVitals = () => {
  const [state, setState] = useState<WebVitalsState>({
    vitals: {},
    isSupported: typeof window !== 'undefined' && 'performance' in window,
    performanceScore: 0
  })

  useEffect(() => {
    if (!state.isSupported) return

    const handleVital = (metric: Metric) => {
      const vitalData: VitalData = {
        name: metric.name,
        value: metric.value,
        rating: getVitalRating(metric.name, metric.value),
        id: metric.id,
        delta: metric.delta,
        entries: metric.entries,
        navigationType: metric.navigationType || 'unknown'
      }

      setState(prev => {
        const newVitals = { ...prev.vitals, [metric.name]: vitalData }
        const newScore = calculatePerformanceScore(newVitals)
        
        return {
          ...prev,
          vitals: newVitals,
          performanceScore: newScore
        }
      })

      // Send to analytics if available
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_label: metric.id,
          non_interaction: true
        })
      }

      // Send to PostHog if available
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture('web_vital_measured', {
          metric_name: metric.name,
          metric_value: metric.value,
          metric_rating: getVitalRating(metric.name, metric.value),
          metric_id: metric.id,
          navigation_type: metric.navigationType
        })
      }

      // Console log for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Web Vitals] ${metric.name}:`, {
          value: formatVitalValue(metric.name, metric.value),
          rating: getVitalRating(metric.name, metric.value),
          id: metric.id
        })
      }
    }

    // Initialize Core Web Vitals measurement
    onCLS(handleVital)
    onINP(handleVital)
    onFCP(handleVital)
    onLCP(handleVital)
    onTTFB(handleVital)

  }, [state.isSupported])

  return {
    vitals: state.vitals,
    isSupported: state.isSupported,
    performanceScore: state.performanceScore,
    formatValue: formatVitalValue
  }
}

// Web Vitals display component
export const WebVitalsDisplay = ({ showDetails = false }: { showDetails?: boolean }) => {
  const { vitals, isSupported, performanceScore, formatValue } = useWebVitals()

  if (!isSupported) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Web Vitals not supported in this browser</p>
      </div>
    )
  }

  const coreVitals = ['LCP', 'INP', 'CLS']
  const otherVitals = ['FCP', 'TTFB']

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 50) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getRatingColor = (rating: VitalScore) => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200'
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'poor': return 'text-red-600 bg-red-50 border-red-200'
    }
  }

  return (
    <div className="space-y-4">
      {/* Performance Score */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
        <div>
          <h3 className="font-semibold text-gray-900">Performance Score</h3>
          <p className="text-sm text-gray-600">Based on Core Web Vitals</p>
        </div>
        <div className={`px-3 py-1 rounded-full font-semibold ${getScoreColor(performanceScore)}`}>
          {performanceScore}/100
        </div>
      </div>

      {/* Core Web Vitals */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Core Web Vitals</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {coreVitals.map(name => {
            const vital = vitals[name]
            return (
              <div key={name} className="p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{name}</span>
                  {vital && (
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${getRatingColor(vital.rating)}`}>
                      {vital.rating.replace('-', ' ')}
                    </span>
                  )}
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {vital ? formatValue(name, vital.value) : '—'}
                </div>
                {showDetails && vital && (
                  <div className="text-xs text-gray-500 mt-1">
                    ID: {vital.id.slice(0, 8)}...
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Other Vitals */}
      {showDetails && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Other Metrics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {otherVitals.map(name => {
              const vital = vitals[name]
              return (
                <div key={name} className="p-3 bg-white rounded-lg border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{name}</span>
                    {vital && (
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${getRatingColor(vital.rating)}`}>
                        {vital.rating.replace('-', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {vital ? formatValue(name, vital.value) : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Web Vitals Provider for the entire app
export const WebVitalsProvider = ({ children }: { children: React.ReactNode }) => {
  useWebVitals() // Initialize tracking
  return <>{children}</>
}

// Performance monitoring utilities
export const performanceUtils = {
  // Mark performance milestones
  mark: (name: string) => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name)
    }
  },

  // Measure time between marks
  measure: (name: string, startMark: string, endMark?: string) => {
    if (typeof performance !== 'undefined' && performance.measure) {
      performance.measure(name, startMark, endMark)
    }
  },

  // Get navigation timing
  getNavigationTiming: () => {
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstByte: navigation.responseStart - navigation.requestStart,
        domInteractive: navigation.domInteractive - navigation.navigationStart
      }
    }
    return null
  }
}