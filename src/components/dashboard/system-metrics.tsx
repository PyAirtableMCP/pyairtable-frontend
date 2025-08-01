"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { 
  Server, 
  Database, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  Cpu,
  HardDrive,
  Network
} from "lucide-react"

// Mock data for system metrics
const performanceData = [
  { time: "00:00", cpu: 45, memory: 62, network: 23 },
  { time: "04:00", cpu: 52, memory: 58, network: 31 },
  { time: "08:00", cpu: 78, memory: 71, network: 45 },
  { time: "12:00", cpu: 82, memory: 73, network: 52 },
  { time: "16:00", cpu: 71, memory: 69, network: 38 },
  { time: "20:00", cpu: 59, memory: 64, network: 29 },
  { time: "24:00", cpu: 48, memory: 61, network: 25 }
]

const responseTimeData = [
  { time: "00:00", api: 145, llm: 1800, mcp: 320 },
  { time: "04:00", api: 132, llm: 1650, mcp: 295 },
  { time: "08:00", api: 156, llm: 2100, mcp: 380 },
  { time: "12:00", api: 178, llm: 2250, mcp: 420 },
  { time: "16:00", api: 162, llm: 1950, mcp: 365 },
  { time: "20:00", api: 149, llm: 1720, mcp: 340 },
  { time: "24:00", api: 138, llm: 1580, mcp: 310 }
]

const microservices = [
  {
    name: "API Gateway",
    status: "healthy",
    responseTime: 145,
    uptime: 99.9,
    requests: 15420,
    port: 8000,
    icon: Server
  },
  {
    name: "LLM Orchestrator", 
    status: "healthy",
    responseTime: 1850,
    uptime: 99.7,
    requests: 8420,
    port: 8003,
    icon: Zap
  },
  {
    name: "MCP Server",
    status: "healthy", 
    responseTime: 325,
    uptime: 99.8,
    requests: 12850,
    port: 8001,
    icon: Activity
  },
  {
    name: "Airtable Gateway",
    status: "degraded",
    responseTime: 890,
    uptime: 98.2,
    requests: 6720,
    port: 8002,
    icon: Database
  }
]

const systemResources = [
  {
    name: "CPU Usage",
    value: 68,
    status: "normal",
    icon: Cpu,
    details: "4 cores @ 2.8GHz"
  },
  {
    name: "Memory",
    value: 72,
    status: "normal", 
    icon: HardDrive,
    details: "5.8GB / 8GB used"
  },
  {
    name: "Network I/O",
    value: 42,
    status: "normal",
    icon: Network,
    details: "45 Mbps avg"
  }
]

export function SystemMetrics() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-600"
      case "degraded": return "text-yellow-600"
      case "down": return "text-red-600"
      default: return "text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="w-4 h-4" />
      case "degraded": return <AlertTriangle className="w-4 h-4" />
      case "down": return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* System Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {systemResources.map((resource) => (
          <Card key={resource.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {resource.name}
              </CardTitle>
              <resource.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{resource.value}%</div>
              <Progress value={resource.value} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">
                {resource.details}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Microservices Status */}
      <Card>
        <CardHeader>
          <CardTitle>Microservices Health</CardTitle>
          <CardDescription>
            Real-time status of all microservices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {microservices.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <service.icon className="w-5 h-5 text-primary" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{service.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        :{service.port}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{service.requests.toLocaleString()} requests</span>
                      <span>{service.uptime}% uptime</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {service.responseTime}ms
                    </div>
                    <div className="text-xs text-muted-foreground">
                      avg response
                    </div>
                  </div>
                  
                  <Badge 
                    variant="outline"
                    className={`${getStatusColor(service.status)} border-current`}
                  >
                    {getStatusIcon(service.status)}
                    <span className="ml-1 capitalize">{service.status}</span>
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Performance */}
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>
              CPU, memory, and network usage over 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="cpu" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="CPU (%)"
                />
                <Area 
                  type="monotone" 
                  dataKey="memory" 
                  stackId="2"
                  stroke="#10b981" 
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="Memory (%)"
                />
                <Area 
                  type="monotone" 
                  dataKey="network" 
                  stackId="3"
                  stroke="#8b5cf6" 
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                  name="Network (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response Times */}
        <Card>
          <CardHeader>
            <CardTitle>Response Times</CardTitle>
            <CardDescription>
              Average response times by service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip formatter={(value) => [`${value}ms`, ""]} />
                <Line 
                  type="monotone" 
                  dataKey="api" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="API Gateway"
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="llm" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="LLM Orchestrator"
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="mcp" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="MCP Server"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <CardTitle>System Actions</CardTitle>
          <CardDescription>
            Quick actions for system management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              Restart Services
            </Button>
            <Button variant="outline" size="sm">
              Clear Cache
            </Button>
            <Button variant="outline" size="sm">
              View Logs
            </Button>
            <Button variant="outline" size="sm">
              Health Check
            </Button>
            <Button variant="outline" size="sm">
              Export Metrics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}