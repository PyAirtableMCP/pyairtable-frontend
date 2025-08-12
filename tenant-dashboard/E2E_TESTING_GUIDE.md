# E2E Testing Guide - PyAirtable Frontend

This guide covers the comprehensive end-to-end (E2E) testing suite for the PyAirtable tenant dashboard using Playwright.

## 🎯 Overview

The E2E testing suite covers all critical user flows including:
- **Authentication**: Registration, login, logout, session management
- **CRUD Operations**: Create, read, update, delete records
- **Search & Pagination**: Data filtering and navigation
- **Error Handling**: Network failures, API errors, validation

## 🚀 Quick Start

### Prerequisites
1. **Services Running**: Ensure auth service is running on port 8082 and frontend on port 3003
2. **Dependencies Installed**: Run `npm install` in the tenant-dashboard directory
3. **Playwright Browsers**: Install with `npm run test:e2e:install`

### Running Tests

```bash
# Install Playwright browsers (first time only)
npm run test:e2e:install

# Run all E2E tests
npm run test:e2e

# Run specific test suites
npm run test:auth          # Authentication tests only
npm run test:crud          # CRUD operations tests only
npm run test:critical      # Both auth and CRUD tests

# Run tests with visible browser (debugging)
npm run test:auth:headed
npm run test:crud:headed

# Debug mode (step-through debugging)
npm run test:auth:debug
npm run test:crud:debug
```

## 📁 Test Structure

```
e2e/
├── auth.spec.ts                    # Authentication E2E tests
├── crud.spec.ts                    # CRUD operations E2E tests
├── fixtures/
│   ├── test-users.ts              # User credentials and test data
│   └── test-data.ts               # Mock API responses and test fixtures
└── helpers/                       # Test utility functions
    ├── auth-helpers.ts
    ├── chat-helpers.ts
    └── common-helpers.ts
```

## 🔐 Authentication Tests (`auth.spec.ts`)

### Test Coverage
- **User Registration Flow**
  - Successful registration with valid data
  - Form validation (required fields, email format, password strength)
  - Password confirmation matching
  - Registration error handling (duplicate email)

- **User Login Flow**
  - Successful login with valid credentials
  - Form validation and error messages
  - Invalid credentials handling
  - Redirect URL preservation
  - "Remember Me" functionality

- **User Logout Flow**
  - Successful logout and redirect
  - Session expiry handling
  - Automatic logout on expired sessions

- **Error Scenarios**
  - Network failure handling
  - Rate limiting responses
  - Keyboard accessibility

### Running Authentication Tests
```bash
# Run all authentication tests
npm run test:auth

# Run with visible browser for debugging
npm run test:auth:headed

# Debug mode with breakpoints
npm run test:auth:debug

# Run specific registration tests
npx playwright test auth.spec.ts -g "Registration Flow"

# Run specific login tests
npx playwright test auth.spec.ts -g "Login Flow"
```

## 📊 CRUD Operations Tests (`crud.spec.ts`)

### Test Coverage
- **View Operations (Read)**
  - Display list of Airtable bases
  - Show table structure and records
  - Handle empty tables gracefully

- **Create Operations**
  - Create new records with valid data
  - Form validation for required fields
  - Error handling for invalid data

- **Update Operations**
  - Update existing records
  - Handle partial updates
  - Concurrent edit conflict resolution

- **Delete Operations**
  - Delete records with confirmation
  - Cancel delete operations
  - Bulk delete functionality

- **Search & Filter Operations**
  - Text-based record searching
  - Field-based filtering
  - Handle no search results

- **Pagination Operations**
  - Navigate through multiple pages
  - Change page size
  - Pagination with search filters

### Running CRUD Tests
```bash
# Run all CRUD tests
npm run test:crud

# Run with visible browser
npm run test:crud:headed

# Debug mode
npm run test:crud:debug

# Run specific CRUD operations
npx playwright test crud.spec.ts -g "Create Operations"
npx playwright test crud.spec.ts -g "Update Operations"
npx playwright test crud.spec.ts -g "Delete Operations"
npx playwright test crud.spec.ts -g "Search and Filter"
npx playwright test crud.spec.ts -g "Pagination"
```

## 🎯 Test Execution Options

### By Test Type
```bash
# Critical path tests (auth + CRUD)
npm run test:critical

# Smoke tests (key functionality only)
npm run test:smoke

# Visual regression tests
npm run test:visual

# Mobile-specific tests
npm run test:mobile-only

# Desktop cross-browser tests
npm run test:desktop-only
```

### By Browser
```bash
# Chrome only (fastest for development)
npm run test:e2e:core

# Cross-browser testing
npm run test:e2e:cross-browser

# Mobile browsers
npm run test:e2e:mobile

# All browsers and devices
npm run test:regression
```

### By Execution Mode
```bash
# Parallel execution (faster)
npm run test:parallel

# Serial execution (debugging)
npm run test:serial

# CI mode (with reports)
npm run test:ci

# Interactive UI mode
npm run test:e2e:ui
```

## 📈 Test Reports and Debugging

### Viewing Test Reports
```bash
# Show HTML test report
npm run test:e2e:report

# Show execution traces
npm run test:e2e:trace
```

