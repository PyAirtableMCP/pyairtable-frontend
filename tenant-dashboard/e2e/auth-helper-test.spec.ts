import { test, expect } from '@playwright/test'
import { testUsers } from './fixtures/test-users'
import { AuthHelpers } from './helpers/auth-helpers'

test.describe('Auth Helper Test - Real NextAuth Backend', () => {
  const validUser = testUsers.standard
  
  test.beforeEach(async ({ page }) => {
    // Clear auth state before each test
    await page.context().clearCookies()
    console.log('🧹 Cleared auth state for test')
  })
  
  test('should successfully login using AuthHelpers.loginUser with real backend', async ({ page }) => {
    console.log('🚀 Testing AuthHelpers.loginUser with real NextAuth backend')
    
    try {
      // Use our fixed AuthHelper
      await AuthHelpers.loginUser(page, validUser)
      console.log('✅ AuthHelpers.loginUser completed successfully')
      
      // Verify we ended up on a protected page
      const finalUrl = page.url()
      console.log('📍 Final URL:', finalUrl)
      expect(finalUrl).toMatch(/\/(dashboard|chat)/)
      
      // Verify session is established
      await AuthHelpers.verifyAuthenticated(page)
      console.log('✅ User authentication verified')
      
    } catch (error) {
      console.error('❌ AuthHelpers.loginUser failed:', error.message)
      console.log('📍 Current URL:', page.url())
      throw error
    }
  })
  
  test('should successfully logout using AuthHelpers.logoutUser', async ({ page }) => {
    console.log('🚀 Testing full login-logout cycle')
    
    // First login
    await AuthHelpers.loginUser(page, validUser)
    console.log('✅ Login completed')
    
    // Verify login worked
    await AuthHelpers.verifyAuthenticated(page)
    console.log('✅ Authentication verified')
    
    // Now logout
    await AuthHelpers.logoutUser(page)
    console.log('✅ Logout completed')
    
    // Verify logout worked
    await AuthHelpers.verifyNotAuthenticated(page)
    console.log('✅ Logout verification completed')
  })
})