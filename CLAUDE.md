# PyAirtable Frontend - Claude Code Configuration

## 🎯 Service Purpose
This is the **user interface** of the PyAirtable ecosystem - a modern Next.js 15 frontend application that provides an intuitive, responsive interface for AI-powered Airtable automation. It serves as the primary interaction point for users to engage with all PyAirtable services.

## 🔪 Available Slash Commands
- `/commit` - Create conventional commits with proper formatting
- `/context-prime` - Load full project context at session start
- `/todo` - Manage development tasks and track progress
- `/create-pr` - Create GitHub pull request with template
- `/fix-github-issue` - Fix specific GitHub issue systematically
- `/clean` - Clean code issues, formatting, and linting
- `/add-to-changelog` - Update CHANGELOG.md with new entries
- `/release` - Manage version releases and tags
- `/pr-review` - Review pull requests for issues

## 🏗️ Current State

### Deployment Status
- **Environment**: ✅ Local Kubernetes (Minikube)
- **Services Running**: ✅ 7 out of 9 services operational
- **Database Analysis**: ✅ Airtable test database analyzed (34 tables, 539 fields)
- **Metadata Tool**: ✅ Table analysis tool executed successfully

### Service Status
- **Framework**: ✅ Next.js 15 with App Router and TypeScript
- **UI Components**: ✅ shadcn/ui with Tailwind CSS
- **State Management**: ✅ Zustand stores for app, chat, and Airtable data
- **API Integration**: ✅ TanStack Query with 4 microservices
- **Real-time Features**: ✅ Chat interface with function call visualization
- **Responsive Design**: ✅ Mobile-first with adaptive layouts
- **Animations**: ✅ Framer Motion for smooth interactions

### Recent Fixes Applied
- ✅ Pydantic v2 compatibility issues resolved
- ✅ Gemini ThinkingConfig configuration fixed
- ✅ SQLAlchemy metadata handling updated
- ✅ Service deployment to Kubernetes completed

## 🔧 Technical Details
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict typing
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand for client state
- **Data Fetching**: TanStack Query for server state
- **Animations**: Framer Motion
- **Charts**: Recharts for data visualization
- **Port**: 3000 (development)

## 📋 Application Pages

### Core Pages
```typescript
/                    # Landing page with platform overview
/chat               # Real-time AI chat interface
/dashboard          # System metrics and Airtable workspace
/cost               # Budget monitoring and usage analytics
/settings           # User preferences and configuration
```

### Page Components
```typescript
// Chat Interface
chat-interface.tsx          # Main chat container
chat-message.tsx           # Individual message component
function-call-visualization.tsx  # MCP tool execution display
chat-sidebar.tsx           # Session management

// Dashboard
dashboard-overview.tsx     # System status and metrics
airtable-workspace.tsx     # Base and table management
system-metrics.tsx         # Real-time health monitoring
recent-activity.tsx        # Activity feed

// Cost Tracking
cost-chart.tsx            # Usage visualization
budget-alerts.tsx         # Alert management
model-usage-breakdown.tsx # AI model statistics
usage-metrics.tsx         # Performance analytics
```

## 🚀 Immediate Priorities

1. **Enhanced Real-time Features** (HIGH)
   ```typescript
   // WebSocket integration for real-time updates
   // Live function call progress tracking
   // Real-time system metrics dashboard
   ```

2. **Advanced Data Visualization** (HIGH)
   ```typescript
   // Interactive Airtable data charts
   // Cost trend analysis with predictions
   // System performance dashboards
   ```

3. **Improved User Experience** (MEDIUM)
   ```typescript
   // Advanced search and filtering
   // Keyboard shortcuts and accessibility
   // Offline support with service worker
   ```

## 🔮 Future Enhancements

### Phase 1 (Next Sprint)
- [ ] WebSocket integration for real-time updates
- [ ] Advanced data visualization components
- [ ] Improved mobile responsiveness
- [ ] Enhanced accessibility features

### Phase 2 (Next Month)
- [ ] Progressive Web App (PWA) capabilities
- [ ] Advanced theming and customization
- [ ] Drag-and-drop interface improvements
- [ ] Multi-language support (i18n)

### Phase 3 (Future)
- [ ] Advanced workflow builder interface
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboards
- [ ] AI-powered UI suggestions

## ⚠️ Known Issues
1. **Limited offline support** - Requires network connectivity
2. **Basic error boundaries** - Could have more granular error handling
3. **No PWA features** - Missing service worker and app manifest
4. **Limited accessibility** - Could improve keyboard navigation and screen reader support

## 🧪 Testing Strategy
```typescript
// Priority test coverage:
- Component unit tests with React Testing Library
- Integration tests for API interactions
- E2E tests for critical user flows
- Visual regression tests for UI consistency
- Performance tests for rendering optimization
```

## 📊 Performance Targets
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3s
- **Cumulative Layout Shift**: < 0.1
- **Bundle Size**: < 300KB gzipped

