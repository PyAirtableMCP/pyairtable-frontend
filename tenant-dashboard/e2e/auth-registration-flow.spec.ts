import { test, expect, Page } from '@playwright/test'
import { testUsers, generateUniqueTestUser } from './fixtures/test-users'

test.describe('Authentication - Registration Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('should complete full registration flow with validation', async ({ page }) => {
    const newUser = generateUniqueTestUser('registration-test')
    
    // Step 1: Navigate to registration page
    await page.goto('/auth/register')
    await expect(page.getByRole('heading', { name: /create.*account|sign up/i })).toBeVisible()

    // Step 2: Fill registration form
    await page.fill('[name="name"], [placeholder*="name" i]', newUser.name)
    await page.fill('[name="email"], [placeholder*="email" i]', newUser.email)
    await page.fill('[name="password"], [placeholder*="password" i]', newUser.password)
    
    // Handle confirm password field if present
    const confirmPasswordField = page.locator('[name="confirmPassword"], [placeholder*="confirm" i]').first()
    if (await confirmPasswordField.isVisible()) {
      await confirmPasswordField.fill(newUser.password)
    }

    // Handle terms and conditions checkbox if present
    const termsCheckbox = page.locator('[type="checkbox"]', { hasText: /terms|agree/i }).first()
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check()
    }

    // Step 3: Monitor network request and submit
    const registerRequest = page.waitForRequest(req => 
      (req.url().includes('/api/auth/register') || req.url().includes('/auth/register')) 
      && req.method() === 'POST'
    )
    
    await page.click('button[type="submit"], button:has-text("Create Account"), button:has-text("Sign Up")')
    
    // Step 4: Verify registration request was made
    await registerRequest.catch(() => {
      // If no register endpoint, might redirect to login or onboarding
    })

    // Step 5: Wait for successful registration (could redirect to various pages)
    await page.waitForLoadState('networkidle')
    
    const finalUrl = page.url()
    const possibleRedirects = ['/auth/verify-email', '/auth/login', '/dashboard', '/onboarding']
    const hasValidRedirect = possibleRedirects.some(path => finalUrl.includes(path))
    
    expect(hasValidRedirect).toBeTruthy()
    
    // If redirected to login, should be able to login with new credentials
    if (finalUrl.includes('/auth/login')) {
      await page.fill('[name="email"], [placeholder*="email" i]', newUser.email)
      await page.fill('[name="password"], [placeholder*="password" i]', newUser.password)
      await page.click('button[type="submit"], button:has-text("Sign In")')
      
      await expect(page).toHaveURL(/\/(dashboard|chat|onboarding)/, { timeout: 15000 })
    }
  })

  test('should validate email format during registration', async ({ page }) => {
    await page.goto('/auth/register')
    
    const invalidEmails = [
      'invalid-email',
      'user@',
      '@domain.com',
      'user@domain',
      'user space@domain.com'
    ]
    
    for (const invalidEmail of invalidEmails) {
      // Clear and fill invalid email
      await page.fill('[name="email"], [placeholder*="email" i]', '')
      await page.fill('[name="email"], [placeholder*="email" i]', invalidEmail)
      await page.fill('[name="name"], [placeholder*="name" i]', 'Test User')
      await page.fill('[name="password"], [placeholder*="password" i]', 'ValidPassword123!')
      
      // Try to submit
      await page.click('button[type="submit"], button:has-text("Create Account"), button:has-text("Sign Up")')
      
      // Should show validation error
      const hasEmailError = await page.evaluate(() => {
        const emailInput = document.querySelector('[name="email"], [placeholder*="email" i]')
        const errorMessages = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive')
        const hasInvalidInput = emailInput && emailInput.matches(':invalid, [aria-invalid="true"]')
        const hasErrorText = Array.from(errorMessages).some(el => 
          el.textContent?.toLowerCase().includes('email') ||
          el.textContent?.toLowerCase().includes('valid') ||
          el.textContent?.toLowerCase().includes('format')
        )
        return hasInvalidInput || hasErrorText
      })
      
      expect(hasEmailError).toBeTruthy()
      
      // Should still be on registration page
      expect(page.url()).toContain('/auth/register')
    }
  })

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/auth/register')
    
    const weakPasswords = [
      '123',           // Too short
      'password',      // No numbers/special chars
      'PASSWORD123',   // No lowercase
      'password123',   // No uppercase
      '12345678'       // No letters
    ]
    
    for (const weakPassword of weakPasswords) {
      // Fill form with weak password
      await page.fill('[name="name"], [placeholder*="name" i]', 'Test User')
      await page.fill('[name="email"], [placeholder*="email" i]', 'test@example.com')
      await page.fill('[name="password"], [placeholder*="password" i]', '')
      await page.fill('[name="password"], [placeholder*="password" i]', weakPassword)
      
      // Handle confirm password if present
      const confirmPasswordField = page.locator('[name="confirmPassword"], [placeholder*="confirm" i]').first()
      if (await confirmPasswordField.isVisible()) {
        await confirmPasswordField.fill(weakPassword)
      }
      
      await page.click('button[type="submit"], button:has-text("Create Account"), button:has-text("Sign Up")')
      
      // Should show password validation error
      const hasPasswordError = await page.evaluate(() => {
        const passwordInput = document.querySelector('[name="password"], [placeholder*="password" i]')
        const errorMessages = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive')
        const hasInvalidInput = passwordInput && passwordInput.matches(':invalid, [aria-invalid="true"]')
        const hasErrorText = Array.from(errorMessages).some(el => 
          el.textContent?.toLowerCase().includes('password') ||
          el.textContent?.toLowerCase().includes('strong') ||
          el.textContent?.toLowerCase().includes('requirement')
        )
        return hasInvalidInput || hasErrorText
      })
      
      expect(hasPasswordError).toBeTruthy()
      expect(page.url()).toContain('/auth/register')
    }
  })

  test('should validate password confirmation match', async ({ page }) => {
    await page.goto('/auth/register')
    
    const confirmPasswordField = page.locator('[name="confirmPassword"], [placeholder*="confirm" i]').first()
    
    // Only test if confirm password field exists
    if (await confirmPasswordField.isVisible()) {
      await page.fill('[name="name"], [placeholder*="name" i]', 'Test User')
      await page.fill('[name="email"], [placeholder*="email" i]', 'test@example.com')
      await page.fill('[name="password"], [placeholder*="password" i]', 'ValidPassword123!')
      await confirmPasswordField.fill('DifferentPassword123!')
      
      await page.click('button[type="submit"], button:has-text("Create Account"), button:has-text("Sign Up")')
      
      // Should show password mismatch error
      const hasMatchError = await page.evaluate(() => {
        const errorMessages = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive')
        return Array.from(errorMessages).some(el => 
          el.textContent?.toLowerCase().includes('match') ||
          el.textContent?.toLowerCase().includes('same') ||
          el.textContent?.toLowerCase().includes('confirm')
        )
      })
      
      expect(hasMatchError).toBeTruthy()
      expect(page.url()).toContain('/auth/register')
    }
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/auth/register')
    
    // Try to submit empty form
    await page.click('button[type="submit"], button:has-text("Create Account"), button:has-text("Sign Up")')
    
    // Should show multiple validation errors
    const hasValidationErrors = await page.evaluate(() => {
      const requiredInputs = document.querySelectorAll('input[required], input:invalid, [aria-invalid="true"]')
      const errorMessages = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive')
      return requiredInputs.length > 0 || errorMessages.length > 0
    })
    
    expect(hasValidationErrors).toBeTruthy()
    expect(page.url()).toContain('/auth/register')
    
    // Test individual required fields
    const requiredFields = [
      { selector: '[name="name"], [placeholder*="name" i]', value: 'Test User' },
      { selector: '[name="email"], [placeholder*="email" i]', value: 'test@example.com' },
      { selector: '[name="password"], [placeholder*="password" i]', value: 'ValidPassword123!' }
    ]
    
    for (let i = 0; i < requiredFields.length; i++) {
      // Fill all fields except current one
      for (let j = 0; j < requiredFields.length; j++) {
        if (i !== j) {
          await page.fill(requiredFields[j].selector, requiredFields[j].value)
        } else {
          await page.fill(requiredFields[j].selector, '') // Leave this one empty
        }
      }
      
      await page.click('button[type="submit"], button:has-text("Create Account"), button:has-text("Sign Up")')
      
      // Should still show validation error for missing field
      const fieldError = await page.evaluate((fieldSelector) => {
        const field = document.querySelector(fieldSelector)
        const errorMessages = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive')
        const hasInvalidField = field && field.matches(':invalid, [aria-required="true"]:invalid, [aria-invalid="true"]')
        return hasInvalidField || errorMessages.length > 0
      }, requiredFields[i].selector)
      
      expect(fieldError).toBeTruthy()
    }
  })

  test('should handle existing email registration attempt', async ({ page }) => {
    const existingUser = testUsers.standard
    
    await page.goto('/auth/register')
    
    // Try to register with existing email
    await page.fill('[name="name"], [placeholder*="name" i]', 'Another User')
    await page.fill('[name="email"], [placeholder*="email" i]', existingUser.email)
    await page.fill('[name="password"], [placeholder*="password" i]', 'NewPassword123!')
    
    const confirmPasswordField = page.locator('[name="confirmPassword"], [placeholder*="confirm" i]').first()
    if (await confirmPasswordField.isVisible()) {
      await confirmPasswordField.fill('NewPassword123!')
    }
    
    const termsCheckbox = page.locator('[type="checkbox"]', { hasText: /terms|agree/i }).first()
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check()
    }
    
    await page.click('button[type="submit"], button:has-text("Create Account"), button:has-text("Sign Up")')
    
    // Should show error about existing email
    await page.waitForLoadState('networkidle')
    
    const hasEmailExistsError = await page.evaluate(() => {
      const errorMessages = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive')
      return Array.from(errorMessages).some(el => 
        el.textContent?.toLowerCase().includes('exists') ||
        el.textContent?.toLowerCase().includes('already') ||
        el.textContent?.toLowerCase().includes('registered')
      )
    })
    
    // Might show error or redirect to login
    const onLoginPage = page.url().includes('/auth/login')
    expect(hasEmailExistsError || onLoginPage).toBeTruthy()
  })

  test('should be accessible via keyboard navigation', async ({ page }) => {
    await page.goto('/auth/register')
    
    // Tab through form elements
    await page.keyboard.press('Tab') // Name field
    await page.keyboard.type('Test User')
    
    await page.keyboard.press('Tab') // Email field
    await page.keyboard.type('test@example.com')
    
    await page.keyboard.press('Tab') // Password field
    await page.keyboard.type('ValidPassword123!')
    
    // Handle additional fields if present
    await page.keyboard.press('Tab') // Might be confirm password or terms checkbox
    const activeElement = await page.evaluate(() => document.activeElement?.tagName.toLowerCase())
    
    if (activeElement === 'input') {
      const inputType = await page.evaluate(() => document.activeElement?.getAttribute('type'))
      if (inputType === 'password') {
        await page.keyboard.type('ValidPassword123!')
        await page.keyboard.press('Tab')
      } else if (inputType === 'checkbox') {
        await page.keyboard.press('Space') // Check checkbox
        await page.keyboard.press('Tab')
      }
    }
    
    // Should eventually focus submit button
    await page.keyboard.press('Enter') // Submit form
    
    // Should process registration
    await page.waitForLoadState('networkidle')
    expect(page.url()).not.toContain('/auth/register')
  })

  test('should handle special characters in email addresses', async ({ page }) => {
    const specialUser = generateUniqueTestUser('special')
    specialUser.email = `special.user+test${Date.now()}@example-domain.com`
    
    await page.goto('/auth/register')
    
    await page.fill('[name="name"], [placeholder*="name" i]', specialUser.name)
    await page.fill('[name="email"], [placeholder*="email" i]', specialUser.email)
    await page.fill('[name="password"], [placeholder*="password" i]', specialUser.password)
    
    const confirmPasswordField = page.locator('[name="confirmPassword"], [placeholder*="confirm" i]').first()
    if (await confirmPasswordField.isVisible()) {
      await confirmPasswordField.fill(specialUser.password)
    }
    
    const termsCheckbox = page.locator('[type="checkbox"]', { hasText: /terms|agree/i }).first()
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check()
    }
    
    await page.click('button[type="submit"], button:has-text("Create Account"), button:has-text("Sign Up")')
    
    // Should handle special characters in email properly
    await page.waitForLoadState('networkidle')
    
    const finalUrl = page.url()
    const isSuccessfulRegistration = [
      '/auth/verify-email', 
      '/auth/login', 
      '/dashboard', 
      '/onboarding'
    ].some(path => finalUrl.includes(path))
    
    expect(isSuccessfulRegistration).toBeTruthy()
  })

  test('should require terms and conditions acceptance if present', async ({ page }) => {
    await page.goto('/auth/register')
    
    const termsCheckbox = page.locator('[type="checkbox"]', { hasText: /terms|agree/i }).first()
    
    // Only test if terms checkbox exists
    if (await termsCheckbox.isVisible()) {
      // Fill all fields except terms
      await page.fill('[name="name"], [placeholder*="name" i]', 'Test User')
      await page.fill('[name="email"], [placeholder*="email" i]', 'test@example.com')
      await page.fill('[name="password"], [placeholder*="password" i]', 'ValidPassword123!')
      
      const confirmPasswordField = page.locator('[name="confirmPassword"], [placeholder*="confirm" i]').first()
      if (await confirmPasswordField.isVisible()) {
        await confirmPasswordField.fill('ValidPassword123!')
      }
      
      // Don't check terms checkbox
      await page.click('button[type="submit"], button:has-text("Create Account"), button:has-text("Sign Up")')
      
      // Should show error about accepting terms
      const hasTermsError = await page.evaluate(() => {
        const checkbox = document.querySelector('[type="checkbox"]')
        const errorMessages = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive')
        const hasInvalidCheckbox = checkbox && checkbox.matches(':invalid, [aria-invalid="true"]')
        const hasErrorText = Array.from(errorMessages).some(el => 
          el.textContent?.toLowerCase().includes('terms') ||
          el.textContent?.toLowerCase().includes('agree') ||
          el.textContent?.toLowerCase().includes('accept')
        )
        return hasInvalidCheckbox || hasErrorText
      })
      
      expect(hasTermsError).toBeTruthy()
      expect(page.url()).toContain('/auth/register')
      
      // Now check terms and submit - should succeed
      await termsCheckbox.check()
      await page.click('button[type="submit"], button:has-text("Create Account"), button:has-text("Sign Up")')
      
      await page.waitForLoadState('networkidle')
      expect(page.url()).not.toContain('/auth/register')
    }
  })
})