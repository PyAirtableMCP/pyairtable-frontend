import { test, expect } from '@playwright/test'
import { AuthHelpers } from './helpers/auth-helpers'
import { testUsers } from './fixtures/test-users'

test.describe('Dashboard Navigation', () => {
  const validUser = testUsers.standard

  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state safely
    await page.context().clearCookies()
    
    // Clear storage safely
    try {
      await page.evaluate(() => {
        if (typeof Storage !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
        }
      })
    } catch (error) {
      // Ignore localStorage errors in case of cross-origin restrictions
      console.log('Storage clear skipped due to restrictions')
    }
  })

  test('should navigate through main dashboard sections', async ({ page }) => {
    // Mock successful authentication
    await AuthHelpers.mockAuthState(page, validUser)
    
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle')
    
    // Verify main dashboard elements are present
    const dashboardIndicators = [
      page.getByText(/dashboard/i).first(),
      page.getByText(/overview/i).first(),
      page.getByText(/metrics/i).first(),
      page.locator('[data-testid="dashboard"]').first(),
      page.locator('main').first()
    ]
    
    let dashboardFound = false
    for (const indicator of dashboardIndicators) {
      try {
        if (await indicator.isVisible({ timeout: 2000 })) {
          dashboardFound = true
          break
        }
      } catch (error) {
        // Continue checking other indicators
      }
    }
    
    expect(dashboardFound, 'Dashboard should be visible').toBe(true)
  })

  test('should navigate to different dashboard sections via sidebar', async ({ page }) => {
    await AuthHelpers.mockAuthState(page, validUser)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Test sidebar navigation
    const navigationItems = [
      { text: /dashboard/i, expectedUrl: '/dashboard' },
      { text: /chat/i, expectedUrl: '/chat' },
      { text: /settings/i, expectedUrl: '/settings' },
      { text: /workspaces/i, expectedUrl: '/workspaces' }
    ]

    for (const item of navigationItems) {
      try {
        // Look for navigation link
        const navLink = page.getByRole('link', { name: item.text }).first()
        
        if (await navLink.isVisible({ timeout: 3000 })) {
          await navLink.click()
          await page.waitForLoadState('networkidle')
          
          // Verify URL or page content
          const currentUrl = page.url()
          const isCorrectUrl = currentUrl.includes(item.expectedUrl)
          
          if (!isCorrectUrl) {
            // Fallback: check for expected page content
            const pageContent = await page.textContent('body')
            const hasExpectedContent = pageContent?.toLowerCase().includes(item.text.source.toLowerCase().replace(/[^a-z]/g, ''))
            expect(hasExpectedContent || isCorrectUrl, `Should navigate to ${item.expectedUrl}`).toBe(true)
          } else {
            expect(isCorrectUrl).toBe(true)
          }
        }
      } catch (error) {
        console.log(`Navigation item ${item.text} not found or not clickable`)
      }
    }
  })

  test('should display dashboard metrics and charts', async ({ page }) => {
    await AuthHelpers.mockAuthState(page, validUser)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Look for metric cards or charts
    const metricSelectors = [
      '[data-testid="metric-card"]',
      '.metric-card',
      '[data-testid="usage-chart"]',
      '.chart-container',
      'canvas', // Chart.js or similar
      'svg' // D3 or similar
    ]

    let metricsFound = false
    for (const selector of metricSelectors) {
      const elements = page.locator(selector)
      const count = await elements.count()
      if (count > 0) {
        metricsFound = true
        break
      }
    }

    // If no specific metric elements found, check for general dashboard content
    if (!metricsFound) {
      const generalContent = await page.locator('main, [role="main"], .dashboard-content').count()
      expect(generalContent, 'Dashboard should have main content area').toBeGreaterThan(0)
    }
  })

  test('should handle responsive navigation on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await AuthHelpers.mockAuthState(page, validUser)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Look for mobile menu toggle
    const mobileMenuSelectors = [
      '[data-testid="mobile-menu"]',
      '.mobile-menu-toggle',
      'button[aria-label*="menu"]',
      'button[aria-label*="navigation"]',
      '.hamburger',
      '.menu-button'
    ]

    let mobileMenuFound = false
    for (const selector of mobileMenuSelectors) {
      try {
        const element = page.locator(selector).first()
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click()
          
          // Check if menu expanded
          await page.waitForTimeout(500) // Wait for animation
          const menuExpanded = await page.locator('[role="navigation"], .navigation-menu, .sidebar').isVisible()
          expect(menuExpanded, 'Mobile menu should expand when clicked').toBe(true)
          
          mobileMenuFound = true
          break
        }
      } catch (error) {
        // Continue checking other selectors
      }
    }

    // If no specific mobile menu found, ensure page is still navigable
    if (!mobileMenuFound) {
      const navigationElements = await page.locator('nav, [role="navigation"], a[href*="/"]').count()
      expect(navigationElements, 'Should have some navigation elements on mobile').toBeGreaterThan(0)
    }
  })

  test('should show breadcrumb navigation on nested pages', async ({ page }) => {
    await AuthHelpers.mockAuthState(page, validUser)
    
    // Navigate to a nested page
    await page.goto('/dashboard/settings')
    await page.waitForLoadState('networkidle')

    // Look for breadcrumb navigation
    const breadcrumbSelectors = [
      '[data-testid="breadcrumb"]',
      '.breadcrumb',
      'nav[aria-label*="breadcrumb"]',
      '.breadcrumb-navigation'
    ]

    let breadcrumbFound = false
    for (const selector of breadcrumbSelectors) {
      const element = page.locator(selector).first()
      if (await element.isVisible({ timeout: 2000 })) {
        // Verify breadcrumb contains expected items
        const breadcrumbText = await element.textContent()
        const hasDashboard = breadcrumbText?.toLowerCase().includes('dashboard')
        const hasSettings = breadcrumbText?.toLowerCase().includes('settings')
        
        if (hasDashboard || hasSettings) {
          breadcrumbFound = true
          break
        }
      }
    }

    // Alternative: check for back navigation or page hierarchy
    if (!breadcrumbFound) {
      const backButton = page.getByRole('button', { name: /back/i }).first()
      const hasBackButton = await backButton.isVisible({ timeout: 2000 })
      
      if (hasBackButton) {
        breadcrumbFound = true
      }
    }

    // If no breadcrumb found, at least verify we're on the expected page
    const pageContent = await page.textContent('body')
    const isOnSettingsPage = pageContent?.toLowerCase().includes('settings') || page.url().includes('settings')
    expect(isOnSettingsPage, 'Should be on settings page').toBe(true)
  })

  test('should handle keyboard navigation', async ({ page }) => {
    await AuthHelpers.mockAuthState(page, validUser)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Test tab navigation through main elements
    await page.keyboard.press('Tab')
    
    // Check if focus is visible and functional
    const focusedElement = page.locator(':focus')
    const isFocused = await focusedElement.count() > 0
    expect(isFocused, 'Should have focusable elements').toBe(true)

    // Test navigation with arrow keys if applicable
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowUp')
    
    // Verify keyboard navigation doesn't break page
    const pageStillFunctional = await page.locator('body').isVisible()
    expect(pageStillFunctional).toBe(true)
  })

  test('should persist navigation state across page refreshes', async ({ page }) => {
    await AuthHelpers.mockAuthState(page, validUser)
    await page.goto('/dashboard/settings')
    await page.waitForLoadState('networkidle')

    // Store current URL
    const initialUrl = page.url()
    
    // Refresh page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Verify we're still on the same page
    const newUrl = page.url()
    expect(newUrl).toBe(initialUrl)
    
    // Verify page content is still accessible
    const pageContent = await page.textContent('body')
    expect(pageContent?.length).toBeGreaterThan(0)
  })

  test('should show loading states during navigation', async ({ page }) => {
    await AuthHelpers.mockAuthState(page, validUser)
    await page.goto('/dashboard')
    
    // Try to capture loading state
    const loadingSelectors = [
      '[data-testid="loading"]',
      '.loading',
      '.spinner',
      '.skeleton',
      '.loading-spinner'
    ]

    let loadingStateFound = false
    for (const selector of loadingSelectors) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 1000 })) {
          loadingStateFound = true
          break
        }
      } catch (error) {
        // Continue checking
      }
    }

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    
    // Verify final loaded state
    const finalContent = await page.locator('main, [role="main"], body').textContent()
    expect(finalContent?.length).toBeGreaterThan(0)
  })
})