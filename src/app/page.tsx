"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, 
  Database, 
  Zap, 
  TrendingUp, 
  MessageSquare, 
  Settings,
  ChevronRight,
  Sparkles,
  BarChart3,
  Shield
} from "lucide-react"
import Link from "next/link"

const features = [
  {
    icon: MessageSquare,
    title: "AI Chat Interface",
    description: "Real-time conversations with function calling visualization",
    href: "/chat",
    color: "text-blue-600 dark:text-blue-400"
  },
  {
    icon: Database,
    title: "Airtable Dashboard",
    description: "Comprehensive workspace management and data visualization",
    href: "/dashboard",
    color: "text-green-600 dark:text-green-400"
  },
  {
    icon: BarChart3,
    title: "Cost Tracking",
    description: "Live budget monitoring and usage analytics",
    href: "/cost",
    color: "text-purple-600 dark:text-purple-400"
  },
  {
    icon: Settings,
    title: "Configuration",
    description: "Customize your AI automation preferences",
    href: "/settings",
    color: "text-orange-600 dark:text-orange-400"
  }
]

const mcpTools = [
  "Airtable Operations", "Data Analysis", "Record Search", "Table Schema",
  "Field Management", "View Operations", "Batch Processing", "Data Validation",
  "Query Builder", "Export Tools", "Import Tools", "Workflow Automation",
  "Data Insights", "Performance Monitoring"
]

const stats = [
  { label: "MCP Tools", value: "14", icon: Zap },
  { label: "Microservices", value: "6", icon: Brain },
  { label: "API Endpoints", value: "40+", icon: Database },
  { label: "Success Rate", value: "99.9%", icon: TrendingUp }
]

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-grid-slate-100/50 dark:bg-grid-slate-700/25" />
        <div className="relative container mx-auto px-4 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-4 text-sm px-4 py-2" variant="secondary">
              <Sparkles className="w-4 h-4 mr-2" />
              The Marvel of Technology
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PyAirtable AI Platform
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Unleash the power of AI-driven Airtable automation with our cutting-edge 
              microservices architecture featuring 14 MCP tools and real-time intelligence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/chat">
                  Start Chatting
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link href="/dashboard">
                  View Dashboard
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <stat.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to automate and optimize your Airtable workflows 
              with AI-powered intelligence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 group cursor-pointer">
                  <Link href={feature.href}>
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className={`w-6 h-6 ${feature.color}`} />
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {feature.title}
                      </CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MCP Tools Section */}
      <section className="py-24 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              14 Powerful MCP Tools
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive suite of Model Context Protocol tools provides 
              unprecedented automation capabilities.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mcpTools.map((tool, index) => (
              <motion.div
                key={tool}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Badge 
                  variant="secondary" 
                  className="w-full justify-center py-3 text-sm hover:bg-primary hover:text-primary-foreground transition-colors duration-200 cursor-default"
                >
                  {tool}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Microservices Architecture
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built on a robust foundation of specialized microservices for 
              maximum scalability and reliability.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "API Gateway",
                description: "Central entry point with routing and authentication",
                port: "8000",
                icon: Shield
              },
              {
                title: "LLM Orchestrator",
                description: "Intelligent conversation management and function calling",
                port: "8003",
                icon: Brain
              },
              {
                title: "MCP Server",
                description: "Model Context Protocol tool execution engine",
                port: "8001",
                icon: Zap
              },
              {
                title: "Airtable Gateway",
                description: "High-performance Airtable API integration",
                port: "8002",
                icon: Database
              }
            ].map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <service.icon className="w-5 h-5 text-primary" />
                      </div>
                      <Badge variant="outline">:{service.port}</Badge>
                    </div>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Experience the Marvel?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join the future of AI-powered Airtable automation. Start your journey 
              with our intelligent platform today.
            </p>
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link href="/chat">
                Get Started Now
                <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}