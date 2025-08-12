// Basic Onboarding Components
export { default as BasicOnboarding } from './BasicOnboarding'
export { OnboardingStepper } from './OnboardingStepper'
export { ProfileSetupForm } from './ProfileSetupForm'
export { AirtableConnectionForm } from './AirtableConnectionForm'
export { TemplateSelectionForm } from './TemplateSelectionForm'

// Utility Components
export { LoadingState } from './LoadingState'
export { OnboardingErrorBoundary } from './OnboardingErrorBoundary'

// Comprehensive Onboarding (existing)
export { default as ComprehensiveOnboarding } from './ComprehensiveOnboarding'
export { default as AirtableConnectionWizard } from './AirtableConnectionWizard'
export { default as BaseConfigurationStep } from './BaseConfigurationStep'
export { default as InteractiveProductTour } from './InteractiveProductTour'
export { default as FirstAIInteractionDemo } from './FirstAIInteractionDemo'

// Types
export interface OnboardingData {
  profile: {
    name: string
    company: string
    role: string
  }
  airtable: {
    apiKey: string
    selectedBaseId: string
    selectedBaseName: string
  }
  template: {
    templateId: string
    templateName: string
  }
}

export interface StepperStep {
  id: number
  title: string
  description: string
  icon: any
}