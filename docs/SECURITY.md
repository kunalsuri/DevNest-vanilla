# Security Implementation Guide

## Overview

This document describes the comprehensive security enhancements implemented in DevNest, following industry best practices for 2025.

## ✅ Security Features Implemented

### 1. HTTP Security Headers (Helmet)

**Implementation:** `server/index.ts`

Helmet adds the following security headers:

- **Content Security Policy (CSP):** Prevents XSS attacks by controlling resource loading
- **HTTP Strict Transport Security (HSTS):** Forces HTTPS connections
- **X-Content-Type-Options:** Prevents MIME type sniffing
- **X-Frame-Options:** Prevents clickjacking (set via frameSrc in CSP)
- **X-XSS-Protection:** Additional XSS protection for older browsers
- **Referrer Policy:** Controls referrer information

**Configuration:**

```typescript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Required for Tailwind
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      // ... additional directives
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
});
```

### 2. Cross-Origin Resource Sharing (CORS)

**Implementation:** `server/index.ts`

Configured CORS to:

- Validate request origins against allowlist
- Support credentials (cookies)
- Log unauthorized access attempts
- Set appropriate headers for preflight requests

**Environment Variable:**

```env
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

### 3. Rate Limiting

**Implementation:** `server/index.ts`

Two-tier rate limiting system:

**General API Rate Limiter:**

- Window: 15 minutes (configurable via `RATE_LIMIT_WINDOW_MS`)
- Max requests: 100 per window (configurable via `RATE_LIMIT_MAX_REQUESTS`)
- Applied to: All `/api/*` routes

**Authentication Rate Limiter (Stricter):**

- Window: 15 minutes
- Max requests: 5 per window
- Skip successful requests (only count failures)
- Applied to: `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`

**Benefits:**

- Prevents brute force attacks
- Protects against DDoS
- Logs rate limit violations

### 4. Input Validation & Sanitization

**Implementation:** `server/middleware/validation.ts`

Using `express-validator` for:

#### Registration Validation:

- Username: 3-50 chars, alphanumeric + underscore/hyphen only
- Email: Valid email format, normalized
- Password: 6-128 chars, requires uppercase, lowercase, and number
- Names: 1-50 chars, letters/spaces/hyphens/apostrophes only

#### Login Validation:

- Username: 1-50 chars, required
- Password: 1-128 chars, required

#### Profile Update Validation:

- Optional fields (firstName, lastName, email)
- Profile picture URL validation
- Input trimming and sanitization

#### Password Update Validation:

- Current password verification
- New password strength requirements
- Confirmation matching
- Prevents password reuse

### 5. Environment Variable Validation

**Implementation:** `server/env.ts`

Using Zod schema for:

- Type-safe environment variables
- Required vs optional configuration
- Default values for development
- Startup validation (fail fast)
- Production safety warnings

**Validated Variables:**

```typescript
- NODE_ENV: 'development' | 'production' | 'test'
- PORT: number (1-65535)
- DATABASE_URL: valid URL or undefined
- JWT_ACCESS_SECRET: min 32 chars
- JWT_REFRESH_SECRET: min 32 chars
- SESSION_SECRET: min 32 chars
- ALLOWED_ORIGINS: comma-separated list
- RATE_LIMIT_WINDOW_MS: positive number
- RATE_LIMIT_MAX_REQUESTS: positive number
```

**Production Warnings:**
The system warns if default development secrets are used in production.

### 6. JWT Security Enhancements

**Implementation:** `server/auth/jwt-utils.ts`

- Access tokens: 15-minute expiration
- Refresh tokens: 7-day expiration
- Secrets loaded from validated environment variables
- HTTP-only cookies for refresh tokens
- CSRF token protection

### 7. Request Size Limits

**Implementation:** `server/index.ts`

```typescript
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
```

Prevents memory exhaustion attacks from large payloads.

### 8. Security Logging

**Implementation:** Throughout the application

- Failed login attempts
- Rate limit violations
- CORS violations
- Validation failures
- All logs include: IP, timestamp, context

## 🔐 Security Best Practices

### Generating Secure Secrets

For production, generate cryptographically secure secrets:

```bash
# Generate 32-byte base64 secrets
openssl rand -base64 32

# Or 64-byte for extra security
openssl rand -base64 64
```

### Environment Configuration

**Development (.env):**

```env
NODE_ENV=development
JWT_ACCESS_SECRET="dev-secret-change-in-prod"
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5000"
```

**Production (.env):**

```env
NODE_ENV=production
JWT_ACCESS_SECRET="[64+ character random string]"
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
DATABASE_URL="postgresql://user:pass@prod-db:5432/db"
```

### Password Requirements

Enforced by validation middleware:

- Minimum 6 characters (recommend 12+ in production)
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Optional: Add special character requirement

### Rate Limiting Configuration

Adjust based on your application needs:

**Low-traffic API:**

```env
RATE_LIMIT_WINDOW_MS=900000  # 15 min
RATE_LIMIT_MAX_REQUESTS=50
```

**High-traffic API:**

```env
RATE_LIMIT_WINDOW_MS=60000   # 1 min
RATE_LIMIT_MAX_REQUESTS=1000
```

## 🛡️ Additional Security Recommendations

### 1. HTTPS/TLS

Always use HTTPS in production:

- Use Let's Encrypt for free SSL certificates
- Configure HSTS header (already enabled)
- Redirect HTTP to HTTPS at the reverse proxy level

### 2. Database Security

- Use parameterized queries (Drizzle ORM handles this)
- Implement database connection pooling
- Use read replicas for scalability
- Enable database audit logging

### 3. Secrets Management

For production, use a secrets manager:

- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Cloud Secret Manager

### 4. Monitoring & Alerts

Set up alerts for:

- Multiple failed login attempts
- Rate limit violations
- CORS violations
- Unusual traffic patterns
- Error rate spikes

### 5. Security Auditing

Regular security checks:

```bash
# Check for vulnerable dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

### 6. Content Security Policy (CSP) Reporting

Enable CSP reporting to monitor violations:

```typescript
contentSecurityPolicy: {
  directives: {
    // ... existing directives
    reportUri: '/api/csp-report',
  },
}
```

### 7. API Security

Additional recommendations:

- Implement API versioning
- Use API keys for programmatic access
- Implement OAuth2 for third-party integrations
- Add request signing for critical operations

## 📋 Security Checklist

Before deploying to production:

- [ ] All secrets generated using cryptographic random generators
- [ ] No default secrets in production environment
- [ ] HTTPS configured and enforced
- [ ] CORS allowlist configured for production domains only
- [ ] Rate limiting configured appropriately
- [ ] Database connection uses TLS
- [ ] Security headers verified (use securityheaders.com)
- [ ] Dependency audit completed (`npm audit`)
- [ ] Error messages don't leak sensitive information
- [ ] Logging configured for security events
- [ ] Monitoring and alerting set up
- [ ] Backup and disaster recovery plan in place

## 🔍 Testing Security Implementation

### Test Rate Limiting

```bash
# Test general API rate limit
for i in {1..101}; do
  curl http://localhost:5000/api/profile
  echo "Request $i"
done
# Should get 429 after 100 requests

# Test auth rate limit
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
done
# Should get 429 after 5 attempts
```

### Test Input Validation

```bash
# Test weak password
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "weak",
    "firstName": "Test",
    "lastName": "User"
  }'
# Should return 400 with validation error

# Test invalid email
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "not-an-email",
    "password": "Strong123",
    "firstName": "Test",
    "lastName": "User"
  }'
# Should return 400 with validation error
```

### Test CORS

```bash
# Test unauthorized origin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Origin: https://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
# Should be blocked by CORS
```

### Test Environment Validation

```bash
# Test missing required env vars
unset JWT_ACCESS_SECRET
npm run dev
# Should fail with validation error message
```

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet Documentation](https://helmetjs.github.io/)
- [express-validator Documentation](https://express-validator.github.io/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)

## 🔄 Maintenance

Security is an ongoing process:

1. **Weekly:** Review security logs for anomalies
2. **Monthly:** Run `npm audit` and update dependencies
3. **Quarterly:** Review and update security policies
4. **Annually:** Conduct security audit or penetration testing

---

**Last Updated:** 2025-10-29
**Security Version:** 1.0.0
