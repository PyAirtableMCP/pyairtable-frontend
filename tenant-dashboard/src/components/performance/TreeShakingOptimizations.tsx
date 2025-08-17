"use client"

/**
 * Tree Shaking Optimizations
 * 
 * This module implements aggressive tree shaking for large dependencies
 * to reduce bundle size by importing only necessary modules.
 */

// Optimized Lucide React imports - import only needed icons
export { 
  Loader2,
  Bot,
  Database,
  Zap,
  BarChart3,
  MessageSquare,
  Lightbulb,
  User,
  Settings,
  Home,
  Activity,
  Bell,
  Search,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Info
} from 'lucide-react'

// Optimized Radix UI imports - import only used components
export { 
  Root as ToastRoot,
  Viewport as ToastViewport,
  Title as ToastTitle,
  Description as ToastDescription,
  Action as ToastAction,
  Close as ToastClose
} from '@radix-ui/react-toast'

export {
  Root as DialogRoot,
  Trigger as DialogTrigger,
  Portal as DialogPortal,
  Overlay as DialogOverlay,
  Content as DialogContent,
  Header as DialogHeader,
  Footer as DialogFooter,
  Title as DialogTitle,
  Description as DialogDescription,
  Close as DialogClose
} from '@radix-ui/react-dialog'

export {
  Root as DropdownRoot,
  Trigger as DropdownTrigger,
  Portal as DropdownPortal,
  Content as DropdownContent,
  Item as DropdownItem,
  Separator as DropdownSeparator,
  Label as DropdownLabel,
  CheckboxItem as DropdownCheckboxItem,
  RadioGroup as DropdownRadioGroup,
  RadioItem as DropdownRadioItem,
  ItemIndicator as DropdownItemIndicator,
  Arrow as DropdownArrow
} from '@radix-ui/react-dropdown-menu'

export {
  Root as SelectRoot,
  Trigger as SelectTrigger,
  Value as SelectValue,
  Icon as SelectIcon,
  Portal as SelectPortal,
  Content as SelectContent,
  Viewport as SelectViewport,
  Item as SelectItem,
  ItemText as SelectItemText,
  ItemIndicator as SelectItemIndicator,
  ScrollUpButton as SelectScrollUpButton,
  ScrollDownButton as SelectScrollDownButton,
  Group as SelectGroup,
  Label as SelectLabel,
  Separator as SelectSeparator
} from '@radix-ui/react-select'

// Optimized Framer Motion - only import what's needed
export { motion, AnimatePresence } from 'framer-motion'

// Don't import the entire framer-motion library
// Instead, use specific imports like:
// import { motion } from 'framer-motion/dist/framer-motion'

// Optimized date-fns imports - import only needed functions
export { 
  format,
  parseISO,
  startOfDay,
  endOfDay,
  isAfter,
  isBefore,
  differenceInDays,
  addDays,
  subDays
} from 'date-fns'

// Optimized React Query imports
export {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query'

// Optimized Zustand imports
export { create } from 'zustand'
export { subscribeWithSelector } from 'zustand/middleware'
export { immer } from 'zustand/middleware/immer'

// Lightweight utility functions instead of lodash
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T => {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean
  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }) as T
}

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

export const range = (start: number, end: number): number[] => {
  return Array.from({ length: end - start }, (_, i) => start + i)
}

export const chunk = <T>(array: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  )
}

export const uniq = <T>(array: T[]): T[] => {
  return [...new Set(array)]
}

export const groupBy = <T, K extends keyof any>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((result, item) => {
    const group = key(item)
    if (!result[group]) {
      result[group] = []
    }
    result[group].push(item)
    return result
  }, {} as Record<K, T[]>)
}

// Optimized class name utilities (instead of clsx)
export const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ')
}

export const conditionalClass = (
  condition: boolean,
  trueClass: string,
  falseClass: string = ''
): string => {
  return condition ? trueClass : falseClass
}

// Optimized validation (instead of full zod for simple cases)
export const isEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const required = (value: any): boolean => {
  return value != null && value !== '' && value !== undefined
}

export const minLength = (min: number) => (value: string): boolean => {
  return value.length >= min
}

export const maxLength = (max: number) => (value: string): boolean => {
  return value.length <= max
}

// Optimized async utilities
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const timeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), ms)
  })
  return Promise.race([promise, timeoutPromise])
}

export const retry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      await sleep(delay)
      return retry(fn, retries - 1, delay * 1.5)
    }
    throw error
  }
}

// Optimized storage utilities
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    if (typeof window === 'undefined') return defaultValue || null
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch {
      return defaultValue || null
    }
  },
  
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return
    localStorage.clear()
  }
}

// Export optimized component factories
export const createOptimizedComponent = <P extends {}>(
  Component: React.ComponentType<P>
) => {
  const OptimizedComponent = React.memo(Component)
  OptimizedComponent.displayName = `Optimized(${Component.displayName || Component.name})`
  return OptimizedComponent
}

export const createLazyComponent = <P extends {}>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ComponentType
) => {
  return React.lazy(async () => {
    const module = await importFn()
    return { default: createOptimizedComponent(module.default) }
  })
}