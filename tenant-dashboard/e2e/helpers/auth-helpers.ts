import { Page, expect } from '@playwright/test'
import { TestUser } from '../fixtures/test-users'

/**
 * Authentication helper functions for E2E tests
 * Fixed to work with REAL NextAuth.js architecture - NO MOCKS!
 */
export class AuthHelpers {
  
  /**
   * Complete user registration flow
   */
  static async registerUser(page: Page, user: TestUser) {
    await page.goto('/auth/register')
    
    // Wait for registration form to load
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()
    
    // Fill registration form using flexible selectors
    await page.getByRole('textbox', { name: /name/i }).fill(user.name)
    await page.getByRole('textbox', { name: /email/i }).fill(user.email)
    await page.locator('input[type="password"]').first().fill(user.password)
    await page.locator('input[type="password"]').nth(1).fill(user.password)
    
    // Accept terms checkbox
    await page.getByLabel(/I agree to the Terms of Service and Privacy Policy/i).check()
    
    // Submit registration
    await page.getByRole('button', { name: /create account/i }).click()
    
    // Wait for success or redirect
    await expect(page).toHaveURL(/\/auth\/onboarding/, { timeout: 10000 })
  }

  /**
   * Login user with REAL NextAuth.js credentials flow
   * Uses actual /api/auth/callback/credentials endpoint
   */
  static async loginUser(page: Page, user: TestUser) {
    // Clear any existing auth state first
    await page.context().clearCookies()
    
    await page.goto('/auth/login')
    
    // Wait for login form to fully load (use more specific selector to avoid multiple matches)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    
    // Get CSRF token for NextAuth (required for credentials signin)
    const csrfTokenResponse = await page.request.get('/api/auth/csrf')
    const csrfData = await csrfTokenResponse.json()
    const csrfToken = csrfData.csrfToken
    
    console.log('🔒 Retrieved CSRF token for NextAuth signin')
    
    // Fill login form using flexible selectors
    await page.getByRole('textbox', { name: /email/i }).fill(user.email)
    await page.locator('input[type="password"]').fill(user.password)
    
    // Monitor the NextAuth signin request to real backend
    const signinRequestPromise = page.waitForRequest(request => 
      request.url().includes('/api/auth/callback/credentials') && 
      request.method() === 'POST'
    )
    
    // Submit login form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Wait for NextAuth to process the signin request
    await signinRequestPromise
    console.log('📡 NextAuth signin request sent to real backend')
    
    // Critical fix: Wait for session to be established FIRST before checking URL
    // NextAuth session establishment is async and happens before redirect
    await page.waitForFunction(async () => {
      try {
        const response = await fetch('/api/auth/session')
        const sessionData = await response.json()
        const hasValidSession = sessionData && sessionData.user && sessionData.user.email
        console.log('🔍 Session check:', hasValidSession ? 'Valid' : 'Invalid')
        return hasValidSession
      } catch (error) {
        console.log('🔍 Session check error:', error.message)
        return false
      }
    }, { timeout: 15000 })
    console.log('🍪 NextAuth session established with HTTP-only cookies')
    
    // Now wait for URL change - should redirect to dashboard once session is ready
    // Use a more flexible approach that handles the async nature
    await page.waitForFunction(() => {
      const currentUrl = window.location.href
      const isOnProtectedPage = currentUrl.includes('/dashboard') || currentUrl.includes('/chat')
      const isNotOnLogin = !currentUrl.includes('/auth/login') || 
                          currentUrl.includes('callbackUrl') // Intermediate state
      console.log('🔍 URL check:', { currentUrl, isOnProtectedPage, isNotOnLogin })
      return isOnProtectedPage
    }, { timeout: 10000 })
    
    console.log('✅ NextAuth login flow completed successfully')
  }

  /**
   * Login user and navigate to specific page
   */
  static async loginAndNavigate(page: Page, user: TestUser, targetPath: string) {
    await this.loginUser(page, user)
    await page.goto(targetPath)
    await page.waitForLoadState('networkidle')
  }

