# Testing Guide

## Overview

This project uses **Vitest** for unit and integration testing, with **React Testing Library** for component tests.

## Quick Start

### Run All Tests

```bash
npm test
```

### Watch Mode (Auto-rerun on changes)

```bash
npm run test:watch
```

### Interactive UI

```bash
npm run test:ui
```

### Coverage Report

```bash
npm run test:coverage
```

### Full Validation (Type Check + Lint + Tests)

```bash
npm run validate
```

## Test Structure

### 📁 Test Organization

```
project/
├── __tests__/              # Root-level smoke tests
│   └── smoke.test.ts
├── client/src/
│   ├── test/
│   │   ├── setup.ts        # Global test setup
│   │   └── test-utils.tsx  # Custom render with providers
│   ├── components/
│   │   └── __tests__/      # Component tests
│   ├── hooks/
│   │   └── __tests__/      # Hook tests
│   └── lib/
│       └── __tests__/      # Utility function tests
└── server/
    └── __tests__/          # Server/API tests
        ├── setup.ts
        ├── auth.test.ts
        └── integration.test.ts
```

## Test Types

### 🧪 Unit Tests

Test individual functions, utilities, and hooks in isolation.

**Example:**

```typescript
// client/src/lib/__tests__/utils.test.ts
import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn function", () => {
  it("should merge class names", () => {
    const result = cn("class1", "class2");
    expect(result).toBe("class1 class2");
  });
});
```

### ⚛️ Component Tests

Test React components with user interactions.

**Example:**

```typescript
// client/src/components/ui/__tests__/button.test.tsx
import { render, screen } from '@/test/test-utils';
import { Button } from '../button';
import userEvent from '@testing-library/user-event';

describe('Button Component', () => {
  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 🔗 Integration Tests

Test API endpoints and server functionality.

**Example:**

```typescript
// server/__tests__/integration.test.ts
import request from "supertest";

describe("Health Check", () => {
  it("should return 200 status", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
  });
});
```

### 💨 Smoke Tests

Quick validation that critical paths work.

**Example:**

```typescript
// __tests__/smoke.test.ts
describe("Smoke Tests", () => {
  it("should import React successfully", async () => {
    const React = await import("react");
    expect(React).toBeDefined();
  });
});
```

## Writing Tests

### Best Practices

1. **Descriptive Test Names**

   ```typescript
   ✅ it('should validate email format')
   ❌ it('test email')
   ```

2. **Arrange-Act-Assert Pattern**

   ```typescript
   it('should handle user input', async () => {
     // Arrange
     const user = userEvent.setup();
     render(<MyComponent />);

     // Act
     await user.type(screen.getByRole('textbox'), 'test');

     // Assert
     expect(screen.getByRole('textbox')).toHaveValue('test');
   });
   ```

3. **Use Testing Library Queries**

   ```typescript
   ✅ screen.getByRole('button', { name: /submit/i })
   ✅ screen.getByLabelText('Email')
   ❌ container.querySelector('.button')
   ```

4. **Mock External Dependencies**

   ```typescript
   import { vi } from "vitest";

   const mockFetch = vi.fn();
   global.fetch = mockFetch;
   ```

5. **Clean Up After Tests**

   ```typescript
   import { afterEach } from "vitest";

   afterEach(() => {
     vi.clearAllMocks();
     localStorage.clear();
   });
   ```

## Custom Test Utils

### Render with Providers

Use the custom `render` from `@/test/test-utils` to include all app providers:

```typescript
import { render, screen } from '@/test/test-utils';
import { MyComponent } from './MyComponent';

it('renders with theme provider', () => {
  render(<MyComponent />);
  // Component has access to QueryClient, ThemeProvider, etc.
});
```

## Coverage Goals

- **Lines:** 70%
- **Functions:** 70%
- **Branches:** 70%
- **Statements:** 70%

View coverage report:

```bash
npm run test:coverage
open coverage/index.html
```

## CI/CD Integration

Tests run automatically on:

- **Push** to `main` or `develop`
- **Pull Requests** to `main` or `develop`

GitHub Actions workflow includes:

1. Type checking (`npm run check`)
2. Linting (`npm run lint`)
3. Unit tests (`npm test`)
4. Build validation (`npm run build`)
5. Security audit (`npm audit`)

## Debugging Tests

### Run Specific Test File

```bash
npx vitest run path/to/test.test.ts
```

### Run Tests Matching Pattern

```bash
npx vitest run -t "Button Component"
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Common Patterns

### Testing Async Operations

```typescript
it("should fetch data", async () => {
  const promise = fetchData();
  await expect(promise).resolves.toEqual(expectedData);
});
```

### Testing Error States

```typescript
it("should handle errors", async () => {
  const promise = failingOperation();
  await expect(promise).rejects.toThrow("Error message");
});
```

### Testing User Interactions

```typescript
it('should handle form submission', async () => {
  const user = userEvent.setup();
  render(<Form onSubmit={handleSubmit} />);

  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(handleSubmit).toHaveBeenCalledWith({
    email: 'test@example.com'
  });
});
```

## Troubleshooting

### Tests Timeout

Increase timeout in `vitest.config.ts`:

```typescript
test: {
  testTimeout: 20000,
  hookTimeout: 20000,
}
```

### Import Errors

Check path aliases in `vitest.config.ts`:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'client', 'src'),
    '@shared': path.resolve(__dirname, 'shared'),
  },
}
```

### Mock Not Working

Ensure mocks are defined before imports:

```typescript
vi.mock("./module", () => ({
  default: vi.fn(),
}));

import { MyComponent } from "./MyComponent";
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

**Happy Testing! 🎉**
