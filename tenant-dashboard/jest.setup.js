import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import 'whatwg-fetch'

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3002'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock window.ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    query: {},
    pathname: '/',
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
    },
  }),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next-auth (commented out due to import issues - will be fixed later)
// jest.mock('next-auth/react', () => ({
//   useSession: () => ({
//     data: {
//       user: {
//         id: 'test-user-id',
//         email: 'test@example.com',
//         name: 'Test User',
//       },
//       expires: '2024-12-31',
//     },
//     status: 'authenticated',
//   }),
//   signIn: jest.fn(),
//   signOut: jest.fn(),
//   getSession: jest.fn(),
// }))

// Mock PostHog
jest.mock('posthog-js', () => ({
  init: jest.fn(),
  capture: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
  isFeatureEnabled: jest.fn().mockReturnValue(false),
}))

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  configureScope: jest.fn(),
  init: jest.fn(),
}))

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}))

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}

// Setup default mocks for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
)

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn()

// Mock window.location
delete window.location
window.location = {
  href: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  toString: jest.fn(() => 'http://localhost/'),
}

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  ...jest.requireActual('lucide-react'),
  // Core icons
  Users: (props) => <div data-testid="icon-users" {...props} />,
  TrendingUp: (props) => <div data-testid="icon-trending-up" {...props} />,
  AlertCircle: (props) => <div data-testid="icon-alert-circle" {...props} />,
  Loader2: (props) => <div data-testid="icon-loader" {...props} />,
  ChevronRight: (props) => <div data-testid="icon-chevron-right" {...props} />,
  ChevronLeft: (props) => <div data-testid="icon-chevron-left" {...props} />,
  ChevronDown: (props) => <div data-testid="icon-chevron-down" {...props} />,
  ChevronUp: (props) => <div data-testid="icon-chevron-up" {...props} />,
  
  // Authentication & Profile
  User: (props) => <div data-testid="icon-user" {...props} />,
  Eye: (props) => <div data-testid="icon-eye" {...props} />,
  EyeOff: (props) => <div data-testid="icon-eye-off" {...props} />,
  Mail: (props) => <div data-testid="icon-mail" {...props} />,
  
  // Status & Feedback
  CheckCircle: (props) => <div data-testid="icon-check-circle" {...props} />,
  XCircle: (props) => <div data-testid="icon-x-circle" {...props} />,
  Check: (props) => <div data-testid="icon-check" {...props} />,
  X: (props) => <div data-testid="icon-x" {...props} />,
  AlertTriangle: (props) => <div data-testid="icon-alert-triangle" {...props} />,
  Info: (props) => <div data-testid="icon-info" {...props} />,
  
  // Actions
  Search: (props) => <div data-testid="icon-search" {...props} />,
  Filter: (props) => <div data-testid="icon-filter" {...props} />,
  Plus: (props) => <div data-testid="icon-plus" {...props} />,
  Save: (props) => <div data-testid="icon-save" {...props} />,
  Upload: (props) => <div data-testid="icon-upload" {...props} />,
  RefreshCw: (props) => <div data-testid="icon-refresh" {...props} />,
  RotateCcw: (props) => <div data-testid="icon-rotate-ccw" {...props} />,
  
  // Navigation & Layout
  Home: (props) => <div data-testid="icon-home" {...props} />,
  ArrowLeft: (props) => <div data-testid="icon-arrow-left" {...props} />,
  Settings: (props) => <div data-testid="icon-settings" {...props} />,
  Activity: (props) => <div data-testid="icon-activity" {...props} />,
  Bell: (props) => <div data-testid="icon-bell" {...props} />,
  
  // Chat & Communication
  Bot: (props) => <div data-testid="icon-bot" {...props} />,
  MessageSquare: (props) => <div data-testid="icon-message-square" {...props} />,
  
  // Theme & Appearance
  Sun: (props) => <div data-testid="icon-sun" {...props} />,
  Moon: (props) => <div data-testid="icon-moon" {...props} />,
  Monitor: (props) => <div data-testid="icon-monitor" {...props} />,
  Palette: (props) => <div data-testid="icon-palette" {...props} />,
  
  // Security & API
  Key: (props) => <div data-testid="icon-key" {...props} />,
  Shield: (props) => <div data-testid="icon-shield" {...props} />,
  ExternalLink: (props) => <div data-testid="icon-external-link" {...props} />,
  
  // Charts & Data
  BarChart3: (props) => <div data-testid="icon-bar-chart" {...props} />,
  
  // Other functional icons
  Bug: (props) => <div data-testid="icon-bug" {...props} />,
  Calendar: (props) => <div data-testid="icon-calendar" {...props} />,
  Clock: (props) => <div data-testid="icon-clock" {...props} />,
  Code: (props) => <div data-testid="icon-code" {...props} />,
  CreditCard: (props) => <div data-testid="icon-credit-card" {...props} />,
  Database: (props) => <div data-testid="icon-database" {...props} />,
  Globe: (props) => <div data-testid="icon-globe" {...props} />,
  Lightbulb: (props) => <div data-testid="icon-lightbulb" {...props} />,
  Play: (props) => <div data-testid="icon-play" {...props} />,
  Bookmark: (props) => <div data-testid="icon-bookmark" {...props} />,
  Zap: (props) => <div data-testid="icon-zap" {...props} />,
}))

// Setup test utilities
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks()
})

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks()
})