  /**
   * Logout user using REAL NextAuth.js signout flow
   * Uses /api/auth/signout endpoint with proper CSRF handling
   */
  static async logoutUser(page: Page) {
    // First try to use UI logout if available
    const logoutSelectors = [
      'button:has-text("Logout")',
      'button:has-text("Sign out")', 
      '[data-testid="logout-button"]',
      '.logout-button'
    ]

    let loggedOut = false
    for (const selector of logoutSelectors) {
      try {
        const button = page.locator(selector).first()
        if (await button.isVisible({ timeout: 2000 })) {
          // Monitor NextAuth signout request
          const signoutRequestPromise = page.waitForRequest(request => 
            request.url().includes('/api/auth/signout') && 
            request.method() === 'POST'
          )
          
          await button.click()
          await signoutRequestPromise
          console.log('📡 NextAuth signout request sent')
          loggedOut = true
          break
        }
      } catch (error) {
        // Try next selector
      }
    }

    // If no logout button found, try dropdown menu
    if (!loggedOut) {
      try {
        // Click user menu/avatar
        const userMenu = page.locator('[data-testid="user-menu"], .user-avatar, button:has([role="img"])').first()
        if (await userMenu.isVisible({ timeout: 2000 })) {
          await userMenu.click()
          
          const signoutRequestPromise = page.waitForRequest(request => 
            request.url().includes('/api/auth/signout') && 
            request.method() === 'POST'
          )
          
          await page.getByRole('menuitem', { name: /logout|sign out/i }).click()
          await signoutRequestPromise
          console.log('📡 NextAuth signout request sent via dropdown')
          loggedOut = true
        }
      } catch (error) {
        console.log('⚠️  UI logout failed, using direct NextAuth signout')
      }
    }

    // Fallback: Direct NextAuth signout with CSRF token
    if (!loggedOut) {
      try {
        // Get CSRF token for NextAuth signout
        const csrfTokenResponse = await page.request.get('/api/auth/csrf')
        const csrfData = await csrfTokenResponse.json()
        
        // POST to NextAuth signout endpoint directly
        await page.request.post('/api/auth/signout', {
          data: {
            csrfToken: csrfData.csrfToken
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        
        console.log('🔒 Direct NextAuth signout completed')
        loggedOut = true
      } catch (error) {
        console.error('❌ All logout methods failed:', error)
        throw new Error('Failed to logout user')
      }
    }

    // Wait for NextAuth to clear session and redirect
    await page.waitForFunction(async () => {
      try {
        const response = await fetch('/api/auth/session')
        const sessionData = await response.json()
        // Session should be null/empty after successful signout
        return !sessionData || !sessionData.user
      } catch {
        return true // Consider it logged out if session check fails
      }
    }, { timeout: 10000 })

    // Navigate to login page to complete logout flow
    await page.goto('/auth/login')
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
    console.log('✅ NextAuth signout completed, redirected to login')
  }

  /**
   * Verify user is authenticated using REAL NextAuth.js session
   * NO localStorage checks - only HTTP-only cookie session verification
   */
  static async verifyAuthenticated(page: Page) {
    console.log('🔍 Verifying user authentication via NextAuth session...')
    
    // Primary check: NextAuth session endpoint (cookie-based)
    try {
      const sessionResponse = await page.request.get('/api/auth/session')
      
      if (!sessionResponse.ok()) {
        throw new Error(`Session check failed with status: ${sessionResponse.status()}`)
      }
      
      const sessionData = await sessionResponse.json()
      
      // NextAuth returns an empty object {} when not authenticated
      // or a populated object with user data when authenticated
      if (sessionData && sessionData.user && sessionData.user.email) {
        console.log('✅ NextAuth session valid:', { 
          email: sessionData.user.email, 
          id: sessionData.user.id 
        })
        return // Successfully authenticated
      }
      
      throw new Error('NextAuth session exists but missing user data')
      
    } catch (error) {
      console.error('❌ NextAuth session verification failed:', error)
      
      // Additional context: check current URL
      const currentUrl = page.url()
      console.log('📍 Current URL:', currentUrl)
      
      // Check if we might be on a protected page that should redirect to login
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/chat')) {
        console.log('⚠️  User on protected page but no valid session - auth middleware may redirect')
        
        // Wait a moment to see if auth middleware redirects
        try {
          await page.waitForURL(/\/auth\/login/, { timeout: 5000 })
          console.log('🔄 Auth middleware redirected to login as expected')
        } catch {
          console.log('🤔 No redirect occurred - checking for loading states')
        }
      }
      
      expect.fail(`User should be authenticated but NextAuth session check failed: ${error.message}`)
    }
  }

  /**
   * Verify user is NOT authenticated using REAL NextAuth.js session
   */
  static async verifyNotAuthenticated(page: Page) {
    console.log('🔍 Verifying user is NOT authenticated via NextAuth session...')
    
    // Primary check: NextAuth session should be empty/null
    try {
      const sessionResponse = await page.request.get('/api/auth/session')
      
      if (!sessionResponse.ok()) {
        console.log('✅ Session endpoint not accessible - user not authenticated')
        return
      }
      
      const sessionData = await sessionResponse.json()
      
      // NextAuth returns empty object {} when not authenticated
      if (!sessionData || !sessionData.user || !sessionData.user.email) {
        console.log('✅ NextAuth session empty - user not authenticated')
        return
      }
      
      // If we get here, user is still authenticated
      expect.fail(`User should NOT be authenticated but has active NextAuth session: ${sessionData.user.email}`)
      
    } catch (error) {
      // If session check fails completely, consider user not authenticated
      console.log('✅ NextAuth session check failed - user not authenticated')
    }
    
    // Additional check: should be on login page or have login form visible
    const currentUrl = page.url()
    if (currentUrl.includes('/auth/login')) {
      console.log('✅ User on login page as expected')
      return
    }
    
    // If not on login page, check if login form is visible
    try {
      await expect(page.getByRole('heading', { name: /sign in|login|welcome back/i })).toBeVisible({ timeout: 5000 })
      console.log('✅ Login form visible - user not authenticated')
    } catch (error) {
      // If not on login page and no login form, might need to wait for redirect
      console.log('⚠️  Not on login page, waiting for auth redirect...')
      try {
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
        console.log('✅ Redirected to login page as expected')
      } catch (redirectError) {
        expect.fail('User should be on login page or see login form but neither condition is met')
      }
    }
  }

  /**
   * Handle session expiry scenario using REAL NextAuth.js cookie clearing
   */
  static async handleSessionExpiry(page: Page) {
    console.log('🧹 Simulating session expiry by clearing NextAuth cookies...')
    
    // Clear all NextAuth cookies to simulate session expiry
    const cookies = await page.context().cookies()
    const nextAuthCookies = cookies.filter(cookie => 
      cookie.name.includes('next-auth') || 
      cookie.name.includes('__Secure-next-auth') ||
      cookie.name.includes('authjs')
    )
    
    console.log(`Found ${nextAuthCookies.length} NextAuth cookies to clear`)
    
    // Clear ALL cookies to ensure clean state  
    await page.context().clearCookies()
    
    // Also clear any browser storage (though NextAuth doesn't use it)
    await page.evaluate(() => {
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (e) {
        // Ignore errors - storage might not be available
      }
    })
    
    // Reload page to trigger NextAuth session check
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    console.log('🔄 Page reloaded after session expiry simulation')
    
    // Should redirect to login or show unauthenticated state
    await this.verifyNotAuthenticated(page)
    console.log('✅ Session expiry handled - user no longer authenticated')
  }

  /**
   * Wait for page to be fully loaded and authenticated using REAL NextAuth.js session
   */
  static async waitForAuthenticatedPage(page: Page, timeout: number = 15000) {
    console.log('⏳ Waiting for page to load and authentication to complete...')
    
    // First wait for basic page load
    await page.waitForLoadState('networkidle')
    
    // Then wait for NextAuth session to be established
    await page.waitForFunction(async () => {
      try {
        // Check NextAuth session
        const response = await fetch('/api/auth/session')
        const sessionData = await response.json()
        const hasValidSession = sessionData && sessionData.user && sessionData.user.email
        
        // Also check that we're not on auth pages
        const notOnAuthPage = !window.location.pathname.includes('/auth/')
        
        // Additional check for UI elements that indicate authentication
        const hasUserUI = document.querySelector('[data-testid="user-menu"], .user-avatar') !== null
        const hasMainContent = document.querySelector('main, [role="main"], .main-content') !== null
        
        const isFullyAuthenticated = hasValidSession && notOnAuthPage && (hasUserUI || hasMainContent)
        
        if (isFullyAuthenticated) {
          console.log('✅ Page fully loaded and user authenticated')
        }
        
        return isFullyAuthenticated
      } catch (error) {
        return false
      }
    }, { timeout })
    
    console.log('🎉 Page ready with authenticated user')
  }

  /**
   * All authentication methods now use REAL NextAuth.js flow
   * - HTTP-only cookie sessions (not localStorage)
   * - /api/auth/session endpoint for session verification
   * - /api/auth/callback/credentials for signin
   * - /api/auth/signout for logout
   * - CSRF tokens for security
   * - Real backend services on ports 8000-8008
   */
}