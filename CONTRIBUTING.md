# Contributing to DevNest

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Prerequisites

- **Node.js** 20+ (`node --version`)
- **npm** 10+ (`npm --version`)
- Git

## One-Command Setup

```bash
git clone https://github.com/kunalsuri/DevNest-vanilla.git
cd DevNest-vanilla
npm install && cp .env.example .env && npm run dev
```

The development server starts at `http://localhost:5000`. File-based JSON storage is used by default — no database required for development.

## Branching Strategy

| Branch      | Purpose                         |
| ----------- | ------------------------------- |
| `main`      | Stable releases only            |
| `develop`   | Integration branch for features |
| `feature/*` | Individual feature work         |
| `fix/*`     | Bug fixes                       |

Always branch from `develop`, not `main`.

## Commit Message Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add email verification on registration
fix: prevent password leak in error logs
docs: update README environment variables
chore: upgrade tsx to 4.x
```

| Prefix      | When to use                          |
| ----------- | ------------------------------------ |
| `feat:`     | New feature                          |
| `fix:`      | Bug fix                              |
| `docs:`     | Documentation only                   |
| `chore:`    | Maintenance, deps, tooling           |
| `test:`     | Adding or fixing tests               |
| `refactor:` | Code change with no behaviour change |

## Pull Request Requirements

- Tests pass (`npm test`)
- No TypeScript errors (`npm run check`)
- Code formatted with Prettier (`npm run format`)
- New features include tests
- No TypeScript `any` without justification
- No committed secrets or credentials

## Running Tests

```bash
npm test                        # Run full suite
npm run test:watch              # Watch mode
npm run test:coverage           # With coverage report
```

## Code Style

- **TypeScript strict mode** — enabled in `tsconfig.json`
- **Named exports** preferred over default exports
- **Functional components** with hooks on the frontend
- **No `any`** — use `unknown` and narrow types explicitly
- Prettier handles formatting automatically

## Security Contributions

Please read [SECURITY.md](SECURITY.md) before reporting vulnerabilities.  
**Do not open public GitHub issues for security bugs.**
