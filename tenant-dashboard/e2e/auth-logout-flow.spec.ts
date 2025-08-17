import { test, expect, Page } from '@playwright/test'
import { testUsers } from './fixtures/test-users'
import { AuthHelpers } from './helpers/auth-helpers'

test.describe('Authentication - Logout and Token Clearing', () => {
  const validUser = testUsers.standard
  
  test.beforeEach(async ({ page }) => {
    // Start each test with authenticated user
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
    
    // Login user
    await AuthHelpers.loginUser(page, validUser)
  })

  test('should complete full logout flow and clear all authentication tokens', async ({ page }) => {
    // Verify we're authenticated first
    await AuthHelpers.verifyAuthenticated(page)
    
    // Check that auth tokens exist before logout
    const cookiesBeforeLogout = await page.context().cookies()
    const authCookiesBefore = cookiesBeforeLogout.filter(cookie => 
      cookie.name.includes('next-auth') || 
      cookie.name.includes('__Secure-next-auth') ||
      cookie.name.includes('authjs') ||
      cookie.name.includes('session')
    )
    
    expect(authCookiesBefore.length).toBeGreaterThan(0)
    
    // Perform logout
    await AuthHelpers.logoutUser(page)
    
    // Verify redirect to login page
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
    
    // Verify authentication tokens are cleared
    const cookiesAfterLogout = await page.context().cookies()
    const authCookiesAfter = cookiesAfterLogout.filter(cookie => 
      cookie.name.includes('next-auth') || 
      cookie.name.includes('__Secure-next-auth') ||
      cookie.name.includes('authjs') ||
      cookie.name.includes('session')
    )
    
    // Auth cookies should be cleared or invalidated
    expect(authCookiesAfter.length).toBe(0)
    
    // Verify session is cleared
    const sessionResponse = await page.request.get('/api/auth/session')
    const sessionData = await sessionResponse.json()
    expect(sessionData.user).toBeFalsy()
    
    // Verify localStorage/sessionStorage is cleared
    const storageCleared = await page.evaluate(() => {
      const hasAuthData = Object.keys(localStorage).some(key => 
        key.includes('auth') || key.includes('session') || key.includes('user')
      )
      const hasSessionData = Object.keys(sessionStorage).some(key => 
        key.includes('auth') || key.includes('session') || key.includes('user')
      )
      return !hasAuthData && !hasSessionData
    })
    
    expect(storageCleared).toBeTruthy()
  })

  test('should prevent access to protected routes after logout', async ({ page }) => {
    // Logout
    await AuthHelpers.logoutUser(page)
    
    // Try to access protected routes
    const protectedRoutes = ['/dashboard', '/chat', '/dashboard/settings', '/profile']
    
    for (const route of protectedRoutes) {
      await page.goto(route)
      
      // Should redirect to login page
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
      
      // Should not show protected content
      await AuthHelpers.verifyNotAuthenticated(page)
    }
  })

  test('should handle logout from multiple tabs simultaneously', async ({ page, context }) => {
    // Open second tab
    const secondTab = await context.newPage()
    await secondTab.goto('/dashboard')
    await AuthHelpers.verifyAuthenticated(secondTab)
    
    // Logout from first tab
    await AuthHelpers.logoutUser(page)
    
    // Verify first tab is logged out
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
    
    // Check second tab - should also be logged out (session invalidated)
    await secondTab.reload()
    await expect(secondTab).toHaveURL(/\/auth\/login/, { timeout: 10000 })
    
    // Verify both tabs have no valid session
    const [sessionResponse1, sessionResponse2] = await Promise.all([
      page.request.get('/api/auth/session'),
      secondTab.request.get('/api/auth/session')
    ])
    
    const [sessionData1, sessionData2] = await Promise.all([
      sessionResponse1.json(),
      sessionResponse2.json()
    ])
    
    expect(sessionData1.user).toBeFalsy()
    expect(sessionData2.user).toBeFalsy()
    
    await secondTab.close()
  })

  test('should handle logout via direct API call', async ({ page }) => {
    // Verify authenticated
    await AuthHelpers.verifyAuthenticated(page)
    
    // Call logout API directly
    const logoutResponse = await page.request.post('/api/auth/signout', {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    expect(logoutResponse.ok()).toBeTruthy()
    
    // Reload page to trigger auth state check
    await page.reload()
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
    
    // Session should be cleared
    const sessionResponse = await page.request.get('/api/auth/session')
    const sessionData = await sessionResponse.json()
    expect(sessionData.user).toBeFalsy()
  })

  test('should handle logout button in various UI locations', async ({ page }) => {
    // Test different possible logout button locations
    const logoutSelectors = [
      'button:has-text("Logout")',
      'button:has-text("Sign out")',
      'a:has-text("Logout")',
      'a:has-text("Sign out")',
      '[data-testid="logout-button"]',
      '.logout-button',
      '[aria-label*="logout" i]',
      '[aria-label*="sign out" i]'
    ]
    
    let logoutButtonFound = false
    
    for (const selector of logoutSelectors) {
      try {
        const button = page.locator(selector).first()
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click()
          logoutButtonFound = true
          break
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // If no direct logout button, try user menu dropdown
    if (!logoutButtonFound) {
      const userMenuSelectors = [
        '[data-testid="user-menu"]',
        '.user-avatar',
        'button:has([role="img"])', // User avatar button
        '[aria-label*="user menu" i]',
        '[aria-label*="account" i]'
      ]
      
      for (const menuSelector of userMenuSelectors) {
        try {
          const menu = page.locator(menuSelector).first()
          if (await menu.isVisible({ timeout: 2000 })) {
            await menu.click()
            
            // Look for logout in dropdown
            const dropdownLogout = page.locator('[role="menuitem"]', { hasText: /logout|sign out/i }).first()
            if (await dropdownLogout.isVisible({ timeout: 3000 })) {
              await dropdownLogout.click()
              logoutButtonFound = true
              break
            }
          }
        } catch (error) {
          // Continue to next selector
        }
      }
    }
    
    // If still no logout found, navigate to logout endpoint
    if (!logoutButtonFound) {
      await page.goto('/api/auth/signout')
    }
    
    // Should be logged out regardless of method
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15000 })
  })

  test('should handle logout with pending network requests gracefully', async ({ page }) => {
    // Navigate to a page that might have pending requests
    await page.goto('/dashboard')
    
    // Start some background requests (like API calls for dashboard data)
    const pendingRequests = [
      page.request.get('/api/dashboard/stats').catch(() => {}),
      page.request.get('/api/user/profile').catch(() => {}),
      page.request.get('/api/airtable/tables').catch(() => {})
    ]
    
    // Logout while requests are pending
    await AuthHelpers.logoutUser(page)
    
    // Should complete logout regardless of pending requests
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
    
    // Wait for any pending requests to complete or timeout
    await Promise.allSettled(pendingRequests)
    
    // Verify session is still cleared
    const sessionResponse = await page.request.get('/api/auth/session')
    const sessionData = await sessionResponse.json()
    expect(sessionData.user).toBeFalsy()
  })

  test('should clear authentication state on browser close simulation', async ({ page, context }) => {
    // Verify authenticated
    await AuthHelpers.verifyAuthenticated(page)
    
    // Simulate browser close by closing context
    await context.close()
    
    // Create new context (simulating browser restart)
    const newContext = await page.context().browser()?.newContext()
    if (newContext) {
      const newPage = await newContext.newPage()
      
      // Try to access protected page
      await newPage.goto('/dashboard')
      
      // Should redirect to login (no persistent session)
      await expect(newPage).toHaveURL(/\/auth\/login/, { timeout: 10000 })
      
      await newContext.close()
    }
  })

  test('should handle logout keyboard shortcut if implemented', async ({ page }) => {
    // Check if there's a logout keyboard shortcut
    await page.keyboard.press('Meta+Shift+L') // Common logout shortcut
    await page.waitForTimeout(1000)
    
    // Check if logout occurred
    const isOnLogin = page.url().includes('/auth/login')
    
    if (isOnLogin) {
      // Shortcut worked
      await AuthHelpers.verifyNotAuthenticated(page)
    } else {
      // No shortcut implemented, that's fine - test normal logout
      await AuthHelpers.logoutUser(page)
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
    }
  })

  test('should handle logout during form submission', async ({ page }) => {
    // Navigate to a page with forms (like settings)
    await page.goto('/dashboard/settings').catch(() => page.goto('/dashboard'))
    
    // If there's a form, start filling it
    const formInputs = page.locator('input, textarea, select')
    const inputCount = await formInputs.count()
    
    if (inputCount > 0) {
      // Fill some form fields
      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = formInputs.nth(i)
        const inputType = await input.getAttribute('type')
        
        if (inputType === 'text' || inputType === 'email') {
          await input.fill('test value')
        }
      }
    }
    
    // Now logout while form has unsaved changes
    await AuthHelpers.logoutUser(page)
    
    // Should successfully logout regardless of form state
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
    
    // Session should be cleared
    const sessionResponse = await page.request.get('/api/auth/session')
    const sessionData = await sessionResponse.json()
    expect(sessionData.user).toBeFalsy()
  })

  test('should clear client-side caches on logout', async ({ page }) => {
    // Navigate to dashboard to populate any client-side caches
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Add some data to various storage mechanisms
    await page.evaluate(() => {
      // Add test data to various storage locations
      localStorage.setItem('cached-data', 'sensitive-info')
      sessionStorage.setItem('temp-data', 'user-specific')
      
      // Simulate cached API responses
      if (window.caches) {
        caches.open('api-cache').then(cache => {
          cache.put('/api/user/profile', new Response('{"user": "data"}'))
        }).catch(() => {})
      }
    })
    
    // Logout
    await AuthHelpers.logoutUser(page)
    
    // Verify all caches are cleared
    const cachesCleared = await page.evaluate(async () => {
      // Check localStorage and sessionStorage
      const hasLocalStorage = localStorage.length > 0
      const hasSessionStorage = sessionStorage.length > 0
      
      // Check API caches if available
      let hasCacheData = false
      if (window.caches) {
        try {
          const cache = await caches.open('api-cache')
          const cachedResponse = await cache.match('/api/user/profile')
          hasCacheData = !!cachedResponse
        } catch (error) {
          // Cache API not available or error, assume cleared
          hasCacheData = false
        }
      }
      
      return !hasLocalStorage && !hasSessionStorage && !hasCacheData
    })
    
    expect(cachesCleared).toBeTruthy()
  })
})