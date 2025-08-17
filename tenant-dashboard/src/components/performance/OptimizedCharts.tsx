"use client"

import { lazy, Suspense, useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

// Chart loading fallback
const ChartSkeleton = ({ height = "h-64" }: { height?: string }) => (
  <div className={`${height} bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center`}>
    <div className="text-center space-y-3">
      <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
      <div className="space-y-1">
        <p className="text-sm text-gray-500">Loading chart...</p>
        <div className="flex space-x-1 justify-center">
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  </div>
)

// Heavy chart imports - loaded only when component is visible
const RechartsComponents = lazy(() => 
  import('recharts').then(module => ({
    default: {
      LineChart: module.LineChart,
      Line: module.Line,
      XAxis: module.XAxis,
      YAxis: module.YAxis,
      CartesianGrid: module.CartesianGrid,
      Tooltip: module.Tooltip,
      Legend: module.Legend,
      ResponsiveContainer: module.ResponsiveContainer,
      BarChart: module.BarChart,
      Bar: module.Bar,
      PieChart: module.PieChart,
      Pie: module.Pie,
      Cell: module.Cell
    }
  }))
)

// Optimized line chart component
export const OptimizedLineChart = ({ data, height = 300, ...props }: any) => {
  return (
    <Suspense fallback={<ChartSkeleton height={`h-[${height}px]`} />}>
      <div style={{ height }}>
        <RechartsComponents>
          {({ LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer }) => (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} {...props}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </RechartsComponents>
      </div>
    </Suspense>
  )
}

// Optimized bar chart component  
export const OptimizedBarChart = ({ data, height = 300, ...props }: any) => {
  return (
    <Suspense fallback={<ChartSkeleton height={`h-[${height}px]`} />}>
      <div style={{ height }}>
        <RechartsComponents>
          {({ BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer }) => (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} {...props}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="value" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </RechartsComponents>
      </div>
    </Suspense>
  )
}

// Optimized pie chart component
export const OptimizedPieChart = ({ data, height = 300, ...props }: any) => {
  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']
  
  return (
    <Suspense fallback={<ChartSkeleton height={`h-[${height}px]`} />}>
      <div style={{ height }}>
        <RechartsComponents>
          {({ PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer }) => (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart {...props}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </RechartsComponents>
      </div>
    </Suspense>
  )
}

// Intersection Observer hook for lazy chart loading
export const useInView = (options = {}) => {
  const [inView, setInView] = useState(false)
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect() // Only load once
        }
      },
      { threshold: 0.1, ...options }
    )

    observer.observe(ref)

    return () => observer.disconnect()
  }, [ref, options])

  return [setRef, inView] as const
}

// Smart chart loader that only loads when visible
export const LazyChart = ({ 
  type, 
  data, 
  height = 300, 
  className = "",
  ...props 
}: {
  type: 'line' | 'bar' | 'pie'
  data: any[]
  height?: number
  className?: string
  [key: string]: any
}) => {
  const [ref, inView] = useInView()

  const ChartComponent = {
    line: OptimizedLineChart,
    bar: OptimizedBarChart,
    pie: OptimizedPieChart
  }[type]

  return (
    <div ref={ref} className={className}>
      {inView ? (
        <ChartComponent data={data} height={height} {...props} />
      ) : (
        <ChartSkeleton height={`h-[${height}px]`} />
      )}
    </div>
  )
}