# Code Quality Quick Reference

## Available Commands

```bash
# Linting
npm run lint              # Check for linting issues
npm run lint:fix          # Auto-fix linting issues

# Formatting
npm run format            # Format all files
npm run format:check      # Check formatting without changing files

# Type checking
npm run check             # Run TypeScript compiler check

# All quality checks
npm run validate          # Run type check + lint + tests
```

## Pre-commit Hook

When you commit code, **lint-staged** automatically:

1. Runs ESLint with auto-fix on staged `.ts` and `.tsx` files
2. Formats staged files with Prettier
3. Stages the fixed/formatted files

**Note:** Commits will fail if ESLint finds unfixable errors.

## ESLint Rules Summary

### Errors (will block commits)

- `prefer-const` - Use const for variables that are never reassigned
- `no-var` - Use let/const instead of var
- `curly` - Always use braces for if/else/for blocks
- `eqeqeq` - Use === and !== instead of == and !=
- `react-hooks/rules-of-hooks` - Follow React Hooks rules

### Warnings (should fix)

- `@typescript-eslint/no-explicit-any` - Avoid using `any` type
- `@typescript-eslint/no-unused-vars` - Remove unused variables
- `react-hooks/exhaustive-deps` - Complete dependency arrays
- `jsx-a11y/*` - Accessibility improvements

## Common Fixes

### Unused Variables

```typescript
// ❌ Bad
const data = fetchData();

// ✅ Good
const _data = fetchData(); // Prefix with _ if intentionally unused
```

### Any Type

```typescript
// ❌ Bad
function process(data: any) {}

// ✅ Good
function process(data: unknown) {}
// or better
interface DataType {
  id: string;
  name: string;
}
function process(data: DataType) {}
```

### Dependency Arrays

```typescript
// ❌ Bad
useEffect(() => {
  loadData(userId);
}, []); // Missing userId

// ✅ Good
useEffect(() => {
  loadData(userId);
}, [userId]);
```

### Curly Braces

```typescript
// ❌ Bad
if (condition) doSomething();

// ✅ Good
if (condition) {
  doSomething();
}
```

## Prettier Configuration

- **Indentation:** 2 spaces
- **Quotes:** Double quotes
- **Semi-colons:** Required
- **Line width:** 80 characters
- **Trailing commas:** Always

## IDE Setup

### VS Code (Recommended)

Install extensions:

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)

Add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "typescript",
    "javascriptreact",
    "typescriptreact"
  ]
}
```

## Bypassing Checks (Use Sparingly)

### Skip Pre-commit Hook

```bash
git commit --no-verify -m "commit message"
```

**Warning:** Only use this for emergency fixes. Your code will still need to pass CI checks.

### Disable Specific ESLint Rules

```typescript
// eslint-disable-next-line rule-name
const data: any = {}; // Explain why this is necessary

// Or for a whole file
/* eslint-disable rule-name */
```

## CI Integration

All pull requests must pass:

1. `npm run check` - TypeScript compilation
2. `npm run lint` - ESLint checks
3. `npm run test:ci` - Test suite

## Getting Help

- **ESLint errors:** Check the [ESLint rules documentation](https://eslint.org/docs/rules/)
- **Prettier issues:** Check the [Prettier documentation](https://prettier.io/docs/en/)
- **TypeScript errors:** Check the [TypeScript handbook](https://www.typescriptlang.org/docs/)

## Troubleshooting

### "Parsing error" from ESLint

Usually means a TypeScript configuration issue. Run:

```bash
npm run check
```

### Pre-commit hook not running

Reinstall Husky:

```bash
npm run prepare
```

### Formatting conflicts

Prettier should have the final say. Run:

```bash
npm run format
```

## Status

- ✅ ESLint configured
- ✅ Prettier configured
- ✅ Husky pre-commit hooks active
- ✅ Lint-staged configured
- ✅ 0 errors (201 warnings to address gradually)
