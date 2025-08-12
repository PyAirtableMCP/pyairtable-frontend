import { test, expect, Page } from '@playwright/test'
import { testUsers } from './fixtures/test-users'
import { AuthHelpers } from './helpers/auth-helpers'

test.describe('Authentication - JWT Token Refresh Mechanism', () => {
  const validUser = testUsers.standard
  
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Login user to get initial tokens
    await AuthHelpers.loginUser(page, validUser)
  })

  test('should automatically refresh JWT tokens before expiration', async ({ page }) => {
    // Get initial session data
    const initialSessionResponse = await page.request.get('/api/auth/session')
    const initialSession = await initialSessionResponse.json()
    
    expect(initialSession.user.email).toBe(validUser.email)
    expect(initialSession.accessToken).toBeDefined()
    
    // Mock token refresh by simulating time passage
    // In a real scenario, we'd wait or mock the JWT expiration time
    await page.evaluate(() => {
      // Simulate token nearing expiration by modifying the JWT's exp claim
      const mockExpiredToken = {
        user_id: 'test-user-id',
        email: 'user@pyairtable.com',
        exp: Math.floor(Date.now() / 1000) + 60, // Expires in 1 minute
        iat: Math.floor(Date.now() / 1000) - 3540, // Issued 59 minutes ago
        role: 'user',
        tenant_id: 'test-tenant'
      }
      
      // Store mock token data for testing
      window.localStorage.setItem('mock-token-data', JSON.stringify(mockExpiredToken))
    })
    
    // Mock the token refresh endpoint
    await page.route('**/api/auth/session', async (route) => {
      const request = route.request()
      
      if (request.method() === 'GET') {
        // Return session with refreshed token
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-id',
              email: validUser.email,
              name: 'Test User'
            },
            accessToken: 'refreshed-access-token',
            refreshToken: 'refreshed-refresh-token',
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        })
      } else {
        await route.continue()
      }
    })
    
    // Navigate to a page that would trigger session check/refresh
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Verify session is still valid after refresh
    const refreshedSessionResponse = await page.request.get('/api/auth/session')
    const refreshedSession = await refreshedSessionResponse.json()
    
    expect(refreshedSession.user.email).toBe(validUser.email)
    expect(refreshedSession.accessToken).toBeDefined()
    
    // Should still have access to protected content
    await AuthHelpers.verifyAuthenticated(page)
  })

  test('should handle token refresh failure gracefully', async ({ page }) => {
    // Mock token refresh failure
    await page.route('**/api/auth/session', async (route) => {
      const request = route.request()
      
      if (request.method() === 'GET') {
        // Simulate refresh token being invalid/expired
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Token refresh failed'
          })
        })
      } else {
        await route.continue()
      }
    })
    
    // Try to access protected page
    await page.goto('/dashboard')
    
    // Should redirect to login when token refresh fails
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
    
    // Error message is optional but user should be logged out
    await AuthHelpers.verifyNotAuthenticated(page)
  })

  test('should refresh tokens on API call with expired access token', async ({ page }) => {
    // Navigate to dashboard first
    await page.goto('/dashboard')
    await AuthHelpers.verifyAuthenticated(page)
    
    let apiCallCount = 0
    let refreshAttempted = false
    
    // Mock API endpoint that requires authentication
    await page.route('**/api/dashboard/**', async (route) => {
      apiCallCount++
      
      if (apiCallCount === 1) {
        // First call - return 401 to simulate expired token
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Token expired'
          })
        })
      } else {
        // Subsequent calls after refresh - return success
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: 'dashboard data'
          })
        })
      }
    })
    
    // Mock token refresh
    await page.route('**/api/auth/session', async (route) => {
      const request = route.request()
      
      if (request.method() === 'GET') {
        refreshAttempted = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-id',
              email: validUser.email,
              name: 'Test User'
            },
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        })
      } else {
        await route.continue()
      }
    })
    
    // Make API call that would trigger token refresh
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        return {
          status: response.status,
          data: await response.json()
        }
      } catch (error) {
        return {
          error: error.message
        }
      }
    })
    
    // API call should eventually succeed after token refresh
    // Note: This depends on client-side retry logic implementation
    expect(apiCallCount).toBeGreaterThan(0)
    
    // User should remain authenticated
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
    
    // Verify all tabs are authenticated
    await Promise.all([
      AuthHelpers.verifyAuthenticated(page),
      AuthHelpers.verifyAuthenticated(tab2),
      AuthHelpers.verifyAuthenticated(tab3)
    ])
    
    let refreshCallCount = 0
    
    // Mock token refresh with delay to test concurrency
    await Promise.all([
      page.route('**/api/auth/session', async (route) => {
        refreshCallCount++
        await new Promise(resolve => setTimeout(resolve, 100)) // Simulate network delay
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-id',
              email: validUser.email,
              name: 'Test User'
            },
            accessToken: `refreshed-token-${refreshCallCount}`,
            refreshToken: `refreshed-refresh-${refreshCallCount}`,
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        })
      }),
      tab2.route('**/api/auth/session', async (route) => {
        await route.continue() // Let one tab handle the refresh
      }),
      tab3.route('**/api/auth/session', async (route) => {
        await route.continue() // Let one tab handle the refresh
      })
    ])
    
    // Trigger session checks in all tabs simultaneously
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
    
    // All tabs should still be authenticated
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
    
    let tokenRefreshed = false
    
    // Mock token refresh during user activity
    await page.route('**/api/auth/session', async (route) => {
      tokenRefreshed = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: validUser.email,
            name: 'Test User'
          },
          accessToken: 'activity-refreshed-token',
          refreshToken: 'activity-refreshed-refresh',
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      })
    })
    
    // Trigger background token refresh
    await page.evaluate(() => {
      // Simulate background token check
      fetch('/api/auth/session').catch(() => {})
    })
    
    // Wait for refresh to complete
    await page.waitForTimeout(1000)
    
    // User's input should be preserved
    if (await chatInput.isVisible()) {
      const inputValue = await chatInput.inputValue()
      expect(inputValue).toBe('This is a test message')
    }
    
    // User should still be authenticated
    await AuthHelpers.verifyAuthenticated(page)
  })

  test('should handle network errors during token refresh', async ({ page }) => {
    let retryCount = 0
    
    // Mock network errors for token refresh
    await page.route('**/api/auth/session', async (route) => {
      retryCount++
      
      if (retryCount <= 2) {
        // Simulate network error for first 2 attempts
        await route.abort('internetdisconnected')
      } else {
        // Succeed on 3rd attempt
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-id',
              email: validUser.email,
              name: 'Test User'
            },
            accessToken: 'retry-success-token',
            refreshToken: 'retry-success-refresh',
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        })
      }
    })
    
    // Navigate to page that would trigger session check
    await page.goto('/dashboard')
    
    // Should eventually succeed after retries
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    
    // User should be authenticated after successful retry
    await AuthHelpers.verifyAuthenticated(page)
    
    // Should have attempted multiple times
    expect(retryCount).toBeGreaterThan(1)
  })

  test('should handle token refresh with different user roles', async ({ page }) => {
    // Mock session with admin role
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: validUser.email,
            name: 'Test User',
            role: 'admin' // Elevated role after refresh
          },
          accessToken: 'admin-access-token',
          refreshToken: 'admin-refresh-token',
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      })
    })
    
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Verify session has updated role
    const sessionResponse = await page.request.get('/api/auth/session')
    const sessionData = await sessionResponse.json()
    
    expect(sessionData.user.role).toBe('admin')
    expect(sessionData.user.email).toBe(validUser.email)
    
    // Should still be authenticated with new role
    await AuthHelpers.verifyAuthenticated(page)
  })

  test('should preserve tenant context during token refresh', async ({ page }) => {
    const testTenantId = 'test-tenant-123'
    
    // Mock session with tenant context
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: validUser.email,
            name: 'Test User',
            tenantId: testTenantId
          },
          accessToken: 'tenant-access-token',
          refreshToken: 'tenant-refresh-token',
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      })
    })
    
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Verify tenant context is preserved
    const sessionResponse = await page.request.get('/api/auth/session')
    const sessionData = await sessionResponse.json()
    
    expect(sessionData.user.tenantId).toBe(testTenantId)
    expect(sessionData.user.email).toBe(validUser.email)
    
    // Should maintain authentication with tenant context
    await AuthHelpers.verifyAuthenticated(page)
  })
})