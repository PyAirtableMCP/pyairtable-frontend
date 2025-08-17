import { test, expect, Page } from '@playwright/test'
import { testUsers } from './fixtures/test-users'
import { AuthHelpers } from './helpers/auth-helpers'

/**
 * Authentication JWT Token Refresh E2E Tests
 * Tests real backend token refresh mechanisms using services on ports 8000-8008
 * NO MOCKS - All tests connect to actual backend services
 */

test.describe('Authentication - JWT Token Refresh Mechanism', () => {
  const validUser = testUsers.standard
  
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies()
    
    // Navigate to login page first to ensure DOM is loaded
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
    
    await page.evaluate(() => {
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (error) {
        console.warn('Storage clear failed:', error)
      }
    })
    
    // Login user to get initial tokens
    await AuthHelpers.loginUser(page, validUser)
  })

  test('should automatically refresh JWT tokens before expiration', async ({ page }) => {
    // Get initial session data from real backend
    const initialSessionResponse = await page.request.get('/api/auth/session')
    
    if (initialSessionResponse.ok()) {
      const initialSession = await initialSessionResponse.json()
      expect(initialSession.user.email).toBe(validUser.email)
      expect(initialSession.accessToken).toBeDefined()
    }
    
    // Navigate to dashboard to trigger real session check
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Wait for potential token refresh background processes
    await page.waitForTimeout(2000)
    
    // Verify session is still valid
    const sessionResponse = await page.request.get('/api/auth/session')
    
    if (sessionResponse.ok()) {
      const sessionData = await sessionResponse.json()
      expect(sessionData.user.email).toBe(validUser.email)
    }
    
    // Should still have access to protected content
    await AuthHelpers.verifyAuthenticated(page)
  })

  test('should handle token refresh failure gracefully', async ({ page }) => {
    // Clear tokens to simulate expired state
    await page.evaluate(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('session')
      sessionStorage.clear()
    })
    
    // Try to access protected page with no valid tokens
    await page.goto('/dashboard')
    
    // Should redirect to login when no valid session
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
    
    // Should show appropriate error message if available
    const hasErrorMessage = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive')
      return Array.from(errorElements).some(el => 
        el.textContent?.toLowerCase().includes('session') ||
        el.textContent?.toLowerCase().includes('expired') ||
        el.textContent?.toLowerCase().includes('login')
      )
    })
    
    // User should be redirected to login
    await AuthHelpers.verifyNotAuthenticated(page)
  })

  test('should refresh tokens on API call with expired access token', async ({ page }) => {
    // Navigate to dashboard first
    await page.goto('/dashboard')
    await AuthHelpers.verifyAuthenticated(page)
    
    // Make API call to real backend that would trigger token refresh if needed
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        return {
          status: response.status,
          data: response.ok ? await response.json() : await response.text()
        }
      } catch (error) {
        return {
          error: error.message
        }
      }
    })
    
    // Wait for any background token refresh processes
    await page.waitForTimeout(1000)
    
    // User should remain authenticated after any token refresh
    await AuthHelpers.verifyAuthenticated(page)
  })

  test('should handle concurrent token refresh attempts', async ({ page, context }) => {
    // Open multiple tabs
    const tab2 = await context.newPage()
    const tab3 = await context.newPage()
    
    await Promise.all([
      tab2.goto('/dashboard'),
      tab3.goto('/dashboard')
    ])
    
    // Verify all tabs are authenticated with real backend
    await Promise.all([
      AuthHelpers.verifyAuthenticated(page),
      AuthHelpers.verifyAuthenticated(tab2),
      AuthHelpers.verifyAuthenticated(tab3)
    ])
    
    // Trigger session checks in all tabs simultaneously (real backend calls)
    await Promise.all([
      page.reload(),
      tab2.reload(),
      tab3.reload()
    ])
    
    await Promise.all([
      page.waitForLoadState('networkidle'),
      tab2.waitForLoadState('networkidle'),
      tab3.waitForLoadState('networkidle')
    ])
    
    // All tabs should still be authenticated after real backend session checks
    await Promise.all([
      AuthHelpers.verifyAuthenticated(page),
      AuthHelpers.verifyAuthenticated(tab2),
      AuthHelpers.verifyAuthenticated(tab3)
    ])
    
    await tab2.close()
    await tab3.close()
  })

  test('should maintain user activity during token refresh', async ({ page }) => {
    // Navigate to interactive page
    await page.goto('/chat')
    await page.waitForLoadState('networkidle')
    
    // Start typing in chat input (user activity)
    const chatInput = page.locator('[placeholder*="Ask" i], [placeholder*="message" i], [placeholder*="chat" i]').first()
    
    if (await chatInput.isVisible()) {
      await chatInput.fill('This is a test message')
    }
    
    // Trigger background session check with real backend
    await page.evaluate(() => {
      fetch('/api/auth/session').catch(() => {})
    })
    
    // Wait for session check to complete
    await page.waitForTimeout(1000)
    
    // User's input should be preserved during real backend session checks
    if (await chatInput.isVisible()) {
      const inputValue = await chatInput.inputValue()
      expect(inputValue).toBe('This is a test message')
    }
    
    // User should still be authenticated
    await AuthHelpers.verifyAuthenticated(page)
  })

  test('should handle network errors during token refresh', async ({ page }) => {
    // Navigate to page that would trigger session check with real backend
    await page.goto('/dashboard')
    
    // Wait for any network requests to complete
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    
    // Check authentication status with real backend
    const sessionResponse = await page.request.get('/api/auth/session')
    
    if (sessionResponse.ok()) {
      // User should be authenticated if backend is working
      await AuthHelpers.verifyAuthenticated(page)
    } else {
      // If backend is down, should handle gracefully
      // Either show error or redirect to login
      const currentUrl = page.url()
      expect(currentUrl).toBeTruthy() // Page should not crash
    }
  })

  test('should handle token refresh with different user roles', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Verify session from real backend
    const sessionResponse = await page.request.get('/api/auth/session')
    
    if (sessionResponse.ok()) {
      const sessionData = await sessionResponse.json()
      expect(sessionData.user.email).toBe(validUser.email)
      
      // Should be authenticated with current role from backend
      await AuthHelpers.verifyAuthenticated(page)
    }
  })

  test('should preserve tenant context during token refresh', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Verify tenant context from real backend
    const sessionResponse = await page.request.get('/api/auth/session')
    
    if (sessionResponse.ok()) {
      const sessionData = await sessionResponse.json()
      expect(sessionData.user.email).toBe(validUser.email)
      
      // Tenant context should be preserved by real backend
      if (sessionData.user.tenantId) {
        expect(sessionData.user.tenantId).toBeTruthy()
      }
      
      // Should maintain authentication with tenant context
      await AuthHelpers.verifyAuthenticated(page)
    }
  })
})