## 🤝 Service Dependencies
```
User Browser → Next.js Frontend → API Gateway → Backend Services
                     ↓
              Zustand Stores (Client State)
                     ↓
            TanStack Query (Server State)
```

## 💡 Development Tips
1. Use TypeScript for all components and props
2. Leverage TanStack Query for efficient data fetching
3. Implement proper loading and error states
4. Use Framer Motion for smooth animations
5. Follow shadcn/ui patterns for consistent design

## 🚨 Critical Configuration
```typescript
// API Client Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

// Service Endpoints
API_GATEWAY = "/api"          # Port 8000
LLM_ORCHESTRATOR = "/api/chat" # Port 8003  
MCP_SERVER = "/api/tools"     # Port 8001
AIRTABLE_GATEWAY = "/api/airtable" # Port 8002
```

## 🔒 Security Considerations
- **API Key Management**: Secure storage in environment variables
- **Session Management**: JWT token handling with refresh logic
- **CORS Configuration**: Proper origin restrictions
- **Content Security Policy**: XSS prevention headers
- **Input Sanitization**: User input validation and sanitization

## 📈 Monitoring Metrics
```typescript
// Key metrics to track:
frontend_page_views_total{page}        # Page visit analytics
frontend_api_calls_total{endpoint}     # API usage patterns
frontend_error_rate{component}         # Error tracking
frontend_performance_metrics{metric}   # Core Web Vitals
frontend_user_interactions{action}     # User behavior
```

## 🎯 Key Features

### AI Chat Interface
- Real-time conversation with AI agents
- Function call visualization for MCP tools
- Session management with history
- Markdown rendering with syntax highlighting

### Airtable Integration
- Base and table management interface
- Record CRUD operations with forms
- Advanced search and filtering
- Data visualization with charts and tables

### Cost Management
- Real-time budget monitoring
- Usage analytics with trends
- Model performance comparisons
- Alert system for budget overruns

### System Monitoring
- Real-time health checks for all services
- Performance metrics dashboard
- Error tracking and reporting
- System status overview

## 🔄 State Management Architecture

```typescript
// Chat Store
interface ChatStore {
  sessions: ChatSession[]
  currentSession: string | null
  messages: Message[]
  isTyping: boolean
  functionCalls: FunctionCall[]
}

// App Store  
interface AppStore {
  user: User | null
  settings: UserSettings
  systemStatus: SystemStatus
  notifications: Notification[]
}

// Airtable Store
interface AirtableStore {
  bases: Base[]
  currentBase: string | null
  tables: Table[]
  currentTable: string | null
  records: Record[]
}
```

## 🎨 Design System

### Component Architecture
- **Atomic Design**: Atoms, molecules, organisms pattern
- **Consistent Theming**: CSS variables with dark/light modes
- **Responsive Grid**: Tailwind CSS breakpoint system
- **Accessibility**: ARIA labels and keyboard navigation

### Visual Hierarchy
- **Typography**: Inter font with semantic size scale
- **Colors**: Professional palette with semantic color system
- **Spacing**: 8px grid system for consistency
- **Icons**: Lucide React icons for consistency

Remember: This frontend is the **user's window** into the PyAirtable AI ecosystem - every interaction should be intuitive, responsive, and delightful!
## 🚀 Development Workflow

### Quick Start Commands
```bash
# Initial setup
npm install
npm run dev          # Start development server on port 3000

# Docker development
docker-compose up    # Start all services
make dev-start      # Alternative with Makefile

# Testing
npm test            # Run unit tests  
npm run e2e         # Run E2E tests with Playwright
./scripts/test-local.sh --all  # Complete test suite

# Building
npm run build       # Production build
./scripts/build-local.sh --all --parallel  # Build all apps
```

### Git Workflow
1. Create feature branch: `git checkout -b feat/feature-name`
2. Make changes with TDD approach
3. Commit with: `/commit` (uses conventional commits)
4. Create PR with: `/create-pr`
5. Address reviews and merge

### Code Standards
- **TypeScript**: Strict mode enabled, no any types
- **Components**: Functional with hooks, max 200 lines
- **Testing**: Minimum 80% coverage
- **Performance**: Lazy load heavy components
- **Security**: Input validation, XSS prevention

### Common Tasks
- Fix a bug: Use `/fix-github-issue [issue-number]`
- Update docs: Make changes then `/add-to-changelog`
- Clean code: Use `/clean` to fix formatting issues
- Review PR: Use `/pr-review` for systematic review

## 🛠️ Local Development Setup

### Environment Variables
Create `.env.local` with:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AUTH_URL=http://localhost:8081
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pyairtable
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
```

### Service Dependencies
- API Gateway: Port 8000
- Auth Service: Port 8081
- PostgreSQL: Port 5432
- Redis: Port 6379

### Debugging Tips
- Use React DevTools for component inspection
- Check Network tab for API calls
- Enable source maps in development
- Use `console.time()` for performance debugging

## 📝 Important Notes
- This project uses LOCAL deployment (no cloud dependencies)
- All secrets managed via GitHub repository secrets
- Supports Docker, Minikube, Podman, and Colima
- Follow conventional commits for Git history
