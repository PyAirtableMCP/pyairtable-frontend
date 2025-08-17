import { test, expect } from '@playwright/test'

test('homepage loads successfully', async ({ page }) => {
  // Just navigate to homepage
  await page.goto('http://localhost:5173')
  
  // Check page loaded (very basic check)
  await expect(page).toHaveURL('http://localhost:5173/')
  
  // Check for any element that should exist
  const body = page.locator('body')
  await expect(body).toBeVisible()
})

test('page has content', async ({ page }) => {
  await page.goto('http://localhost:5173')
  
  // Just check page isn't empty
  const content = await page.content()
  expect(content.length).toBeGreaterThan(100)
})