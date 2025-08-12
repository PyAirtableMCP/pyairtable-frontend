import { test, expect, Page } from '@playwright/test'
import { testUsers, generateUniqueTestUser } from './fixtures/test-users'

test.describe('Authentication - Complete Login Flow', () => {
  const validUser = testUsers.standard
  
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('should complete full login flow: form submission → JWT storage → protected route access', async ({ page }) => {
    // Step 1: Navigate to login page
    await page.goto('/auth/login')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()

    // Step 2: Fill and submit login form
    await page.fill('[name="email"], [placeholder*="email" i]', validUser.email)
    await page.fill('[name="password"], [placeholder*="password" i]', validUser.password)
    
    // Monitor network requests to verify API call
    const loginRequest = page.waitForRequest(req => 
      req.url().includes('/api/auth/callback/credentials') && req.method() === 'POST'
    )
    
    await page.click('button[type="submit"], button:has-text("Sign In")')
    
    // Step 3: Verify login request was made
    await loginRequest

    // Step 4: Wait for successful redirect and verify we're on protected page
    await expect(page).toHaveURL(/\/(dashboard|chat)/, { timeout: 15000 })

    // Step 5: Verify JWT tokens are stored (check session)
    const sessionResponse = await page.request.get('/api/auth/session')
    expect(sessionResponse.ok()).toBeTruthy()
    
    const sessionData = await sessionResponse.json()
    expect(sessionData.user.email).toBe(validUser.email)
    expect(sessionData.accessToken).toBeDefined()

    // Step 6: Verify access to protected routes
    const protectedRoutes = ['/dashboard', '/chat', '/dashboard/settings']
    
    for (const route of protectedRoutes) {
      await page.goto(route)
      
      // Should not redirect to login
      await page.waitForLoadState('networkidle')
      expect(page.url()).not.toContain('/auth/login')
      
      // Should show authenticated content
      const isAuthenticated = await page.evaluate(async () => {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        return !!data?.user?.email
      })
      expect(isAuthenticated).toBeTruthy()
    }
  })

  test('should maintain session across browser tabs', async ({ page, context }) => {
    // Login in first tab
    await page.goto('/auth/login')
    await page.fill('[name="email"], [placeholder*="email" i]', validUser.email)
    await page.fill('[name="password"], [placeholder*="password" i]', validUser.password)
    await page.click('button[type="submit"], button:has-text("Sign In")')
    
    await expect(page).toHaveURL(/\/(dashboard|chat)/, { timeout: 15000 })

    // Open new tab and verify session is maintained
    const newTab = await context.newPage()
    await newTab.goto('/dashboard')
    
    // Should not redirect to login
    await expect(newTab).not.toHaveURL(/\/auth\/login/)
    
    // Verify session in new tab
    const sessionResponse = await newTab.request.get('/api/auth/session')
    expect(sessionResponse.ok()).toBeTruthy()
    const sessionData = await sessionResponse.json()
    expect(sessionData.user.email).toBe(validUser.email)

    await newTab.close()
  })

  test('should redirect to intended page after login', async ({ page }) => {
    // Try to access protected page while not authenticated
    await page.goto('/dashboard/settings')
    
    // Should redirect to login with callback URL
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
    
    // Login
    await page.fill('[name="email"], [placeholder*="email" i]', validUser.email)
    await page.fill('[name="password"], [placeholder*="password" i]', validUser.password)
    await page.click('button[type="submit"], button:has-text("Sign In")')
    
    // Should redirect back to originally intended page
    await expect(page).toHaveURL('/dashboard/settings', { timeout: 15000 })
  })

  test('should handle concurrent login attempts gracefully', async ({ page, context }) => {
    const newTab = await context.newPage()
    
    // Start login process in both tabs simultaneously
    await Promise.all([
      page.goto('/auth/login'),
      newTab.goto('/auth/login')
    ])
    
    // Fill forms in both tabs
    await Promise.all([
      page.fill('[name="email"], [placeholder*="email" i]', validUser.email),
      newTab.fill('[name="email"], [placeholder*="email" i]', validUser.email)
    ])
    
    await Promise.all([
      page.fill('[name="password"], [placeholder*="password" i]', validUser.password),
      newTab.fill('[name="password"], [placeholder*="password" i]', validUser.password)
    ])
    
    // Submit in both tabs
    await Promise.all([
      page.click('button[type="submit"], button:has-text("Sign In")'),
      newTab.click('button[type="submit"], button:has-text("Sign In")')
    ])
    
    // Both should eventually be authenticated
    await Promise.all([
      expect(page).toHaveURL(/\/(dashboard|chat)/, { timeout: 20000 }),
      expect(newTab).toHaveURL(/\/(dashboard|chat)/, { timeout: 20000 })
    ])
    
    // Verify both tabs have valid sessions
    const [sessionResponse1, sessionResponse2] = await Promise.all([
      page.request.get('/api/auth/session'),
      newTab.request.get('/api/auth/session')
    ])
    
    expect(sessionResponse1.ok()).toBeTruthy()
    expect(sessionResponse2.ok()).toBeTruthy()
    
    const [sessionData1, sessionData2] = await Promise.all([
      sessionResponse1.json(),
      sessionResponse2.json()
    ])
    
    expect(sessionData1.user.email).toBe(validUser.email)
    expect(sessionData2.user.email).toBe(validUser.email)

    await newTab.close()
  })

  test('should persist JWT tokens in secure storage', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('[name="email"], [placeholder*="email" i]', validUser.email)
    await page.fill('[name="password"], [placeholder*="password" i]', validUser.password)
    await page.click('button[type="submit"], button:has-text("Sign In")')
    
    await expect(page).toHaveURL(/\/(dashboard|chat)/, { timeout: 15000 })
    
    // Check that tokens are stored securely (HTTP-only cookies for NextAuth)
    const cookies = await page.context().cookies()
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('next-auth') || 
      cookie.name.includes('__Secure-next-auth') ||
      cookie.name.includes('authjs')
    )
    
    expect(authCookies.length).toBeGreaterThan(0)
    
    // Verify session token exists and has proper security flags
    const sessionCookie = authCookies.find(cookie => 
      cookie.name.includes('session-token') || cookie.name.includes('session')
    )
    
    if (sessionCookie) {
      expect(sessionCookie.httpOnly).toBeTruthy() // Should be HTTP-only for security
      expect(sessionCookie.secure || process.env.NODE_ENV !== 'production').toBeTruthy()
    }
  })

  test('should handle form validation before submission', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Try to submit empty form
    await page.click('button[type="submit"], button:has-text("Sign In")')
    
    // Should show validation errors without making API call
    const hasValidationErrors = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input:invalid, [aria-invalid="true"]')
      const errorMessages = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive')
      return inputs.length > 0 || errorMessages.length > 0
    })
    
    expect(hasValidationErrors).toBeTruthy()
    
    // Should still be on login page
    expect(page.url()).toContain('/auth/login')
  })

  test('should support keyboard navigation throughout login flow', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Tab through form elements
    await page.keyboard.press('Tab') // Should focus email field
    await page.keyboard.type(validUser.email)
    
    await page.keyboard.press('Tab') // Should focus password field
    await page.keyboard.type(validUser.password)
    
    await page.keyboard.press('Tab') // Should focus submit button
    await page.keyboard.press('Enter') // Submit form
    
    // Should complete login flow
    await expect(page).toHaveURL(/\/(dashboard|chat)/, { timeout: 15000 })
  })

  test('should handle page refresh during login flow gracefully', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('[name="email"], [placeholder*="email" i]', validUser.email)
    await page.fill('[name="password"], [placeholder*="password" i]', validUser.password)
    
    // Start login process
    const loginPromise = page.click('button[type="submit"], button:has-text("Sign In")')
    
    // Wait a moment then refresh (simulating user accidentally refreshing)
    await Promise.race([
      loginPromise,
      new Promise(resolve => setTimeout(resolve, 1000))
    ])
    
    await page.reload()
    
    // Should handle gracefully - either complete login or return to clean login state
    await page.waitForLoadState('networkidle')
    
    const isOnLogin = page.url().includes('/auth/login')
    const isOnDashboard = page.url().includes('/dashboard') || page.url().includes('/chat')
    
    expect(isOnLogin || isOnDashboard).toBeTruthy()
    
    // If still on login, form should be functional
    if (isOnLogin) {
      await page.fill('[name="email"], [placeholder*="email" i]', validUser.email)
      await page.fill('[name="password"], [placeholder*="password" i]', validUser.password)
      await page.click('button[type="submit"], button:has-text("Sign In")')
      
      await expect(page).toHaveURL(/\/(dashboard|chat)/, { timeout: 15000 })
    }
  })
})