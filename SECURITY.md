# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Please report security issues privately via [GitHub Security Advisories](https://github.com/kunalsuri/DevNest-vanilla/security/advisories/new).

We aim to respond within **48 hours**. Please include:

- A clear description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- A suggested fix (optional but appreciated)

## Responsible Disclosure

We follow responsible disclosure practices:

1. We will confirm receipt of your report within 48 hours
2. We will work on a patch and keep you informed of progress
3. We will credit you in the release notes unless you prefer anonymity
4. We ask that you do not publicly disclose the issue until a fix is released

## Security Features

DevNest implements the following security controls:

- JWT access tokens (15 min) + HTTP-only refresh token cookies (7 days)
- Per-session CSRF tokens required on all state-changing requests
- bcryptjs password hashing (cost factor 12)
- Helmet security headers including Content Security Policy
- Rate limiting on all authentication endpoints
- Per-account lockout after 10 consecutive failed login attempts
- Append-only audit log of privileged actions
- Sensitive field filtering in all log output
