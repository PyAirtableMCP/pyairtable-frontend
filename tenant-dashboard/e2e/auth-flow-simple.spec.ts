import { test, expect } from '@playwright/test'

test.describe('Simple Authentication Flow', () => {
  test('can navigate to login page', async ({ page }) => {
    await page.goto('http://localhost:5173/auth/login')
    
    // Check login form exists
    const emailField = page.locator('input[type="email"]')
    const passwordField = page.locator('input[type="password"]')
    
    await expect(emailField).toBeVisible()
    await expect(passwordField).toBeVisible()
  })
  
  test('can fill and submit login form', async ({ page }) => {
    await page.goto('http://localhost:5173/auth/login')
    
    // Fill form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'test123456')
    
    // Submit
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
    await submitButton.click()
    
    // Wait for navigation (should redirect after login)
    await page.waitForLoadState('networkidle')
    
    // Wait for auth state changes to complete
    await page.waitForFunction(() => {
      // Check if we've navigated away from login and auth is processed
      const notOnLogin = !window.location.pathname.includes('/auth/login')
      const hasMainContent = document.querySelector('main, [role="main"], .main-content') !== null
      const hasUserIndicator = document.querySelector('[data-testid="user-menu"], .user-avatar, [data-user]') !== null
      
      return notOnLogin && (hasMainContent || hasUserIndicator)
    }, { timeout: 10000 })
    
    // Check we're no longer on login page
    const currentUrl = page.url()
    expect(currentUrl).not.toContain('/auth/login')
  })
})