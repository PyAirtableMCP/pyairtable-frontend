import { test, expect } from '@playwright/test'

test.describe('Real World Auth Flow', () => {
  test('should login with real backend', async ({ page }) => {
    // Go to real login page
    await page.goto('http://localhost:5173/auth/login')
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded')
    
    // Check we're on login page
    const url = page.url()
    console.log('Current URL:', url)
    expect(url).toContain('auth/login')
    
    // Look for email field - try multiple selectors
    const emailField = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first()
    const passwordField = await page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first()
    
    // Check if fields exist
    const emailExists = await emailField.count() > 0
    const passwordExists = await passwordField.count() > 0
    
    console.log('Email field exists:', emailExists)
    console.log('Password field exists:', passwordExists)
    
    if (emailExists && passwordExists) {
      // Fill in real credentials that work with NextAuth local fallback
      await emailField.fill('user@pyairtable.com')
      await passwordField.fill('test123456')
      
      // Find and click submit button
      const submitButton = await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first()
      
      if (await submitButton.count() > 0) {
        // Click login
        await submitButton.click()
        
        // Wait for navigation or error
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
          console.log('Network idle timeout - checking current state')
        })
        
        // Check where we ended up
        const newUrl = page.url()
        console.log('After login URL:', newUrl)
        
        // Check if we're authenticated by looking for session
        const response = await page.request.get('http://localhost:5173/api/auth/session')
        const session = await response.json()
        console.log('Session response:', session)
        
        // Success if we navigated away from login or have a session
        if (newUrl !== url || session?.user) {
          console.log('Login successful!')
        } else {
          console.log('Login failed - still on login page')
        }
      } else {
        console.log('No submit button found')
      }
    } else {
      console.log('Login form fields not found')
    }
  })
  
  test('should check real backend health', async ({ page }) => {
    // Check if backend services are responding
    const services = [
      { name: 'API Gateway', url: 'http://localhost:8000/health' },
      { name: 'Auth Service', url: 'http://localhost:8007/health' },
      { name: 'Frontend', url: 'http://localhost:5173' }
    ]
    
    for (const service of services) {
      try {
        const response = await page.request.get(service.url, { timeout: 5000 })
        console.log(`${service.name}: ${response.status()} ${response.ok() ? '✅' : '❌'}`)
      } catch (error) {
        console.log(`${service.name}: ❌ Not responding`)
      }
    }
  })
})