### Debugging Failed Tests
1. **Screenshots**: Automatically captured on test failures in `test-results/`
2. **Videos**: Test execution recordings available in `test-results/`
3. **Traces**: Step-by-step execution traces for detailed debugging
4. **Console Logs**: Browser console output captured during test execution

### Test Report Location
- **HTML Reports**: `test-results/html/index.html`
- **JSON Results**: `test-results/results.json`
- **Screenshots**: `test-results/[test-name]/test-failed-1.png`
- **Videos**: `test-results/[test-name]/video.webm`

## 🔧 Configuration

### Environment Variables
```bash
# Base URL for testing (default: http://localhost:3000)
BASE_URL=http://localhost:3003

# Auth service URL (for API mocking)
AUTH_SERVICE_URL=http://localhost:8082

# Enable additional debugging
DEBUG=pw:api
```

### Test Configuration
The tests use the main `playwright.config.ts` configuration with:
- **Timeout**: 30 seconds per test (60s in CI)
- **Retries**: 0 locally, 2 in CI
- **Screenshots**: On failure
- **Videos**: On retry
- **Traces**: On first retry

## 📋 Test Data Management

### Test Users (`fixtures/test-users.ts`)
- **Standard User**: `user@pyairtable.com` / `test123456`
- **Admin User**: `admin@example.com` / `TestPassword123!`
- **New User**: `newuser@example.com` / `NewPassword123!`

### Mock API Responses (`fixtures/test-data.ts`)
- **Airtable Bases**: Mock base structures and data
- **CRUD Operations**: Success and error response templates
- **Search Results**: Filtered data responses
- **Pagination**: Multi-page data sets

### Generating Test Data
```javascript
// Generate unique test user for parallel execution
import { generateUniqueTestUser } from './fixtures/test-users'

const uniqueUser = generateUniqueTestUser('testrun')
// Creates user like: testrun.1234567890.abc123@example.com
```

## 🚨 Common Issues and Troubleshooting

### Test Failures
1. **Service Not Running**: Ensure auth service on port 8082 and frontend on port 3003
2. **Network Issues**: Check API endpoint availability
3. **Timing Issues**: Increase timeout for slow operations
4. **Element Not Found**: Update selectors if UI has changed

### Debugging Steps
```bash
# Run single test with debug mode
npx playwright test auth.spec.ts -g "should successfully login" --debug

# Run with visible browser to see what's happening
npx playwright test crud.spec.ts --headed

# Generate trace for failed test
npx playwright test --trace on
```

### Performance Issues
```bash
# Reduce parallel workers if system is overloaded
npx playwright test --workers=1

# Run only critical tests for faster feedback
npm run test:critical

# Run smoke tests for quick validation
npm run test:smoke
```

## 📊 Test Metrics and Coverage

### Coverage Areas
- ✅ **Authentication**: 100% of auth flows covered
- ✅ **CRUD Operations**: All basic operations tested
- ✅ **Search & Pagination**: Complete functionality covered
- ✅ **Error Handling**: Network and API error scenarios
- ✅ **Accessibility**: Keyboard navigation and ARIA compliance
- ✅ **Mobile**: Responsive design testing

### Performance Benchmarks
- **Auth Flow**: < 5 seconds for complete login
- **CRUD Operations**: < 3 seconds per operation
- **Search**: < 2 seconds for results display
- **Page Load**: < 3 seconds for dashboard

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
- name: Run E2E Tests
  run: |
    npm run test:ci
    
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: test-results/
```

### Test Execution in CI
```bash
# CI-optimized test run
npm run test:ci

# With specific browser for consistency
npx playwright test --project=chromium-core --reporter=github
```

## 📚 Best Practices

### Writing Tests
1. **Use Page Object Pattern**: Organize selectors and actions
2. **Mock External APIs**: Use reliable, fast mock responses
3. **Independent Tests**: Each test should be self-contained
4. **Descriptive Names**: Test names should explain the scenario
5. **Error Scenarios**: Test both happy path and edge cases

### Test Maintenance
1. **Regular Updates**: Keep selectors updated with UI changes
2. **Data Cleanup**: Ensure tests don't leave behind test data
3. **Performance**: Monitor test execution times
4. **Coverage**: Ensure critical user paths are covered

### Debugging
1. **Use `page.pause()`**: Stop execution to inspect page state
2. **Screenshot on Failure**: Automatic screenshots help diagnose issues
3. **Console Logs**: Check browser console for JavaScript errors
4. **Network Activity**: Monitor API calls during test execution

## 🎯 Next Steps

### Planned Enhancements
1. **Visual Testing**: Add screenshot comparison tests
2. **Performance Testing**: Lighthouse integration for performance metrics
3. **API Testing**: Direct API endpoint testing
4. **Database Testing**: Test data persistence
5. **Security Testing**: Authentication and authorization edge cases

### Contributing
1. **Add Tests**: Create tests for new features
2. **Update Fixtures**: Keep test data current
3. **Improve Selectors**: Use data-testid attributes for stability
4. **Documentation**: Update this guide with changes

---

For additional help or questions about the E2E testing suite, refer to the [Playwright Documentation](https://playwright.dev/) or check the existing test files for examples.