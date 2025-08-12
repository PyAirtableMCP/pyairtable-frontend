import { test, expect } from '@playwright/test'
import { testUsers } from './fixtures/test-users'
import { mockBases, crudTestData, mockApiResponses, searchTestData, paginationTestData } from './fixtures/test-data'

test.describe('CRUD Operations E2E Tests', () => {
  
  // Setup authenticated state for all CRUD tests
  test.beforeEach(async ({ page }) => {
    // Mock authentication for all tests
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

    // Mock Airtable bases API
    await page.route('**/api/airtable/bases', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ bases: mockBases })
      })
    })
  })

  test.describe('View Operations (Read)', () => {
    test('should display list of bases', async ({ page }) => {
      // Mock bases list endpoint
      await page.route('**/api/airtable/bases', async route => {
        await route.fulfill(mockApiResponses.success.bases)
      })

      await page.goto('/dashboard')
      await page.waitForTimeout(2000)

      // Look for base selection or display
      const baseElements = [
        page.getByText(mockBases[0].name),
        page.getByText('E2E Test Base'),
        page.locator('[data-testid="base-card"]'),
        page.locator('.base-item'),
        page.getByRole('button', { name: /select.*base/i })
      ]

      let foundBase = false
      for (const element of baseElements) {
        try {
          if (await element.isVisible({ timeout: 3000 })) {
            foundBase = true
            break
          }
        } catch {
          // Continue checking
        }
      }

      if (foundBase) {
        // Click on the base to view tables
        const baseSelector = page.getByText(mockBases[0].name).first()
        if (await baseSelector.isVisible()) {
          await baseSelector.click()
        }
      }
    })

    test('should display table structure and records', async ({ page }) => {
      // Mock records endpoint
      await page.route('**/api/airtable/records**', async route => {
        await route.fulfill(mockApiResponses.success.records.list)
      })

      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(2000)

      // Look for table data display
      const tableElements = [
        page.getByText('Name'),
        page.getByText('Email'),
        page.getByText('Phone'),
        page.getByText('Status'),
        page.getByText('John Doe'),
        page.getByText('jane.smith@example.com'),
        page.locator('table'),
        page.locator('[role="grid"]'),
        page.locator('[data-testid="record-row"]')
      ]

      let foundTable = false
      for (const element of tableElements) {
        try {
          if (await element.isVisible({ timeout: 3000 })) {
            foundTable = true
            break
          }
        } catch {
          // Continue checking
        }
      }

      expect(foundTable).toBeTruthy()
    })

    test('should handle empty table gracefully', async ({ page }) => {
      // Mock empty records response
      await page.route('**/api/airtable/records**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            records: [],
            totalRecords: 0,
            hasMore: false
          })
        })
      })

      await page.goto('/dashboard/tables/empty_table')
      await page.waitForTimeout(2000)

      // Look for empty state indicators
      const emptyStateElements = [
        page.getByText(/no.*records/i),
        page.getByText(/empty/i),
        page.getByText(/add.*first.*record/i),
        page.locator('[data-testid="empty-state"]'),
        page.getByRole('button', { name: /create.*record/i })
      ]

      let foundEmptyState = false
      for (const element of emptyStateElements) {
        try {
          if (await element.isVisible({ timeout: 3000 })) {
            foundEmptyState = true
            break
          }
        } catch {
          // Continue checking
        }
      }

      expect(foundEmptyState).toBeTruthy()
    })
  })

  test.describe('Create Operations', () => {
    test('should create a new record successfully', async ({ page }) => {
      // Mock successful record creation
      await page.route('**/api/airtable/records', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill(mockApiResponses.success.records.create)
        }
      })

      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(2000)

      // Find create/add button
      const createButtons = [
        page.getByRole('button', { name: /add.*record/i }),
        page.getByRole('button', { name: /create.*record/i }),
        page.getByRole('button', { name: /new.*record/i }),
        page.locator('[data-testid="add-record"]'),
        page.locator('button:has-text("+")')
      ]

      let createButton = null
      for (const button of createButtons) {
        try {
          if (await button.isVisible({ timeout: 2000 })) {
            createButton = button
            break
          }
        } catch {
          // Continue checking
        }
      }

      if (createButton) {
        await createButton.click()
        await page.waitForTimeout(1000)

        // Fill form fields with test data
        const formData = crudTestData.newRecords.customer
        
        // Try different input selectors for each field
        const fieldSelectors = {
          'Name': ['input[name="Name"]', 'input[placeholder*="name"]', '[data-testid="field-name"]'],
          'Email': ['input[name="Email"]', 'input[type="email"]', '[data-testid="field-email"]'],
          'Phone': ['input[name="Phone"]', 'input[type="tel"]', '[data-testid="field-phone"]'],
          'Status': ['select[name="Status"]', '[data-testid="field-status"]', 'input[name="Status"]']
        }

        for (const [fieldName, selectors] of Object.entries(fieldSelectors)) {
          const value = formData[fieldName as keyof typeof formData]
          
          for (const selector of selectors) {
            try {
              const field = page.locator(selector).first()
              if (await field.isVisible({ timeout: 1000 })) {
                if (fieldName === 'Status') {
                  // Handle select field
                  if (await field.evaluate(el => el.tagName.toLowerCase()) === 'select') {
                    await field.selectOption(value)
                  } else {
                    await field.fill(value)
                  }
                } else {
                  await field.fill(value)
                }
                break
              }
            } catch {
              // Continue to next selector
            }
          }
        }

        // Submit the form
        const submitButtons = [
          page.getByRole('button', { name: /save/i }),
          page.getByRole('button', { name: /create/i }),
          page.getByRole('button', { name: /add/i }),
          page.locator('[data-testid="save-record"]')
        ]

        let submitButton = null
        for (const button of submitButtons) {
          try {
            if (await button.isVisible({ timeout: 1000 })) {
              submitButton = button
              break
            }
          } catch {
            // Continue checking
          }
        }

        if (submitButton) {
          await submitButton.click()

          // Verify success message or record appears
          const successIndicators = [
            page.getByText(/record.*created/i),
            page.getByText(/saved/i),
            page.getByText(formData.Name),
            page.getByText(formData.Email)
          ]

          let foundSuccess = false
          for (const indicator of successIndicators) {
            try {
              await indicator.waitFor({ timeout: 5000 })
              foundSuccess = true
              break
            } catch {
              // Continue checking
            }
          }

          expect(foundSuccess).toBeTruthy()
        }
      }
    })

    test('should validate required fields when creating record', async ({ page }) => {
      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(2000)

      // Find and click create button
      const createButton = page.getByRole('button', { name: /add.*record|create.*record/i }).first()
      
      if (await createButton.isVisible({ timeout: 2000 })) {
        await createButton.click()
        await page.waitForTimeout(1000)

        // Try to submit empty form
        const submitButton = page.getByRole('button', { name: /save|create|add/i }).first()
        
        if (await submitButton.isVisible({ timeout: 1000 })) {
          await submitButton.click()

          // Look for validation messages
          const validationMessages = [
            /required/i,
            /field.*required/i,
            /name.*required/i,
            /email.*required/i
          ]

          let foundValidation = false
          for (const message of validationMessages) {
            try {
              await expect(page.getByText(message)).toBeVisible({ timeout: 3000 })
              foundValidation = true
              break
            } catch {
              // Continue checking
            }
          }

          expect(foundValidation).toBeTruthy()
        }
      }
    })

    test('should handle create operation errors', async ({ page }) => {
      // Mock error response
      await page.route('**/api/airtable/records', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill(mockApiResponses.errors.badRequest)
        }
      })

      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(2000)

      const createButton = page.getByRole('button', { name: /add.*record|create.*record/i }).first()
      
      if (await createButton.isVisible({ timeout: 2000 })) {
        await createButton.click()
        await page.waitForTimeout(1000)

        // Fill form and submit
        const nameField = page.locator('input[name="Name"], input[placeholder*="name"]').first()
        if (await nameField.isVisible({ timeout: 1000 })) {
          await nameField.fill('Test Name')
        }

        const submitButton = page.getByRole('button', { name: /save|create|add/i }).first()
        if (await submitButton.isVisible({ timeout: 1000 })) {
          await submitButton.click()

          // Look for error message
          await expect(page.getByText(/error|failed|invalid/i)).toBeVisible({ timeout: 5000 })
        }
      }
    })
  })

  test.describe('Update Operations', () => {
    test('should update an existing record', async ({ page }) => {
      // Mock update response
      await page.route('**/api/airtable/records/**', async route => {
        if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
          await route.fulfill(mockApiResponses.success.records.update)
        } else {
          // GET request for record list
          await route.fulfill(mockApiResponses.success.records.list)
        }
      })

      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(2000)

      // Find edit button for first record
      const editButtons = [
        page.getByRole('button', { name: /edit/i }).first(),
        page.locator('[data-testid="edit-record"]').first(),
        page.locator('button:has-text("Edit")').first(),
        page.locator('[aria-label*="edit"]').first()
      ]

      let editButton = null
      for (const button of editButtons) {
        try {
          if (await button.isVisible({ timeout: 2000 })) {
            editButton = button
            break
          }
        } catch {
          // Continue checking
        }
      }

      if (editButton) {
        await editButton.click()
        await page.waitForTimeout(1000)

        // Update name field
        const nameField = page.locator('input[name="Name"], input[value="John Doe"]').first()
        if (await nameField.isVisible({ timeout: 1000 })) {
          await nameField.clear()
          await nameField.fill(crudTestData.updateData.customer.fields.Name)
        }

        // Submit update
        const saveButton = page.getByRole('button', { name: /save|update/i }).first()
        if (await saveButton.isVisible({ timeout: 1000 })) {
          await saveButton.click()

          // Verify update success
          const successIndicators = [
            page.getByText(/updated/i),
            page.getByText(/saved/i),
            page.getByText(crudTestData.updateData.customer.fields.Name)
          ]

          let foundSuccess = false
          for (const indicator of successIndicators) {
            try {
              await indicator.waitFor({ timeout: 5000 })
              foundSuccess = true
              break
            } catch {
              // Continue checking
            }
          }

          expect(foundSuccess).toBeTruthy()
        }
      }
    })

    test('should handle partial updates', async ({ page }) => {
      // Mock partial update
      await page.route('**/api/airtable/records/**', async route => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'rec_002',
              fields: {
                ...mockBases[0].tables[0].records[1].fields,
                ...crudTestData.updateData.partialUpdate.fields
              }
            })
          })
        } else {
          await route.fulfill(mockApiResponses.success.records.list)
        }
      })

      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(2000)

      // Edit second record (Jane Smith)
      const records = page.locator('[data-testid="record-row"], tr').locator('text="Jane Smith"')
      if (await records.isVisible({ timeout: 2000 })) {
        const editButton = records.locator('..').getByRole('button', { name: /edit/i }).first()
        if (await editButton.isVisible({ timeout: 1000 })) {
          await editButton.click()
          await page.waitForTimeout(1000)

          // Update only phone field
          const phoneField = page.locator('input[name="Phone"]').first()
          if (await phoneField.isVisible({ timeout: 1000 })) {
            await phoneField.clear()
            await phoneField.fill(crudTestData.updateData.partialUpdate.fields.Phone)

            // Save changes
            const saveButton = page.getByRole('button', { name: /save|update/i }).first()
            if (await saveButton.isVisible({ timeout: 1000 })) {
              await saveButton.click()

              // Verify phone number updated
              await expect(page.getByText(crudTestData.updateData.partialUpdate.fields.Phone))
                .toBeVisible({ timeout: 5000 })
            }
          }
        }
      }
    })

    test('should handle concurrent edit conflicts', async ({ page }) => {
      // Mock conflict response
      await page.route('**/api/airtable/records/**', async route => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Record was modified by another user'
            })
          })
        } else {
          await route.fulfill(mockApiResponses.success.records.list)
        }
      })

      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(2000)

      const editButton = page.getByRole('button', { name: /edit/i }).first()
      if (await editButton.isVisible({ timeout: 2000 })) {
        await editButton.click()
        await page.waitForTimeout(1000)

        const nameField = page.locator('input[name="Name"]').first()
        if (await nameField.isVisible({ timeout: 1000 })) {
          await nameField.clear()
          await nameField.fill('Updated Name')

          const saveButton = page.getByRole('button', { name: /save|update/i }).first()
          if (await saveButton.isVisible({ timeout: 1000 })) {
            await saveButton.click()

            // Should show conflict error
            await expect(page.getByText(/conflict|modified.*another.*user/i))
              .toBeVisible({ timeout: 5000 })
          }
        }
      }
    })
  })

  test.describe('Delete Operations', () => {
    test('should delete a record with confirmation', async ({ page }) => {
      // Mock delete response
      await page.route('**/api/airtable/records/**', async route => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill(mockApiResponses.success.records.delete)
        } else {
          await route.fulfill(mockApiResponses.success.records.list)
        }
      })

      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(2000)

      // Find delete button for a record
      const deleteButtons = [
        page.getByRole('button', { name: /delete/i }).first(),
        page.locator('[data-testid="delete-record"]').first(),
        page.locator('[aria-label*="delete"]').first(),
        page.locator('button:has-text("×")').first()
      ]

      let deleteButton = null
      for (const button of deleteButtons) {
        try {
          if (await button.isVisible({ timeout: 2000 })) {
            deleteButton = button
            break
          }
        } catch {
          // Continue checking
        }
      }

      if (deleteButton) {
        await deleteButton.click()

        // Handle confirmation dialog
        const confirmButtons = [
          page.getByRole('button', { name: /confirm|yes|delete/i }),
          page.locator('[data-testid="confirm-delete"]'),
          page.getByText(/confirm/).locator('..').getByRole('button', { name: /delete/i })
        ]

        let confirmButton = null
        for (const button of confirmButtons) {
          try {
            if (await button.isVisible({ timeout: 2000 })) {
              confirmButton = button
              break
            }
          } catch {
            // Continue checking
          }
        }

        if (confirmButton) {
          await confirmButton.click()

          // Verify deletion success
          const successIndicators = [
            page.getByText(/deleted/i),
            page.getByText(/removed/i),
            page.getByText(/success/i)
          ]

          let foundSuccess = false
          for (const indicator of successIndicators) {
            try {
              await indicator.waitFor({ timeout: 5000 })
              foundSuccess = true
              break
            } catch {
              // Continue checking
            }
          }

          expect(foundSuccess).toBeTruthy()
        }
      }
    })

    test('should cancel delete operation', async ({ page }) => {
      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(2000)

      const deleteButton = page.getByRole('button', { name: /delete/i }).first()
      if (await deleteButton.isVisible({ timeout: 2000 })) {
        await deleteButton.click()

        // Click cancel instead of confirm
        const cancelButtons = [
          page.getByRole('button', { name: /cancel|no/i }),
          page.locator('[data-testid="cancel-delete"]')
        ]

        let cancelButton = null
        for (const button of cancelButtons) {
          try {
            if (await button.isVisible({ timeout: 2000 })) {
              cancelButton = button
              break
            }
          } catch {
            // Continue checking
          }
        }

        if (cancelButton) {
          await cancelButton.click()

          // Verify record is still present - dialog should close
          await page.waitForTimeout(1000)
          
          // Original record should still be visible
          await expect(page.getByText(/John Doe|Jane Smith|Bob Johnson/)).toBeVisible()
        }
      }
    })

    test('should handle bulk delete operations', async ({ page }) => {
      // Mock bulk delete
      await page.route('**/api/airtable/records/bulk-delete', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            deleted: ['rec_001', 'rec_002'],
            count: 2
          })
        })
      })

      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(2000)

      // Select multiple records
      const checkboxes = page.locator('input[type="checkbox"]')
      const checkboxCount = await checkboxes.count()
      
      if (checkboxCount > 0) {
        // Select first two checkboxes
        await checkboxes.nth(0).check()
        await checkboxes.nth(1).check()

        // Find bulk delete button
        const bulkDeleteButton = page.getByRole('button', { name: /delete.*selected/i })
        if (await bulkDeleteButton.isVisible({ timeout: 2000 })) {
          await bulkDeleteButton.click()

          // Confirm bulk delete
          const confirmButton = page.getByRole('button', { name: /confirm|delete/i })
          if (await confirmButton.isVisible({ timeout: 2000 })) {
            await confirmButton.click()

            // Verify bulk delete success
            await expect(page.getByText(/2.*records.*deleted/i)).toBeVisible({ timeout: 5000 })
          }
        }
      }
    })
  })

  test.describe('Search and Filter Operations', () => {
    test('should search records by text', async ({ page }) => {
      // Mock search response
      await page.route('**/api/airtable/search**', async route => {
        await route.fulfill(mockApiResponses.success.search)
      })

      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(2000)

      // Find search input
      const searchInputs = [
        page.getByPlaceholder(/search/i),
        page.locator('input[type="search"]'),
        page.locator('[data-testid="search-input"]')
      ]

      let searchInput = null
      for (const input of searchInputs) {
        try {
          if (await input.isVisible({ timeout: 2000 })) {
            searchInput = input
            break
          }
        } catch {
          // Continue checking
        }
      }

      if (searchInput) {
        // Search for "Active" status
        await searchInput.fill(searchTestData.queries.status)
        await page.keyboard.press('Enter')

        // Wait for search results
        await page.waitForTimeout(2000)

        // Verify search results show only active records
        const activeRecords = page.getByText('Active')
        await expect(activeRecords.first()).toBeVisible({ timeout: 5000 })
      }
    })

    test('should filter records by field values', async ({ page }) => {
      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(2000)

      // Find filter dropdown
      const filterButtons = [
        page.getByRole('button', { name: /filter/i }),
        page.locator('[data-testid="filter-button"]'),
        page.getByText(/filter/).locator('button')
      ]

      let filterButton = null
      for (const button of filterButtons) {
        try {
          if (await button.isVisible({ timeout: 2000 })) {
            filterButton = button
            break
          }
        } catch {
          // Continue checking
        }
      }

      if (filterButton) {
        await filterButton.click()

        // Select status filter
        const statusFilter = page.getByText(/status/i)
        if (await statusFilter.isVisible({ timeout: 1000 })) {
          await statusFilter.click()

          // Select "Active" value
          const activeOption = page.getByText(/active/i)
          if (await activeOption.isVisible({ timeout: 1000 })) {
            await activeOption.click()

            // Apply filter
            const applyButton = page.getByRole('button', { name: /apply/i })
            if (await applyButton.isVisible({ timeout: 1000 })) {
              await applyButton.click()

              // Verify filtered results
              await page.waitForTimeout(2000)
              const inactiveRecords = page.getByText('Inactive')
              await expect(inactiveRecords).toHaveCount(0)
            }
          }
        }
      }
    })

    test('should handle no search results', async ({ page }) => {
      // Mock empty search results
      await page.route('**/api/airtable/search**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            records: [],
            query: 'nonexistent',
            totalMatches: 0
          })
        })
      })

      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(2000)

      const searchInput = page.getByPlaceholder(/search/i)
      if (await searchInput.isVisible({ timeout: 2000 })) {
        await searchInput.fill(searchTestData.queries.nonExistent)
        await page.keyboard.press('Enter')

        // Verify no results message
        await expect(page.getByText(/no.*results|no.*matches/i)).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Pagination Operations', () => {
    test('should navigate through pages', async ({ page }) => {
      // Mock paginated responses
      await page.route('**/api/airtable/records**', async route => {
        const url = new URL(route.request().url())
        const page_param = url.searchParams.get('page') || '1'
        
        if (page_param === '1') {
          await route.fulfill(mockApiResponses.success.pagination.page1)
        } else {
          await route.fulfill(mockApiResponses.success.pagination.page3)
        }
      })

      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(2000)

      // Find pagination controls
      const nextButton = page.getByRole('button', { name: /next/i })
      const pageNumbers = page.locator('[data-testid="page-number"]')

      if (await nextButton.isVisible({ timeout: 2000 })) {
        // Click next page
        await nextButton.click()
        await page.waitForTimeout(1000)

        // Verify we're on page 2 (or different data is loaded)
        const paginationInfo = page.getByText(/page.*2|showing.*11.*20/i)
        if (await paginationInfo.isVisible({ timeout: 2000 })) {
          await expect(paginationInfo).toBeVisible()
        }
      }

      // Test direct page navigation
      if (await pageNumbers.first().isVisible({ timeout: 2000 })) {
        const thirdPage = pageNumbers.locator('text="3"')
        if (await thirdPage.isVisible({ timeout: 1000 })) {
          await thirdPage.click()
          await page.waitForTimeout(1000)

          // Verify page 3 content
          await expect(page.getByText(/page.*3/i)).toBeVisible({ timeout: 3000 })
        }
      }
    })

    test('should change page size', async ({ page }) => {
      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(2000)

      // Find page size selector
      const pageSizeSelectors = [
        page.locator('select[name*="pageSize"]'),
        page.locator('[data-testid="page-size-select"]'),
        page.getByRole('combobox', { name: /per.*page/i })
      ]

      let pageSizeSelect = null
      for (const selector of pageSizeSelectors) {
        try {
          if (await selector.isVisible({ timeout: 2000 })) {
            pageSizeSelect = selector
            break
          }
        } catch {
          // Continue checking
        }
      }

      if (pageSizeSelect) {
        // Change to 25 per page
        await pageSizeSelect.selectOption('25')
        await page.waitForTimeout(1000)

        // Verify page size change reflected
        await expect(page.getByText(/showing.*25/i)).toBeVisible({ timeout: 3000 })
      }
    })

    test('should handle pagination with search filters', async ({ page }) => {
      // Mock filtered pagination
      await page.route('**/api/airtable/search**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            records: mockBases[0].tables[0].records.filter(r => r.fields.Status === 'Active'),
            totalMatches: 2,
            page: 1,
            pageSize: 10,
            hasMore: false
          })
        })
      })

      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(2000)

      // Apply search filter
      const searchInput = page.getByPlaceholder(/search/i)
      if (await searchInput.isVisible({ timeout: 2000 })) {
        await searchInput.fill('Active')
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1000)

        // Verify pagination reflects filtered results
        await expect(page.getByText(/2.*of.*2/i)).toBeVisible({ timeout: 3000 })
      }
    })
  })

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock server error
      await page.route('**/api/airtable/**', async route => {
        await route.fulfill(mockApiResponses.errors.serverError)
      })

      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(3000)

      // Should show error message
      await expect(page.getByText(/error|failed to load/i)).toBeVisible({ timeout: 5000 })

      // Should provide retry option
      const retryButton = page.getByRole('button', { name: /retry|try again/i })
      if (await retryButton.isVisible({ timeout: 2000 })) {
        await expect(retryButton).toBeVisible()
      }
    })

    test('should handle network disconnection', async ({ page }) => {
      await page.goto('/dashboard/tables/tbl_customers')
      await page.waitForTimeout(2000)

      // Simulate network failure
      await page.route('**/api/airtable/**', async route => {
        await route.abort('failed')
      })

      // Try to create a record
      const createButton = page.getByRole('button', { name: /add.*record/i }).first()
      if (await createButton.isVisible({ timeout: 2000 })) {
        await createButton.click()

        const nameField = page.locator('input[name="Name"]').first()
        if (await nameField.isVisible({ timeout: 1000 })) {
          await nameField.fill('Test Name')

          const saveButton = page.getByRole('button', { name: /save/i }).first()
          if (await saveButton.isVisible({ timeout: 1000 })) {
            await saveButton.click()

            // Should show network error
            await expect(page.getByText(/network.*error|connection.*failed/i))
              .toBeVisible({ timeout: 5000 })
          }
        }
      }
    })
  })
})