"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Brain, Zap, Clock, DollarSign } from "lucide-react"

// Mock data - replace with real API calls
const modelData = [
  {
    model: "GPT-4",
    cost: 82.30,
    tokens: 1450000,
    calls: 1247,
    avgResponseTime: 1.8,
    percentage: 65,
    color: "#3b82f6"
  },
  {
    model: "GPT-3.5 Turbo",
    cost: 31.20,
    tokens: 2100000,
    calls: 3421,
    avgResponseTime: 0.9,
    percentage: 28,
    color: "#10b981"
  },
  {
    model: "Claude-3 Sonnet",
    cost: 14.00,
    tokens: 850000,
    calls: 892,
    avgResponseTime: 1.3,
    percentage: 7,
    color: "#8b5cf6"
  }
]

const dailyUsage = [
  { date: "Mon", gpt4: 12, gpt35: 24, claude: 3 },
  { date: "Tue", gpt35: 18, gpt4: 8, claude: 5 },
  { date: "Wed", gpt4: 22, gpt35: 15, claude: 2 },
  { date: "Thu", gpt4: 16, gpt35: 28, claude: 7 },
  { date: "Fri", gpt4: 19, gpt35: 21, claude: 4 },
  { date: "Sat", gpt4: 8, gpt35: 12, claude: 1 },
  { date: "Sun", gpt4: 14, gpt35: 16, claude: 3 }
]

export function ModelUsageBreakdown() {
  return (
    <div className="space-y-6">
      {/* Model Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modelData.map((model) => (
          <Card key={model.model}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{model.model}</CardTitle>
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: model.color }}
                />
              </div>
              <CardDescription>
                {model.percentage}% of total usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign className="w-3 h-3" />
                    Cost
                  </div>
                  <div className="text-lg font-semibold">
                    ${model.cost.toFixed(2)}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap className="w-3 h-3" />
                    Calls
                  </div>
                  <div className="text-lg font-semibold">
                    {model.calls.toLocaleString()}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Brain className="w-3 h-3" />
                    Tokens
                  </div>
                  <div className="text-sm font-medium">
                    {(model.tokens / 1000000).toFixed(1)}M
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Avg Time
                  </div>
                  <div className="text-sm font-medium">
                    {model.avgResponseTime}s
                  </div>
                </div>
              </div>
              
              <Progress value={model.percentage} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Usage Patterns</CardTitle>
            <CardDescription>
              Model usage distribution across the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip />
                <Bar dataKey="gpt4" stackId="a" fill="#3b82f6" name="GPT-4" />
                <Bar dataKey="gpt35" stackId="a" fill="#10b981" name="GPT-3.5" />
                <Bar dataKey="claude" stackId="a" fill="#8b5cf6" name="Claude-3" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Distribution</CardTitle>
            <CardDescription>
              Breakdown of spending by model
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={modelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ model, percentage }) => `${model}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="cost"
                >
                  {modelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Model Statistics</CardTitle>
          <CardDescription>
            Comprehensive breakdown of model performance and costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Model</th>
                  <th className="text-right p-2">Cost</th>
                  <th className="text-right p-2">Tokens</th>
                  <th className="text-right p-2">API Calls</th>
                  <th className="text-right p-2">Avg Response</th>
                  <th className="text-right p-2">Cost/Token</th>
                  <th className="text-right p-2">Usage %</th>
                </tr>
              </thead>
              <tbody>
                {modelData.map((model) => (
                  <tr key={model.model} className="border-b">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: model.color }}
                        />
                        {model.model}
                      </div>
                    </td>
                    <td className="text-right p-2 font-medium">
                      ${model.cost.toFixed(2)}
                    </td>
                    <td className="text-right p-2">
                      {(model.tokens / 1000000).toFixed(1)}M
                    </td>
                    <td className="text-right p-2">
                      {model.calls.toLocaleString()}
                    </td>
                    <td className="text-right p-2">
                      {model.avgResponseTime}s
                    </td>
                    <td className="text-right p-2">
                      ${(model.cost / model.tokens * 1000000).toFixed(4)}
                    </td>
                    <td className="text-right p-2">
                      <Badge variant="secondary">
                        {model.percentage}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}