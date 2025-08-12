"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Layout,
  BarChart3,
  Users,
  ShoppingCart,
  FileText,
  Calendar,
  Target,
  Briefcase,
  Star,
  Zap
} from "lucide-react"

const templateSchema = z.object({
  templateId: z.string().min(1, "Please select a template"),
})

type TemplateFormData = z.infer<typeof templateSchema>

interface WorkspaceTemplate {
  id: string
  name: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  icon: React.ReactNode
  features: string[]
  preview: string
  popular?: boolean
}

interface TemplateSelectionFormProps {
  data: {
    templateId: string
    templateName: string
  }
  onUpdate: (data: any) => void
  onPrev: () => void
  onComplete: () => void
  isCompleting: boolean
  isLoading: boolean
  error: string | null
  setError: (error: string | null) => void
}

const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  {
    id: "analytics-dashboard",
    name: "Analytics Dashboard",
    description: "Track KPIs and generate insights from your data",
    category: "Analytics",
    difficulty: "beginner",
    icon: <BarChart3 className="h-6 w-6" />,
    features: ["Data visualization", "KPI tracking", "Automated reports", "Custom metrics"],
    preview: "Perfect for data-driven decision making and performance monitoring",
    popular: true
  },
  {
    id: "crm-management",
    name: "CRM Management",
    description: "Manage customers, leads, and sales pipeline",
    category: "Sales",
    difficulty: "beginner",
    icon: <Users className="h-6 w-6" />,
    features: ["Contact management", "Deal tracking", "Activity logging", "Pipeline views"],
    preview: "Streamline your customer relationships and sales processes",
    popular: true
  },
  {
    id: "project-management",
    name: "Project Management",
    description: "Plan, track, and collaborate on projects",
    category: "Productivity",
    difficulty: "intermediate",
    icon: <Briefcase className="h-6 w-6" />,
    features: ["Task management", "Timeline views", "Team collaboration", "Progress tracking"],
    preview: "Keep your projects organized and on track"
  },
  {
    id: "inventory-tracking",
    name: "Inventory Management",
    description: "Track products, stock levels, and orders",
    category: "Operations",
    difficulty: "intermediate",
    icon: <ShoppingCart className="h-6 w-6" />,
    features: ["Stock monitoring", "Order management", "Supplier tracking", "Low stock alerts"],
    preview: "Manage your inventory efficiently and avoid stockouts"
  },
  {
    id: "content-calendar",
    name: "Content Calendar",
    description: "Plan and schedule your content strategy",
    category: "Marketing",
    difficulty: "beginner",
    icon: <Calendar className="h-6 w-6" />,
    features: ["Content planning", "Publishing schedule", "Campaign tracking", "Social media integration"],
    preview: "Organize your content creation and publishing workflow"
  },
  {
    id: "financial-tracker",
    name: "Financial Tracker",
    description: "Monitor expenses, revenue, and budgets",
    category: "Finance",
    difficulty: "intermediate",
    icon: <Target className="h-6 w-6" />,
    features: ["Expense tracking", "Budget management", "Revenue analysis", "Financial reports"],
    preview: "Keep your finances organized and under control"
  },
  {
    id: "document-library",
    name: "Document Library",
    description: "Organize and manage your documents and files",
    category: "Productivity",
    difficulty: "beginner",
    icon: <FileText className="h-6 w-6" />,
    features: ["File organization", "Version control", "Access permissions", "Search functionality"],
    preview: "Centralize your document management and improve accessibility"
  },
  {
    id: "custom-workspace",
    name: "Custom Workspace",
    description: "Start with a blank workspace and customize it yourself",
    category: "Custom",
    difficulty: "advanced",
    icon: <Layout className="h-6 w-6" />,
    features: ["Full customization", "Flexible structure", "Advanced features", "Expert support"],
    preview: "Build a workspace tailored to your specific needs"
  }
]

export function TemplateSelectionForm({
  data,
  onUpdate,
  onPrev,
  onComplete,
  isCompleting,
  isLoading,
  error,
  setError
}: TemplateSelectionFormProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<WorkspaceTemplate | null>(
    WORKSPACE_TEMPLATES.find(t => t.id === data.templateId) || null
  )

  const {
    handleSubmit,
    formState: { isValid },
    setValue
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      templateId: data.templateId
    },
    mode: "onChange"
  })

  const handleTemplateSelection = (template: WorkspaceTemplate) => {
    setSelectedTemplate(template)
    setValue("templateId", template.id, { shouldValidate: true })
    onUpdate({
      templateId: template.id,
      templateName: template.name
    })
    setError(null)
  }

  const onSubmit = () => {
    if (selectedTemplate) {
      onComplete()
    }
  }

  const getDifficultyColor = (difficulty: WorkspaceTemplate['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <Layout className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl">Choose your workspace template</CardTitle>
          <CardDescription className="text-base">
            Select a template to get started quickly, or choose a custom workspace for full flexibility
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {WORKSPACE_TEMPLATES.map((template) => (
                <motion.div
                  key={template.id}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? "border-purple-500 bg-purple-50 ring-2 ring-purple-500/20"
                      : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                  }`}
                  onClick={() => handleTemplateSelection(template)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  layout
                >
                  {/* Popular Badge */}
                  {template.popular && (
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-orange-100 text-orange-800 border-orange-300 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Popular
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm border">
                      {template.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{template.name}</h3>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getDifficultyColor(template.difficulty)}`}
                        >
                          {template.difficulty}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">
                        {template.description}
                      </p>
                      
                      <p className="text-xs text-gray-600 mb-3">
                        {template.preview}
                      </p>
                      
                      <div className="flex flex-wrap gap-1">
                        {template.features.slice(0, 3).map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs py-0 px-2">
                            {feature}
                          </Badge>
                        ))}
                        {template.features.length > 3 && (
                          <Badge variant="outline" className="text-xs py-0 px-2">
                            +{template.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {selectedTemplate?.id === template.id && (
                      <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Selected Template Preview */}
            {selectedTemplate && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-purple-50 rounded-lg border border-purple-200"
              >
                <h3 className="text-sm font-medium text-purple-900 mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Selected: {selectedTemplate.name}
                </h3>
                <p className="text-sm text-purple-700 mb-3">
                  {selectedTemplate.preview}
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedTemplate.features.map((feature) => (
                    <Badge key={feature} className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onPrev}
                disabled={isLoading || isCompleting}
                className="min-w-[120px]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              <Button
                type="submit"
                size="lg"
                disabled={!isValid || isLoading || isCompleting}
                className="min-w-[160px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isCompleting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Setting up workspace...
                  </div>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}