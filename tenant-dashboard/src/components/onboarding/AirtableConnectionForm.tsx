"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowRight,
  ArrowLeft,
  Database,
  Key,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw
} from "lucide-react"

const airtableSchema = z.object({
  apiKey: z.string().min(1, "API key is required").regex(
    /^pat[a-zA-Z0-9]{14}\.[a-zA-Z0-9]{64}$/,
    "Invalid Airtable Personal Access Token format"
  ),
  selectedBaseId: z.string().min(1, "Please select a base"),
})

type AirtableFormData = z.infer<typeof airtableSchema>

interface AirtableBase {
  id: string
  name: string
  permissionLevel: string
  tables?: number
}

interface AirtableConnectionFormProps {
  data: {
    apiKey: string
    selectedBaseId: string
    selectedBaseName: string
  }
  onUpdate: (data: any) => void
  onNext: () => void
  onPrev: () => void
  isLoading: boolean
  error: string | null
  setError: (error: string | null) => void
}

export function AirtableConnectionForm({
  data,
  onUpdate,
  onNext,
  onPrev,
  isLoading,
  error,
  setError
}: AirtableConnectionFormProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isLoadingBases, setIsLoadingBases] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [availableBases, setAvailableBases] = useState<AirtableBase[]>([])
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue
  } = useForm<AirtableFormData>({
    resolver: zodResolver(airtableSchema),
    defaultValues: {
      apiKey: data.apiKey,
      selectedBaseId: data.selectedBaseId
    },
    mode: "onChange"
  })

  const watchedApiKey = watch("apiKey")
  const watchedBaseId = watch("selectedBaseId")

  const testConnection = async (apiKey: string) => {
    try {
      setIsTestingConnection(true)
      setConnectionStatus('idle')
      setError(null)

      const response = await fetch("/api/airtable/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: apiKey }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to validate API key")
      }

      setConnectionStatus('success')
      return true
    } catch (error) {
      console.error("Connection test failed:", error)
      setConnectionStatus('error')
      setError(error instanceof Error ? error.message : "Failed to test connection")
      return false
    } finally {
      setIsTestingConnection(false)
    }
  }

  const loadAvailableBases = async (apiKey: string) => {
    try {
      setIsLoadingBases(true)
      setError(null)

      const response = await fetch("/api/airtable/bases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: apiKey }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load bases")
      }

      setAvailableBases(result.bases || [])
    } catch (error) {
      console.error("Failed to load bases:", error)
      setError(error instanceof Error ? error.message : "Failed to load bases")
      setAvailableBases([])
    } finally {
      setIsLoadingBases(false)
    }
  }

  const handleApiKeyTest = async () => {
    if (!watchedApiKey) return
    
    const isValid = await testConnection(watchedApiKey)
    if (isValid) {
      await loadAvailableBases(watchedApiKey)
    }
  }

  const handleBaseSelection = (base: AirtableBase) => {
    setValue("selectedBaseId", base.id, { shouldValidate: true })
    onUpdate({
      apiKey: watchedApiKey,
      selectedBaseId: base.id,
      selectedBaseName: base.name
    })
  }

  const onSubmit = (formData: AirtableFormData) => {
    const selectedBase = availableBases.find(base => base.id === formData.selectedBaseId)
    onUpdate({
      apiKey: formData.apiKey,
      selectedBaseId: formData.selectedBaseId,
      selectedBaseName: selectedBase?.name || ""
    })
    onNext()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Database className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Connect your Airtable</CardTitle>
          <CardDescription className="text-base">
            Link your Airtable account to access your data with PyAirtable
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* API Key Input */}
            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                Personal Access Token
              </label>
              
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder="pat12345678901234.1234567890123456789012345678901234567890123456789012"
                  {...register("apiKey")}
                  className={errors.apiKey ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {errors.apiKey && (
                <p className="text-sm text-red-600">{errors.apiKey.message}</p>
              )}

              {/* Connection Test Button */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApiKeyTest}
                  disabled={!watchedApiKey || isTestingConnection || !!errors.apiKey}
                  className="flex items-center gap-2"
                >
                  {isTestingConnection ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Test Connection
                </Button>

                {connectionStatus === 'success' && (
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Connected successfully
                  </div>
                )}
              </div>

              {/* Help Link */}
              <p className="text-sm text-muted-foreground">
                Don't have a Personal Access Token?{" "}
                <a
                  href="https://airtable.com/developers/web/guides/personal-access-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                >
                  Get one here <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            {/* Base Selection */}
            <AnimatePresence>
              {connectionStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    Select a Base
                  </label>

                  {isLoadingBases ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading your bases...</span>
                    </div>
                  ) : availableBases.length > 0 ? (
                    <div className="grid gap-2 max-h-48 overflow-y-auto">
                      {availableBases.map((base) => (
                        <motion.div
                          key={base.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            watchedBaseId === base.id
                              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                              : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                          }`}
                          onClick={() => handleBaseSelection(base)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-sm">{base.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                Permission: {base.permissionLevel}
                                {base.tables && ` • ${base.tables} tables`}
                              </p>
                            </div>
                            {watchedBaseId === base.id && (
                              <CheckCircle className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No bases found or insufficient permissions</p>
                    </div>
                  )}

                  {errors.selectedBaseId && (
                    <p className="text-sm text-red-600">{errors.selectedBaseId.message}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onPrev}
                disabled={isLoading}
                className="min-w-[120px]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              <Button
                type="submit"
                size="lg"
                disabled={!isValid || connectionStatus !== 'success' || isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Please wait...
                  </div>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
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