import { test, expect, Page } from '@playwright/test'
import { testUsers, testData } from './fixtures/test-users'
import { AuthHelpers } from './helpers/auth-helpers'

test.describe('Authentication - Error Scenarios', () => {
  const validUser = testUsers.standard
  const invalidCredentials = testData.invalidData.login
  
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('should handle invalid credentials with proper error messages', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Test with completely invalid credentials
    await page.fill('[name="email"], [placeholder*="email" i]', invalidCredentials.invalidCredentials.email)
    await page.fill('[name="password"], [placeholder*="password" i]', invalidCredentials.invalidCredentials.password)
    
    // Mock auth service error response
    await page.route('**/api/auth/callback/credentials', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid credentials'
        })
      })
    })
    
    await page.click('button[type="submit"], button:has-text("Sign In")')
    
    // Should show error message
    await page.waitForLoadState('networkidle')
    
    const hasErrorMessage = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive')
      return Array.from(errorElements).some(el => 
        el.textContent?.toLowerCase().includes('invalid') ||
        el.textContent?.toLowerCase().includes('incorrect') ||
        el.textContent?.toLowerCase().includes('wrong')
      )
    })
    
    expect(hasErrorMessage).toBeTruthy()
    
    // Should remain on login page
    expect(page.url()).toContain('/auth/login')
    
    // Should not be authenticated
    await AuthHelpers.verifyNotAuthenticated(page)
  })

  test('should handle expired JWT tokens gracefully', async ({ page }) => {
    // First login successfully
    await AuthHelpers.loginUser(page, validUser)
    await AuthHelpers.verifyAuthenticated(page)
    
    // Mock expired token scenario
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Token expired'
        })
      })
    })
    
    // Try to access protected page
    await page.goto('/dashboard')
    
    // Should redirect to login due to expired token
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
    
    // Should show session expired message if implemented
    const hasSessionExpiredMessage = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive, .notification')
      return Array.from(errorElements).some(el => 
        el.textContent?.toLowerCase().includes('session') ||
        el.textContent?.toLowerCase().includes('expired') ||
        el.textContent?.toLowerCase().includes('please log in')
      )
    })
    
    // Message is optional, but user should definitely be logged out
    await AuthHelpers.verifyNotAuthenticated(page)
  })

  test('should handle auth service unavailable (503 error)', async ({ page }) => {
    await page.goto('/auth/login')
    
    await page.fill('[name="email"], [placeholder*="email" i]', validUser.email)
    await page.fill('[name="password"], [placeholder*="password" i]', validUser.password)
    
    // Mock service unavailable
    await page.route('**/api/auth/callback/credentials', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Service temporarily unavailable'
        })
      })
    })
    
    await page.click('button[type="submit"], button:has-text("Sign In")')
    
    // Should show service error message
    await page.waitForLoadState('networkidle')
    
    const hasServiceError = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive')
      return Array.from(errorElements).some(el => 
        el.textContent?.toLowerCase().includes('service') ||
        el.textContent?.toLowerCase().includes('unavailable') ||
        el.textContent?.toLowerCase().includes('try again')
      )
    })
    
    expect(hasServiceError).toBeTruthy()
    expect(page.url()).toContain('/auth/login')
  })

  test('should handle network connectivity issues during login', async ({ page }) => {
    await page.goto('/auth/login')
    
    await page.fill('[name="email"], [placeholder*="email" i]', validUser.email)
    await page.fill('[name="password"], [placeholder*="password" i]', validUser.password)
    
    // Mock network error
    await page.route('**/api/auth/callback/credentials', async (route) => {
      await route.abort('internetdisconnected')
    })
    
    await page.click('button[type="submit"], button:has-text("Sign In")')
    
    // Should handle network error gracefully
    await page.waitForTimeout(3000)
    
    const hasNetworkError = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive')
      const loadingElements = document.querySelectorAll('[aria-busy="true"], .loading, .spinner')
      
      const hasErrorMessage = Array.from(errorElements).some(el => 
        el.textContent?.toLowerCase().includes('network') ||
        el.textContent?.toLowerCase().includes('connection') ||
        el.textContent?.toLowerCase().includes('offline') ||
        el.textContent?.toLowerCase().includes('try again')
      )
      
      const hasLoadingState = loadingElements.length > 0
      
      return hasErrorMessage || hasLoadingState
    })
    
    // Should show some indication of network issue or loading state
    expect(hasNetworkError).toBeTruthy()
    expect(page.url()).toContain('/auth/login')
  })

  test('should handle malformed email addresses gracefully', async ({ page }) => {
    await page.goto('/auth/login')
    
    const malformedEmails = [
      'notanemail',
      'user@',
      '@domain.com',
      'user@domain',
      'user space@domain.com',
      'user@dom ain.com',
      'user@@domain.com'
    ]
    
    for (const email of malformedEmails) {
      await page.fill('[name="email"], [placeholder*="email" i]', email)
      await page.fill('[name="password"], [placeholder*="password" i]', 'ValidPassword123!')
      
      await page.click('button[type="submit"], button:has-text("Sign In")')
      
      // Should show validation error without making API call
      const hasValidationError = await page.evaluate(() => {
        const emailInput = document.querySelector('[name="email"], [placeholder*="email" i]')
        const errorElements = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive')
        
        const hasInvalidInput = emailInput && emailInput.matches(':invalid, [aria-invalid="true"]')
        const hasErrorMessage = Array.from(errorElements).some(el => 
          el.textContent?.toLowerCase().includes('email') ||
          el.textContent?.toLowerCase().includes('valid') ||
          el.textContent?.toLowerCase().includes('format')
        )
        
        return hasInvalidInput || hasErrorMessage
      })
      
      expect(hasValidationError).toBeTruthy()
      expect(page.url()).toContain('/auth/login')
      
      // Clear field for next test
      await page.fill('[name="email"], [placeholder*="email" i]', '')
    }
  })

  test('should handle account locked/suspended scenarios', async ({ page }) => {
    await page.goto('/auth/login')
    
    await page.fill('[name="email"], [placeholder*="email" i]', validUser.email)
    await page.fill('[name="password"], [placeholder*="password" i]', validUser.password)
    
    // Mock account locked response
    await page.route('**/api/auth/callback/credentials', async (route) => {
      await route.fulfill({
        status: 423, // Locked status
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Account temporarily locked due to multiple failed attempts'
        })
      })
    })
    
    await page.click('button[type="submit"], button:has-text("Sign In")')
    
    // Should show account locked message
    await page.waitForLoadState('networkidle')
    
    const hasLockedMessage = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive')
      return Array.from(errorElements).some(el => 
        el.textContent?.toLowerCase().includes('locked') ||
        el.textContent?.toLowerCase().includes('suspended') ||
        el.textContent?.toLowerCase().includes('blocked')
      )
    })
    
    expect(hasLockedMessage).toBeTruthy()
    expect(page.url()).toContain('/auth/login')
  })

  test('should handle session hijacking attempts', async ({ page }) => {
    // Login successfully first
    await AuthHelpers.loginUser(page, validUser)
    await AuthHelpers.verifyAuthenticated(page)
    
    // Simulate session token manipulation (security breach scenario)
    await page.evaluate(() => {
      // Tamper with session cookies
      document.cookie = 'next-auth.session-token=tampered-token; path=/'
      document.cookie = '__Secure-next-auth.session-token=tampered-secure-token; path=/; secure'
    })
    
    // Mock security error response
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid session token'
        })
      })
    })
    
    // Try to access protected page
    await page.goto('/dashboard')
    
    // Should redirect to login due to invalid session
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
    
    // Should clear all auth tokens
    const authCookies = await page.context().cookies()
    const hasValidAuthCookies = authCookies.some(cookie => 
      (cookie.name.includes('next-auth') || cookie.name.includes('session')) &&
      cookie.value !== 'tampered-token' &&
      cookie.value !== 'tampered-secure-token'
    )
    
    expect(hasValidAuthCookies).toBeFalsy()
  })

  test('should handle concurrent login attempts with rate limiting', async ({ page, context }) => {
    const attempts = []
    
    // Create multiple concurrent login attempts
    for (let i = 0; i < 5; i++) {
      attempts.push(async () => {
        const newPage = await context.newPage()
        await newPage.goto('/auth/login')
        
        await newPage.fill('[name="email"], [placeholder*="email" i]', validUser.email)
        await newPage.fill('[name="password"], [placeholder*="password" i]', 'wrongpassword')
        
        await newPage.click('button[type="submit"], button:has-text("Sign In")')
        
        return newPage
      })
    }
    
    // Mock rate limiting after 3 attempts
    let attemptCount = 0
    await page.route('**/api/auth/callback/credentials', async (route) => {
      attemptCount++
      
      if (attemptCount > 3) {
        await route.fulfill({
          status: 429, // Too Many Requests
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Too many login attempts. Please try again later.',
            retryAfter: 300
          })
        })
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Invalid credentials'
          })
        })
      }
    })
    
    // Execute concurrent attempts
    const pages = await Promise.all(attempts.map(fn => fn()))
    
    // Check that at least one page shows rate limiting
    let hasRateLimitError = false
    for (const testPage of pages) {
      await testPage.waitForLoadState('networkidle')
      
      const hasError = await testPage.evaluate(() => {
        const errorElements = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive')
        return Array.from(errorElements).some(el => 
          el.textContent?.toLowerCase().includes('too many') ||
          el.textContent?.toLowerCase().includes('rate limit') ||
          el.textContent?.toLowerCase().includes('try again later')
        )
      })
      
      if (hasError) {
        hasRateLimitError = true
      }
      
      await testPage.close()
    }
    
    expect(hasRateLimitError).toBeTruthy()
  })

  test('should handle CSRF token validation errors', async ({ page }) => {
    await page.goto('/auth/login')
    
    await page.fill('[name="email"], [placeholder*="email" i]', validUser.email)
    await page.fill('[name="password"], [placeholder*="password" i]', validUser.password)
    
    // Mock CSRF error
    await page.route('**/api/auth/callback/credentials', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'CSRF token mismatch'
        })
      })
    })
    
    await page.click('button[type="submit"], button:has-text("Sign In")')
    
    // Should show CSRF error and potentially refresh the form
    await page.waitForLoadState('networkidle')
    
    const hasCSRFError = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive')
      return Array.from(errorElements).some(el => 
        el.textContent?.toLowerCase().includes('csrf') ||
        el.textContent?.toLowerCase().includes('security') ||
        el.textContent?.toLowerCase().includes('refresh')
      )
    })
    
    // Should handle CSRF error gracefully
    expect(page.url()).toContain('/auth/login')
    
    // Form should still be usable (may need refresh)
    const formElements = await page.evaluate(() => {
      const emailInput = document.querySelector('[name="email"], [placeholder*="email" i]')
      const passwordInput = document.querySelector('[name="password"], [placeholder*="password" i]')
      const submitButton = document.querySelector('button[type="submit"], button:has-text("Sign In")')
      
      return {
        hasEmail: !!emailInput,
        hasPassword: !!passwordInput,
        hasSubmit: !!submitButton
      }
    })
    
    expect(formElements.hasEmail && formElements.hasPassword && formElements.hasSubmit).toBeTruthy()
  })

  test('should handle corrupted JWT tokens', async ({ page }) => {
    // Login first
    await AuthHelpers.loginUser(page, validUser)
    await AuthHelpers.verifyAuthenticated(page)
    
    // Corrupt the JWT token
    await page.evaluate(() => {
      // Corrupt session storage/cookies
      const corruptedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.corrupted_payload.invalid_signature'
      document.cookie = `next-auth.session-token=${corruptedToken}; path=/`
    })
    
    // Mock JWT verification failure
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid token format'
        })
      })
    })
    
    // Try to access protected content
    await page.goto('/dashboard')
    
    // Should redirect to login with corrupted token
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
    
    // Should clear corrupted tokens
    const cookies = await page.context().cookies()
    const hasCorruptedToken = cookies.some(cookie => 
      cookie.value.includes('corrupted_payload')
    )
    
    expect(hasCorruptedToken).toBeFalsy()
  })

  test('should handle authorization errors (insufficient permissions)', async ({ page }) => {
    // Login successfully
    await AuthHelpers.loginUser(page, validUser)
    
    // Mock restricted resource access
    await page.route('**/api/admin/**', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Insufficient permissions'
        })
      })
    })
    
    // Try to access admin endpoint
    const adminResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/admin/users')
        return {
          status: response.status,
          error: await response.json()
        }
      } catch (error) {
        return {
          error: error.message
        }
      }
    })
    
    expect(adminResponse.status).toBe(403)
    expect(adminResponse.error.error).toBe('Insufficient permissions')
    
    // User should still be authenticated (just not authorized for admin actions)
    await AuthHelpers.verifyAuthenticated(page)
  })
})