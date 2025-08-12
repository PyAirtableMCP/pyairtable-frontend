import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// This would typically connect to your database
// For now, we'll simulate the database operations

// Comprehensive onboarding data structure
interface ComprehensiveOnboardingData {
  airtableConfig: {
    personalAccessToken: string
    baseId?: string
  }
  organization: {
    organizationName: string
    role: string
    teamSize: string
    industry?: string
    useCase?: string
  }
  selectedFeatures: string[]
  completedMilestones: string[]
  userType: 'beginner' | 'intermediate' | 'advanced'
  selectedBases: any[]
  skipTutorial: boolean
  preferences: {
    theme: string
    emailNotifications: boolean
    tourTooltips: boolean
    advancedMode: boolean
  }
  completionScore: number
  completionPercentage: number
  onboardingDuration: number
  feedback?: any
}

// Basic onboarding data structure  
interface BasicOnboardingData {
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

interface OnboardingRequest {
  type: 'comprehensive' | 'basic'
  data: ComprehensiveOnboardingData | BasicOnboardingData
  completedAt: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    const requestData: OnboardingRequest = await request.json()
    const { type, data, completedAt } = requestData

    // Handle basic onboarding flow
    if (type === 'basic') {
      const basicData = data as BasicOnboardingData
      
      // Validate required fields for basic onboarding
      if (!basicData.profile.name || !basicData.profile.company || !basicData.profile.role) {
        return NextResponse.json(
          { error: 'Profile information is required' },
          { status: 400 }
        )
      }

      if (!basicData.airtable.apiKey || !basicData.airtable.selectedBaseId) {
        return NextResponse.json(
          { error: 'Airtable connection is required' },
          { status: 400 }
        )
      }

      if (!basicData.template.templateId) {
        return NextResponse.json(
          { error: 'Workspace template selection is required' },
          { status: 400 }
        )
      }

      // Simulate database save for basic onboarding
      const savedData = {
        userId: session.user.email,
        onboardingType: 'basic',
        onboardingCompleted: true,
        completedAt,
        profile: basicData.profile,
        airtable: {
          hasToken: !!basicData.airtable.apiKey,
          tokenLength: basicData.airtable.apiKey.length,
          selectedBaseId: basicData.airtable.selectedBaseId,
          selectedBaseName: basicData.airtable.selectedBaseName
        },
        template: basicData.template
      }

      console.log('Basic onboarding completed for user:', session.user.email, {
        template: basicData.template.templateName,
        company: basicData.profile.company,
        role: basicData.profile.role
      })

      return NextResponse.json({
        success: true,
        message: 'Basic onboarding completed successfully!',
        data: savedData
      })
    }

    // Handle comprehensive onboarding flow (existing logic)
    const comprehensiveData = data as ComprehensiveOnboardingData

    // Validate required fields for comprehensive onboarding
    if (!comprehensiveData.airtableConfig.personalAccessToken) {
      return NextResponse.json(
        { error: 'Airtable Personal Access Token is required' },
        { status: 400 }
      )
    }

    if (!comprehensiveData.organization.organizationName) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      )
    }

    // Simulate database save for comprehensive onboarding
    const savedData = {
      userId: session.user.email,
      onboardingType: 'comprehensive',
      onboardingCompleted: true,
      completedAt,
      ...comprehensiveData,
      // Remove sensitive data from response
      airtableConfig: {
        hasToken: !!comprehensiveData.airtableConfig.personalAccessToken,
        tokenLength: comprehensiveData.airtableConfig.personalAccessToken.length,
        baseId: comprehensiveData.airtableConfig.baseId
      }
    }

    console.log('Comprehensive onboarding completed for user:', session.user.email, {
      completionScore: comprehensiveData.completionScore,
      completionPercentage: comprehensiveData.completionPercentage,
      milestonesCompleted: comprehensiveData.completedMilestones.length,
      selectedFeatures: comprehensiveData.selectedFeatures.length,
      userType: comprehensiveData.userType,
      duration: comprehensiveData.onboardingDuration
    })

    return NextResponse.json({
      success: true,
      message: 'Comprehensive onboarding completed successfully!',
      data: savedData
    })

  } catch (error) {
    console.error('Onboarding completion error:', error)
    
    return NextResponse.json(
      { error: 'Failed to complete onboarding. Please try again.' },
      { status: 500 }
    )
  }
}

// Handle GET requests for retrieving onboarding status
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // In a real implementation, you would query your database
    // For now, return a mock response
    const onboardingStatus = {
      userId: session.user.email,
      onboardingCompleted: false,
      currentStep: 1,
      completedMilestones: [],
      lastActivity: new Date().toISOString()
    }

    return NextResponse.json(onboardingStatus)

  } catch (error) {
    console.error('Error fetching onboarding status:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    )
  }
}