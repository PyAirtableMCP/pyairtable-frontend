import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Dynamic import for heavy onboarding component with framer-motion
const BasicOnboarding = dynamic(
  () => import('@/components/onboarding/BasicOnboarding'),
  {
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading onboarding experience...</p>
        </div>
      </div>
    ),
    ssr: false
  }
)

export default function OnboardingPage() {
  return <BasicOnboarding />
}

export const metadata = {
  title: "Get Started - PyAirtable",
  description: "Set up your PyAirtable workspace in 3 simple steps",
}