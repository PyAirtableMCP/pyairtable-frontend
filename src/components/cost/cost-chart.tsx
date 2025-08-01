"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Mock data - replace with real API calls
const mockData = [
  { date: "Jan", cost: 45.20, tokens: 850000 },
  { date: "Feb", cost: 52.10, tokens: 920000 },
  { date: "Mar", cost: 38.90, tokens: 780000 },
  { date: "Apr", cost: 67.30, tokens: 1200000 },
  { date: "May", cost: 81.50, tokens: 1450000 },
  { date: "Jun", cost: 73.20, tokens: 1320000 },
  { date: "Jul", cost: 95.60, tokens: 1680000 },
  { date: "Aug", cost: 127.50, tokens: 2400000 },
]

export function CostChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Trends</CardTitle>
        <CardDescription>
          Monthly spending and token usage over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockData}>
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
            <Tooltip 
              formatter={(value, name) => [
                name === "cost" ? `$${value}` : `${(value as number).toLocaleString()}`,
                name === "cost" ? "Cost" : "Tokens"
              ]}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="cost" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}