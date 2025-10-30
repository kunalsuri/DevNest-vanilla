# DevNest Test Suite

This directory contains all tests for the DevNest application. Tests are organized by type and mirror the source code structure for easy navigation.

## 📁 Directory Structure

```
tests/
├── unit/                    # Unit tests (isolated component/function tests)
│   ├── client/             # Client-side unit tests
│   │   ├── components/     # React component tests
│   │   │   └── ui/        # UI component tests
│   │   ├── hooks/         # Custom React hooks tests
│   │   └── lib/           # Utility function tests
│   └── server/            # Server-side unit tests
│       └── auth/          # Authentication logic tests
├── integration/            # Integration tests (multi-component/API tests)
│   ├── integration.test.ts
│   └── smoke.test.ts
├── e2e/                   # End-to-end tests (Playwright)
└── setup/                 # Test setup and configuration files
    ├── client-setup.ts    # Client test environment setup
    └── server-setup.ts    # Server test environment setup
```

## 🎯 Test Types

### Unit Tests (`tests/unit/`)

- **Purpose**: Test individual components, functions, or modules in isolation
- **Location**: Mirror the source code structure
- **Example**: Testing a single React component or utility function
- **When to use**: For testing pure functions, component rendering, hook behavior

### Integration Tests (`tests/integration/`)

- **Purpose**: Test how multiple components/modules work together
- **Example**: API endpoint tests, multi-component interactions
- **When to use**: For testing feature workflows, API routes, database interactions

### E2E Tests (`tests/e2e/`)

- **Purpose**: Test complete user workflows in a real browser
- **Tool**: Playwright
- **When to use**: For critical user journeys, authentication flows, complete features

## 🚀 Running Tests

### Run All Tests

```bash
npm test
```

This command will:

1. Run all tests using Vitest
2. Generate a timestamped JSON results file: `tests/yyyymmdd-hhmm-test-results-vitest.json`
3. Generate a timestamped Markdown summary report: `tests/yyyymmdd-hhmm-test-results-summary.md`

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with UI

```bash
npm run test:ui
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

This command will:

1. Run all tests with coverage analysis
2. Generate coverage reports in: `tests/yyyymmdd-hhmm-coverage/`
3. Generate test result reports in the `tests/` folder

### Run Specific Test Files

```bash
# Run unit tests only
npm test tests/unit

# Run integration tests only
npm test tests/integration

# Run specific test file
npm test tests/unit/client/hooks/use-theme.test.tsx
```

### Run Tests for CI/CD

```bash
npm run test:ci
```

This runs type checking, tests, and generates timestamped reports.

### Generate Test Report Only

```bash
npm run test:report
```

Generates a Markdown summary from the most recent JSON test results.

## 📊 Test Results

All test results are saved in the `/tests/` folder with timestamped filenames:

- **JSON Results**: `yyyymmdd-hhmm-test-results-vitest.json` - Raw test data
- **Markdown Summary**: `yyyymmdd-hhmm-test-results-summary.md` - Human-readable report
- **Coverage Reports**: `yyyymmdd-hhmm-coverage/` - Code coverage analysis

**Timestamp Format**: `yyyymmdd-hhmm` (24-hour format)

- Example: `20251030-1425-test-results-summary.md` (October 30, 2025 at 14:25)

## 📝 Writing Tests

### Naming Convention

- Test files: `*.test.ts` or `*.test.tsx`
- Test names: Descriptive, action-oriented

  ```typescript
  describe('ComponentName', () => {
    it('should render correctly', () => { ... });
    it('should handle user click', () => { ... });
  });
  ```

### File Location

Place tests in the appropriate directory:

- **Unit test for `client/src/components/Button.tsx`** → `tests/unit/client/components/Button.test.tsx`
- **Unit test for `server/auth/jwt-utils.ts`** → `tests/unit/server/auth/jwt-utils.test.ts`
- **Integration test for API endpoints** → `tests/integration/api-endpoints.test.ts`

### Import Aliases

Use the configured path aliases:

```typescript
import { Button } from "@/components/ui/button";
import { someUtil } from "@/lib/utils";
import type { User } from "@shared/schema";
import { authMiddleware } from "@server/auth/auth-middleware";
```

## 🔧 Test Configuration

### Vitest Configuration

- Config file: `vitest.config.ts`
- Environment: jsdom (for React components)
- Setup files: `tests/setup/client-setup.ts`

### Coverage Thresholds

- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

## 💡 Best Practices

1. **Arrange-Act-Assert Pattern**

   ```typescript
   it('should update count on click', () => {
     // Arrange
     const { getByRole } = render(<Counter />);

     // Act
     fireEvent.click(getByRole('button'));

     // Assert
     expect(getByRole('status')).toHaveTextContent('1');
   });
   ```

2. **Descriptive Test Names**
   - ✅ `should display error message when form is invalid`
   - ❌ `test error`

3. **One Assertion Per Test** (when possible)
   - Helps pinpoint failures quickly
   - Makes tests more maintainable

4. **Mock External Dependencies**
   - Use `vi.mock()` for modules
   - Mock API calls, file system access, timers

5. **Test User Behavior, Not Implementation**
   - Query by role, label, or text (not test IDs unless necessary)
   - Test what users see and interact with

## 🔍 Debugging Tests

### Run Single Test

```bash
npm test -- use-theme.test
```

### Debug in VS Code

1. Set breakpoint in test file
2. Use "Debug Test" CodeLens above the test
3. Or press F5 with test file open

### Verbose Output

```bash
npm test -- --reporter=verbose
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🤝 Contributing

When adding new features:

1. Write tests first (TDD) or alongside implementation
2. Ensure all tests pass: `npm test`
3. Check coverage: `npm run test:coverage`
4. Place tests in the appropriate directory following the structure above

---

**Questions?** Check the project documentation or ask the team!
