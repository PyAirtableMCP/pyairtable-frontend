# PyAirtable AI Frontend

The complete Next.js 15 frontend application for the PyAirtable AI automation platform - "The Marvel of Technology".

## 🚀 Features

### Core Capabilities
- **Real-time AI Chat Interface** with 14 MCP tools integration
- **Comprehensive Airtable Dashboard** with data visualization
- **Advanced Cost Tracking** with budget monitoring and alerts
- **Complete Settings Management** with user preferences
- **Real-time System Monitoring** with health checks and metrics

### Technical Architecture
- **Next.js 15** with App Router and TypeScript
- **shadcn/ui** components with Tailwind CSS
- **Zustand** for state management
- **TanStack Query** for API calls and caching
- **Framer Motion** for smooth animations
- **Recharts** for data visualization

### Microservices Integration
- **API Gateway** (port 8000) - Central routing and authentication
- **LLM Orchestrator** (port 8003) - AI conversation management
- **MCP Server** (port 8001) - Model Context Protocol tools
- **Airtable Gateway** (port 8002) - High-performance Airtable API

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── chat/                 # AI chat interface
│   ├── cost/                 # Cost tracking and analytics
│   ├── dashboard/            # Main dashboard
│   ├── settings/             # User settings
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── components/
│   ├── chat/                 # Chat interface components
│   ├── cost/                 # Cost tracking components
│   ├── dashboard/            # Dashboard components
│   ├── settings/             # Settings components
│   ├── providers/            # Context providers
│   └── ui/                   # Reusable UI components
├── lib/
│   ├── queries/              # TanStack Query hooks
│   ├── api-client.ts         # API client configuration
│   └── utils.ts              # Utility functions
├── store/                    # Zustand state stores
├── types/                    # TypeScript type definitions
└── hooks/                    # Custom React hooks
```

## 🛠 Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Ensure microservices are running on their respective ports

## 🎯 Key Components

### 1. Landing Page (`/`)
- Hero section showcasing platform capabilities
- Feature cards for navigation
- 14 MCP tools showcase
- Microservices architecture overview

### 2. Chat Interface (`/chat`)
- Real-time AI conversations
- Function call visualizations
- Session management
- MCP tool integration

### 3. Dashboard (`/dashboard`)
- System metrics and health monitoring
- Airtable workspace management
- Recent activity feed
- Performance analytics

### 4. Cost Tracking (`/cost`)
- Budget monitoring with alerts
- Usage analytics and trends
- Model breakdown and performance
- Cost optimization insights

### 5. Settings (`/settings`)
- User preferences and profile
- AI model configuration
- Notification settings
- Airtable integration
- Security management

## 🔧 API Integration

The application integrates with 4 Python microservices:

```typescript
// API Client Configuration
export const gatewayClient = new ApiClient("/api/gateway")    // Port 8000
export const llmClient = new ApiClient("/api/llm")            // Port 8003
export const mcpClient = new ApiClient("/api/mcp")            // Port 8001  
export const airtableClient = new ApiClient("/api/airtable")  // Port 8002
```

### Supported Operations
- **Chat Management**: Sessions, messages, function calls
- **Airtable Operations**: Bases, tables, records, search
- **System Monitoring**: Health checks, metrics, alerts
- **Cost Tracking**: Usage statistics, budget management

## 🎨 UI Components

Built with shadcn/ui for consistent design:
- **Forms**: Input, Select, Switch, Slider components
- **Data Display**: Cards, Tables, Charts, Badges
- **Feedback**: Toasts, Progress bars, Loading states
- **Navigation**: Sidebar, Tabs, Breadcrumbs

## 📊 State Management

### Chat Store (`useChatStore`)
- Session management
- Message history
- Function call tracking
- Real-time updates

### App Store (`useAppStore`)
- User settings
- System status
- Dashboard metrics
- Budget alerts

### Airtable Store (`useAirtableStore`)
- Base and table selection
- Record management
- CRUD operations
- Data synchronization

## 🔍 Data Fetching

TanStack Query for efficient data management:
- **Automatic caching** with smart invalidation
- **Background refetching** for real-time data
- **Optimistic updates** for better UX
- **Error handling** with retry logic

## 🎭 Animations

Framer Motion for smooth interactions:
- **Page transitions** and component animations
- **Function call visualizations**
- **Loading states** and micro-interactions
- **Responsive animations** across devices

## 📱 Responsive Design

Mobile-first approach:
- **Collapsible sidebar** with adaptive navigation
- **Responsive charts** and data visualizations
- **Touch-optimized** components
- **Breakpoint-aware** layouts

## 🔐 Security Features

- **API key management** with secure storage
- **Session monitoring** and management
- **Activity logging** and audit trails
- **Secure authentication** flow

## 🚀 Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Run with Docker
docker build -t pyairtable-frontend .
docker run -p 3000:3000 pyairtable-frontend
```

## 📈 Performance

Optimized for production:
- **Code splitting** with dynamic imports
- **Image optimization** with Next.js
- **Bundle analysis** and tree shaking
- **Caching strategies** for API calls

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with UI
npm run test:ui

# Coverage report
npm run test:coverage
```

## 📄 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking
- `npm run format` - Format code with Prettier

## 🌟 The Marvel of Technology

This frontend represents the culmination of modern web development practices, showcasing:
- **Cutting-edge React patterns** with hooks and suspense
- **Advanced TypeScript** usage with strict typing
- **Modern CSS** with Tailwind and CSS-in-JS
- **Performance optimization** techniques
- **Accessibility compliance** (WCAG 2.1)
- **Developer experience** with hot reloading and debugging

Built for the future of AI-powered Airtable automation. 🚀