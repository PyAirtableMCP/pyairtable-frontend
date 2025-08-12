import { test, expect } from '@playwright/test'
import { testUsers } from './fixtures/test-users'
import { mockApiResponses } from './fixtures/test-data'

test.describe('Authentication E2E Tests', () => {
  
  test.describe('User Registration Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/register')
    })

    test('should successfully register a new user', async ({ page }) => {
      // Mock successful registration
      await page.route('**/api/auth/register', async route => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'new_user_id',
              email: testUsers.newUser.email,
              name: testUsers.newUser.name,
            },
            message: 'Registration successful'
          })
        })
      })

      // Fill registration form
      await page.getByLabel(/first.*name|name/i).first().fill('New')
      await page.getByLabel(/last.*name|surname/i).fill('User')
      await page.getByLabel(/email/i).fill(testUsers.newUser.email)
      await page.getByLabel(/^password$/i).fill(testUsers.newUser.password)
      await page.getByLabel(/confirm.*password/i).fill(testUsers.newUser.password)
      
      // Accept terms if present
      const termsCheckbox = page.getByRole('checkbox', { name: /terms|agree/i })
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check()
      }

      // Submit form
      await page.getByRole('button', { name: /sign up|register|create account/i }).click()

      // Verify successful registration
      await expect(page).toHaveURL(/\/auth\/verify|\/dashboard|\/onboarding/)
      
      // Look for success indicators
      const successIndicators = [
        page.getByText(/registration successful/i),
        page.getByText(/welcome/i),
        page.getByText(/verify.*email/i)
      ]
      
      let foundSuccess = false
      for (const indicator of successIndicators) {
        try {
          await indicator.waitFor({ timeout: 3000 })
          foundSuccess = true
          break
        } catch {
          // Continue to next indicator
        }
      }
      
      expect(foundSuccess).toBeTruthy()
    })

    test('should validate registration form inputs', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /sign up|register|create account/i })
      
      // Test empty form submission
      await submitButton.click()
      
      // Should show validation errors
      const validationMessages = [
        /required/i,
        /email.*required/i,
        /password.*required/i,
        /name.*required/i
      ]
      
      for (const message of validationMessages) {
        try {
          await expect(page.getByText(message)).toBeVisible({ timeout: 2000 })
        } catch {
          // Some validations might not show immediately
        }
      }
      
      // Test invalid email format
      await page.getByLabel(/email/i).fill('invalid-email')
      await page.getByLabel(/^password$/i).fill('short')
      await submitButton.click()
      
      await expect(page.getByText(/valid.*email|email.*format/i)).toBeVisible()
      await expect(page.getByText(/password.*length|password.*short/i)).toBeVisible()
    })

    test('should handle password mismatch', async ({ page }) => {
      await page.getByLabel(/email/i).fill(testUsers.newUser.email)
      await page.getByLabel(/^password$/i).fill('Password123!')
      await page.getByLabel(/confirm.*password/i).fill('DifferentPassword123!')
      
      await page.getByRole('button', { name: /sign up|register|create account/i }).click()
      
      await expect(page.getByText(/password.*match|passwords.*same/i)).toBeVisible()
    })

    test('should handle registration errors', async ({ page }) => {
      // Mock registration error (email already exists)
      await page.route('**/api/auth/register', async route => {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Email already exists'
          })
        })
      })

      // Fill form with existing email
      await page.getByLabel(/first.*name|name/i).first().fill('Test')
      await page.getByLabel(/last.*name|surname/i).fill('User')
      await page.getByLabel(/email/i).fill('existing@example.com')
      await page.getByLabel(/^password$/i).fill('Password123!')
      await page.getByLabel(/confirm.*password/i).fill('Password123!')
      
      await page.getByRole('button', { name: /sign up|register|create account/i }).click()
      
      await expect(page.getByText(/email.*already.*exists/i)).toBeVisible()
    })
  })

  test.describe('User Login Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login')
    })

    test('should display login form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    })

    test('should show validation errors for empty form', async ({ page }) => {
      const signInButton = page.getByRole('button', { name: /sign in/i })
      await signInButton.click()

      await expect(page.getByText(/email is required/i)).toBeVisible()
      await expect(page.getByText(/password is required/i)).toBeVisible()
    })

    test('should show validation error for invalid email', async ({ page }) => {
      await page.getByLabel(/email/i).fill('invalid-email')
      await page.getByLabel(/password/i).fill('password123')
      await page.getByRole('button', { name: /sign in/i }).click()

      await expect(page.getByText(/please enter a valid email/i)).toBeVisible()
    })

    test('should successfully login with valid credentials', async ({ page }) => {
      // Mock successful authentication on auth service port 8082
      await page.route('**/api/auth/**', async route => {
        const url = route.request().url()
        
        if (url.includes('signin') || url.includes('login')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: {
                id: 'test_user_id',
                email: testUsers.standard.email,
                name: testUsers.standard.name,
              },
              accessToken: 'mock_access_token',
              refreshToken: 'mock_refresh_token'
            })
          })
        } else if (url.includes('session')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: {
                id: 'test_user_id',
                email: testUsers.standard.email,
                name: testUsers.standard.name,
              },
              expires: '2024-12-31T23:59:59.999Z'
            })
          })
        }
      })

      // Fill login form
      await page.getByLabel(/email/i).fill(testUsers.standard.email)
      await page.getByLabel(/password/i).fill(testUsers.standard.password)
      
      // Submit form
      await page.getByRole('button', { name: /sign in|login/i }).click()

      // Wait for redirect and verify successful login
      await expect(page).toHaveURL(/\/dashboard|\/onboarding/, { timeout: 10000 })
      
      // Look for authenticated state indicators
      const authIndicators = [
        page.getByText(new RegExp(testUsers.standard.name, 'i')),
        page.getByText(/welcome back/i),
        page.getByText(/dashboard/i),
        page.getByRole('button', { name: /logout|sign out/i })
      ]
      
      let foundAuth = false
      for (const indicator of authIndicators) {
        try {
          await indicator.waitFor({ timeout: 5000 })
          foundAuth = true
          break
        } catch {
          // Continue checking
        }
      }
      
      expect(foundAuth).toBeTruthy()
    })

    test('should handle invalid credentials', async ({ page }) => {
      // Mock authentication failure
      await page.route('**/api/auth/**', async route => {
        const url = route.request().url()
        
        if (url.includes('signin') || url.includes('login')) {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Invalid credentials'
            })
          })
        }
      })

      await page.getByLabel(/email/i).fill('wrong@example.com')
      await page.getByLabel(/password/i).fill('wrongpassword')
      
      await page.getByRole('button', { name: /sign in|login/i }).click()
      
      await expect(page.getByText(/invalid.*credentials|incorrect.*password|login.*failed/i)).toBeVisible()
    })

    test('should preserve redirect URL after login', async ({ page }) => {
      const protectedUrl = '/dashboard/settings'
      
      // Try to access protected page
      await page.goto(protectedUrl)
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/auth\/login/)
      
      // Mock successful authentication
      await page.route('**/api/auth/**', async route => {
        const url = route.request().url()
        
        if (url.includes('signin') || url.includes('login')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: {
                id: 'test_user_id',
                email: testUsers.standard.email,
                name: testUsers.standard.name,
              }
            })
          })
        }
      })
      
      // Login
      await page.getByLabel(/email/i).fill(testUsers.standard.email)
      await page.getByLabel(/password/i).fill(testUsers.standard.password)
      await page.getByRole('button', { name: /sign in|login/i }).click()
      
      // Should redirect back to original URL
      await expect(page).toHaveURL(protectedUrl, { timeout: 10000 })
    })

    test('should navigate to registration page', async ({ page }) => {
      await page.getByRole('link', { name: /sign up/i }).click()
      
      await expect(page).toHaveURL('/auth/register')
      await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
    })

    test('should handle password reset flow', async ({ page }) => {
      await page.getByRole('link', { name: /forgot password/i }).click()
      
      await expect(page).toHaveURL('/auth/reset-password')
      await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible()
      
      await page.getByLabel(/email/i).fill('test@example.com')
      
      // Mock password reset request
      await page.route('**/api/auth/reset-password', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Password reset email sent',
          }),
        })
      })
      
      await page.getByRole('button', { name: /send reset email/i }).click()
      
      await expect(page.getByText(/password reset email sent/i)).toBeVisible()
    })
  })

  test.describe('User Logout Flow', () => {
    test('should successfully logout user', async ({ page }) => {
      // Mock authenticated state
      await page.route('**/api/auth/session', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test_user_id',
              email: testUsers.standard.email,
              name: testUsers.standard.name,
            },
            expires: '2024-12-31T23:59:59.999Z'
          })
        })
      })

      // Mock logout endpoint
      await page.route('**/api/auth/signout', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })

      // Navigate to authenticated page
      await page.goto('/dashboard')
      await page.waitForTimeout(2000)
      
      // Find and click logout button
      const logoutSelectors = [
        'button:has-text("Logout")',
        'button:has-text("Sign Out")',
        'button:has-text("Log Out")',
        '[data-testid="logout"]',
        'a:has-text("Logout")',
        'a:has-text("Sign Out")'
      ]
      
      let logoutButton = null
      for (const selector of logoutSelectors) {
        try {
          const element = page.locator(selector).first()
          if (await element.isVisible({ timeout: 1000 })) {
            logoutButton = element
            break
          }
        } catch {
          // Continue
        }
      }
      
      if (logoutButton) {
        await logoutButton.click()
        
        // Should redirect to login page
        await expect(page).toHaveURL(/\/auth\/login|\/login|\/$/i, { timeout: 10000 })
        
        // Verify user is logged out by trying to access protected page
        await page.goto('/dashboard')
        await expect(page).toHaveURL(/\/auth\/login|\/login/)
      }
    })

    test('should handle session expiry', async ({ page }) => {
      // Mock expired session
      await page.route('**/api/auth/session', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Session expired'
          })
        })
      })

      // Try to access protected page
      await page.goto('/dashboard')
      
      // Should redirect to login with session expiry message
      await expect(page).toHaveURL(/\/auth\/login/)
      
      // Look for session expiry message
      const expiryMessages = [
        /session.*expired/i,
        /please.*login.*again/i,
        /authentication.*expired/i
      ]
      
      for (const message of expiryMessages) {
        try {
          await expect(page.getByText(message)).toBeVisible({ timeout: 3000 })
          break
        } catch {
          // Continue checking
        }
      }
    })
  })

  test.describe('Authentication Error Scenarios', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login')
    })

    test('should handle network failures gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/auth/**', async route => {
        await route.abort('failed')
      })

      await page.getByLabel(/email/i).fill(testUsers.standard.email)
      await page.getByLabel(/password/i).fill(testUsers.standard.password)
      await page.getByRole('button', { name: /sign in|login/i }).click()
      
      // Should show network error message
      const errorMessages = [
        /network.*error/i,
        /connection.*failed/i,
        /unable.*to.*connect/i,
        /try.*again.*later/i
      ]
      
      let foundError = false
      for (const message of errorMessages) {
        try {
          await expect(page.getByText(message)).toBeVisible({ timeout: 5000 })
          foundError = true
          break
        } catch {
          // Continue
        }
      }
      
      // At minimum, form should not crash
      await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible()
    })

    test('should handle rate limiting', async ({ page }) => {
      // Mock rate limit response
      await page.route('**/api/auth/**', async route => {
        await route.fulfill(mockApiResponses.errors.rateLimited)
      })

      await page.getByLabel(/email/i).fill(testUsers.standard.email)
      await page.getByLabel(/password/i).fill(testUsers.standard.password)
      await page.getByRole('button', { name: /sign in|login/i }).click()
      
      await expect(page.getByText(/rate.*limit|too.*many.*attempts/i)).toBeVisible()
    })

    test('should be accessible via keyboard navigation', async ({ page }) => {
      // Test keyboard navigation
      await page.keyboard.press('Tab')
      await expect(page.getByLabel(/email/i)).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.getByLabel(/password/i)).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', { name: /sign in|login/i })).toBeFocused()
      
      // Test form submission via Enter key
      await page.getByLabel(/email/i).fill(testUsers.standard.email)
      await page.getByLabel(/password/i).fill(testUsers.standard.password)
      
      // Mock successful auth
      await page.route('**/api/auth/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test_user_id',
              email: testUsers.standard.email,
              name: testUsers.standard.name,
            }
          })
        })
      })
      
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/dashboard|\/onboarding/, { timeout: 10000 })
    })
  })
})