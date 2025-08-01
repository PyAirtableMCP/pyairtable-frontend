"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Zap, DollarSign, Clock, Settings } from "lucide-react"

const models = [
  {
    name: "GPT-4",
    provider: "OpenAI",
    cost: "$0.03/1K tokens",
    performance: 95,
    speed: 75,
    available: true,
    recommended: true
  },
  {
    name: "GPT-3.5 Turbo",
    provider: "OpenAI", 
    cost: "$0.002/1K tokens",
    performance: 85,
    speed: 95,
    available: true,
    recommended: false
  },
  {
    name: "Claude-3 Sonnet",
    provider: "Anthropic",
    cost: "$0.015/1K tokens",
    performance: 92,
    speed: 85,
    available: true,
    recommended: false
  },
  {
    name: "Claude-3 Haiku",
    provider: "Anthropic",
    cost: "$0.0008/1K tokens",
    performance: 80,
    speed: 98,
    available: true,
    recommended: false
  }
]

export function ModelSettings() {
  return (
    <div className="space-y-6">
      {/* Default Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Model Configuration
          </CardTitle>
          <CardDescription>
            Configure your default AI model and parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Model</Label>
            <Select defaultValue="gpt-4">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">
                  <div className="flex items-center justify-between w-full">
                    <span>GPT-4</span>
                    <Badge variant="secondary">Recommended</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="claude-3-sonnet">Claude-3 Sonnet</SelectItem>
                <SelectItem value="claude-3-haiku">Claude-3 Haiku</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Temperature: 0.7</Label>
            <Slider defaultValue={[0.7]} max={2} min={0} step={0.1} />
            <p className="text-sm text-muted-foreground">
              Controls randomness in responses. Higher values make output more creative.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max-tokens">Max Tokens</Label>
            <Input 
              id="max-tokens" 
              type="number" 
              defaultValue="2048"
              placeholder="Maximum tokens per response"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="streaming" defaultChecked />
            <Label htmlFor="streaming">Enable streaming responses</Label>
          </div>
        </CardContent>
      </Card>

      {/* Available Models */}
      <Card>
        <CardHeader>
          <CardTitle>Available Models</CardTitle>
          <CardDescription>
            View and configure all supported AI models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {models.map((model) => (
              <div
                key={model.name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{model.name}</h4>
                    <Badge variant="outline">{model.provider}</Badge>
                    {model.recommended && (
                      <Badge variant="default">Recommended</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <DollarSign className="w-3 h-3" />
                        Cost
                      </div>
                      <div className="font-medium">{model.cost}</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Brain className="w-3 h-3" />
                        Performance
                      </div>
                      <Progress value={model.performance} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Clock className="w-3 h-3" />
                        Speed
                      </div>
                      <Progress value={model.speed} className="h-2" />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch checked={model.available} />
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Function Calling Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Function Calling
          </CardTitle>
          <CardDescription>
            Configure how the AI uses MCP tools and function calling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="auto-functions" defaultChecked />
            <Label htmlFor="auto-functions">
              <div>
                <div>Automatic function calling</div>
                <div className="text-sm text-muted-foreground">
                  Allow the AI to automatically call appropriate functions
                </div>
              </div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="confirm-functions" />
            <Label htmlFor="confirm-functions">
              <div>
                <div>Confirm before function calls</div>
                <div className="text-sm text-muted-foreground">
                  Ask for confirmation before executing functions
                </div>
              </div>
            </Label>
          </div>
          
          <div className="space-y-2">
            <Label>Function Call Timeout (seconds)</Label>
            <Input type="number" defaultValue="30" />
          </div>
          
          <div className="space-y-2">
            <Label>Max Concurrent Function Calls</Label>
            <Select defaultValue="3">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Performance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Performance & Limits</CardTitle>
          <CardDescription>
            Configure performance and usage limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rate-limit">Rate Limit (requests/minute)</Label>
            <Input id="rate-limit" type="number" defaultValue="60" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timeout">Request Timeout (seconds)</Label>
            <Input id="timeout" type="number" defaultValue="120" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="retry-attempts">Retry Attempts</Label>
            <Select defaultValue="3">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 (No retries)</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="caching" defaultChecked />
            <Label htmlFor="caching">
              <div>
                <div>Enable response caching</div>
                <div className="text-sm text-muted-foreground">
                  Cache similar requests to improve performance and reduce costs
                </div>
              </div>
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}