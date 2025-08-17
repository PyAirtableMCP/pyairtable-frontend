import { test, expect } from '@playwright/test'
import { testUsers } from './fixtures/test-users'
import { AuthHelpers } from './helpers/auth-helpers'

test.describe('Auth Diagnostic - Real Backend Testing', () => {
  const validUser = testUsers.standard
  
  test('should diagnose auth flow step by step', async ({ page }) => {
    console.log('🔍 Starting auth diagnostic...')
    
    // Step 1: Check initial state
    console.log('📍 Step 1: Checking initial state')
    await page.goto('/auth/login')
    await expect(page).toHaveURL(/\/auth\/login/)
    console.log('✅ On login page')
    
    // Step 2: Check session before login
    console.log('📍 Step 2: Checking session before login')
    const sessionBefore = await page.request.get('/api/auth/session')
    const sessionDataBefore = await sessionBefore.json()
    console.log('Session before login:', sessionDataBefore)
    expect(sessionDataBefore).toEqual({})
    
    // Step 3: Get CSRF token
    console.log('📍 Step 3: Getting CSRF token')
    const csrfResponse = await page.request.get('/api/auth/csrf')
    const csrfData = await csrfResponse.json()
    console.log('CSRF token retrieved:', csrfData.csrfToken ? 'Yes' : 'No')
    
    // Step 4: Fill form
    console.log('📍 Step 4: Filling login form')
    await page.fill('[name="email"]', validUser.email)
    await page.fill('[name="password"]', validUser.password)
    console.log(`✅ Form filled with email: ${validUser.email}`)
    
    // Step 5: Submit form and monitor requests
    console.log('📍 Step 5: Submitting form and monitoring requests')
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/api/auth/callback/credentials')
    )
    
    const responsePromise = page.waitForResponse(resp => 
      resp.url().includes('/api/auth/callback/credentials')
    )
    
    await page.click('button[type="submit"]')
    
    // Wait for auth request/response
    const authRequest = await requestPromise
    const authResponse = await responsePromise
    
    console.log(`✅ Auth request sent to: ${authRequest.url()}`)
    console.log(`✅ Auth response status: ${authResponse.status()}`)
    
    // Step 6: Check URL after submission  
    console.log('📍 Step 6: Checking URL after form submission')
    await page.waitForTimeout(2000) // Wait for any redirects
    const currentUrl = page.url()
    console.log(`Current URL: ${currentUrl}`)
    
    // Step 7: Check session after login attempt
    console.log('📍 Step 7: Checking session after login attempt')
    const sessionAfter = await page.request.get('/api/auth/session')
    const sessionDataAfter = await sessionAfter.json()
    console.log('Session after login:', sessionDataAfter)
    
    // Step 8: Determine what happened
    console.log('📍 Step 8: Analysis')
    if (sessionDataAfter && sessionDataAfter.user) {
      console.log('✅ User is authenticated!')
      console.log(`Authenticated user: ${sessionDataAfter.user.email}`)
      
      // Check why we're still on login page
      if (currentUrl.includes('/auth/login')) {
        console.log('⚠️  User authenticated but still on login page')
        console.log('This suggests a redirect issue')
        
        // Try manual navigation to dashboard
        console.log('🔄 Trying manual navigation to dashboard')
        await page.goto('/dashboard')
        await page.waitForTimeout(2000)
        console.log(`After manual nav: ${page.url()}`)
      }
    } else {
      console.log('❌ User authentication failed')
      console.log('Auth response status:', authResponse.status())
      const authResponseBody = await authResponse.text()
      console.log('Auth response body:', authResponseBody)
    }
  })
  
  test('should use AuthHelpers and report what happens', async ({ page }) => {
    console.log('🧪 Testing AuthHelpers.loginUser()')
    
    try {
      await AuthHelpers.loginUser(page, validUser)
      console.log('✅ AuthHelpers.loginUser() completed without error')
      
      // Check final state
      const currentUrl = page.url()
      console.log(`Final URL: ${currentUrl}`)
      
      const sessionCheck = await page.request.get('/api/auth/session')
      const sessionData = await sessionCheck.json()
      console.log('Final session:', sessionData)
      
    } catch (error) {
      console.log('❌ AuthHelpers.loginUser() failed:', error.message)
    }
  })
})