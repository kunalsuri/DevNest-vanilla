# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-04-06

### Added

- JWT authentication with short-lived access tokens (15 min) and HTTP-only refresh token cookies (7 days)
- Per-session CSRF token validation on all state-changing requests
- bcryptjs password hashing (cost factor 12)
- Per-account lockout after 10 consecutive failed login attempts (30-minute lock window)
- Rate limiting on all authentication endpoints (authLimiter) and general API routes
- Helmet security headers including Content Security Policy
- User profile management with avatar upload support
- Admin panel: user listing (paginated), role management, user creation/deletion
- Append-only audit log of privileged admin actions
- Sensitive field filtering (`password`, `token`, etc.) in all log output
- File-based JSON storage as default development mode (no database required)
- Feature flags system with admin toggle routes
- Swagger API documentation (development only)
- Health check endpoints (`/health/live`, `/health/ready`)
- Docker support with Node 20 base image
- GitHub Actions CI/CD workflows

[Unreleased]: https://github.com/kunalsuri/DevNest-vanilla/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/kunalsuri/DevNest-vanilla/releases/tag/v1.0.0
