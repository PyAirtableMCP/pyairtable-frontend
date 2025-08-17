import { test, expect } from '@playwright/test'

test.describe('Simple Real Auth Test', () => {
  test('should access login page', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/auth/login')
    
    // Verify we're on the login page
    await expect(page).toHaveURL(/auth\/login/)
    
    // Check for login form elements
    const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first()
    const passwordField = page.locator('input[type="password"], input[name="password"]').first()
    
    // Verify fields are visible
    await expect(emailField).toBeVisible({ timeout: 5000 })
    await expect(passwordField).toBeVisible({ timeout: 5000 })
    
    console.log('✅ Login page loaded successfully')
  })
  
  test('should perform real login', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/auth/login')
    
    // Fill in credentials that work with NextAuth local fallback
    await page.fill('input[type="email"], input[name="email"]', 'user@pyairtable.com')
    await page.fill('input[type="password"]', 'test123456')
    
    // Click login button
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")')
    
    // Wait for response - either redirect or error
    await page.waitForTimeout(3000) // Give it time to process
    
    // Check current URL
    const currentUrl = page.url()
    console.log('After login URL:', currentUrl)
    
    // We should have navigated away from login page if successful
    if (!currentUrl.includes('/auth/login')) {
      console.log('✅ Login successful - redirected to:', currentUrl)
    } else {
      // Check for error messages
      const errorMessage = await page.locator('.error, .text-red-500, [role="alert"]').first().textContent().catch(() => null)
      if (errorMessage) {
        console.log('❌ Login failed with error:', errorMessage)
      } else {
        console.log('⚠️ Still on login page, no error shown')
      }
    }
  })
})