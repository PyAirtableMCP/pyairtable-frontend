"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowRight,
  User,
  Building2,
  Briefcase,
  AlertCircle
} from "lucide-react"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().min(2, "Company name must be at least 2 characters"),
  role: z.string().min(2, "Role must be at least 2 characters"),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileSetupFormProps {
  data: ProfileFormData
  onUpdate: (data: ProfileFormData) => void
  onNext: () => void
  isLoading: boolean
  error: string | null
  setError: (error: string | null) => void
}

const ROLE_SUGGESTIONS = [
  "CEO/Founder",
  "CTO/Technical Lead",
  "Product Manager",
  "Data Analyst",
  "Operations Manager",
  "Marketing Manager",
  "Project Manager",
  "Developer",
  "Designer",
  "Other"
]

export function ProfileSetupForm({
  data,
  onUpdate,
  onNext,
  isLoading,
  error,
  setError
}: ProfileSetupFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: data,
    mode: "onChange"
  })

  const watchedValues = watch()

  // Update parent component with form data changes
  React.useEffect(() => {
    if (isValid) {
      onUpdate(watchedValues)
      setError(null)
    }
  }, [watchedValues, isValid, onUpdate, setError])

  const onSubmit = (formData: ProfileFormData) => {
    onUpdate(formData)
    onNext()
  }

  const handleRoleSelection = (role: string) => {
    setValue("role", role, { shouldValidate: true })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Tell us about yourself</CardTitle>
          <CardDescription className="text-base">
            Help us personalize your PyAirtable experience
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
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Full Name
              </label>
              <Input
                id="name"
                placeholder="Enter your full name"
                {...register("name")}
                className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Company Field */}
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Company Name
              </label>
              <Input
                id="company"
                placeholder="Enter your company name"
                {...register("company")}
                className={errors.company ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.company && (
                <p className="text-sm text-red-600">{errors.company.message}</p>
              )}
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Your Role
              </label>
              <Input
                id="role"
                placeholder="Enter your role or select from suggestions"
                {...register("role")}
                className={errors.role ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role.message}</p>
              )}
              
              {/* Role Suggestions */}
              <div className="flex flex-wrap gap-2 mt-3">
                {ROLE_SUGGESTIONS.map((role) => (
                  <Button
                    key={role}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => handleRoleSelection(role)}
                  >
                    {role}
                  </Button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={!isValid || isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
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

          {/* Preview */}
          {isValid && (
            <motion.div
              className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-sm font-medium text-blue-900 mb-2">Profile Preview</h3>
              <div className="space-y-1 text-sm text-blue-700">
                <p><span className="font-medium">Name:</span> {watchedValues.name}</p>
                <p><span className="font-medium">Company:</span> {watchedValues.company}</p>
                <p><span className="font-medium">Role:</span> {watchedValues.role}</p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}