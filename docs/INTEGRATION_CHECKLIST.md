# Week 1 Security - Integration Checklist

## 🚀 Quick Start Guide

This checklist helps you verify and integrate the Week 1 security enhancements.

---

## ✅ Pre-Deployment Verification

### 1. Dependencies Installed ✅
```bash
npm install
```

**Verify packages:**
- [x] helmet
- [x] cors
- [x] express-rate-limit
- [x] express-validator
- [x] @types/cors (dev)

### 2. TypeScript Compilation ✅
```bash
npm run check
```

**Expected:** No errors

### 3. Environment Configuration

**Copy and configure environment file:**
```bash
cp .env.local.example .env
```

**Edit `.env` and update these REQUIRED variables:**

```env
# CRITICAL: Change these before running!
JWT_ACCESS_SECRET="GENERATE-WITH-openssl-rand-base64-32"
JWT_REFRESH_SECRET="GENERATE-WITH-openssl-rand-base64-32"
SESSION_SECRET="GENERATE-WITH-openssl-rand-base64-32"

# Configure for your setup
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5000"
```

**Generate secure secrets:**
```bash
echo "JWT_ACCESS_SECRET=\"$(openssl rand -base64 32)\""
echo "JWT_REFRESH_SECRET=\"$(openssl rand -base64 32)\""
echo "SESSION_SECRET=\"$(openssl rand -base64 32)\""
```

---

## 🧪 Local Testing

### 1. Start Development Server
```bash
npm run dev
```

**Verify startup logs show:**
- ✅ Environment variables validated successfully
- ✅ No security warnings (if using custom secrets)
- ✅ Server listening on port 5000

### 2. Test Rate Limiting

**Test general API rate limit:**
```bash
# Should succeed 100 times, then fail with 429
for i in {1..101}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5000/api/profile
done
```

**Test auth rate limit:**
```bash
# Should fail after 5 attempts with 429
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}' \
    -s -o /dev/null -w "Attempt $i: %{http_code}\n"
done
```

### 3. Test Input Validation

**Test weak password (should return 400):**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "weak",
    "firstName": "Test",
    "lastName": "User"
  }' | jq
```

**Expected response:**
```json
{
  "message": "Validation error",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "password",
      "message": "Password must be between 6 and 128 characters"
    }
  ]
}
```

**Test invalid email (should return 400):**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "not-an-email",
    "password": "Strong123",
    "firstName": "Test",
    "lastName": "User"
  }' | jq
```

### 4. Test CORS

**Test unauthorized origin (should fail):**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Origin: https://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -v 2>&1 | grep -i "access-control"
```

**Test allowed origin (should succeed):**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -v 2>&1 | grep -i "access-control"
```

### 5. Test Security Headers

**Check Helmet headers:**
```bash
curl -I http://localhost:5000 | grep -E "(X-|Content-Security|Strict-Transport)"
```

**Expected headers:**
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: ...`

---

## 📦 Production Deployment

### 1. Environment Configuration

**Create production `.env` file:**
```env
NODE_ENV=production
PORT=5000

# Database (REQUIRED)
DATABASE_URL="postgresql://user:pass@prod-db:5432/db"

# Secrets (REQUIRED - generate unique values)
JWT_ACCESS_SECRET="[64-char random string]"
JWT_REFRESH_SECRET="[64-char random string]"
SESSION_SECRET="[64-char random string]"

# CORS (REQUIRED - your production domain)
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"

# Rate limiting (adjust for your traffic)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
```

### 2. Pre-Deployment Checks

- [ ] All secrets are unique and not defaults
- [ ] `ALLOWED_ORIGINS` contains only production domains
- [ ] Database URL points to production database
- [ ] HTTPS is configured and enforced
- [ ] Reverse proxy (nginx, CloudFront, etc.) is configured
- [ ] SSL certificate is valid

### 3. Security Scan

**Run dependency audit:**
```bash
npm audit
```

**Run Trivy scan (if available):**
```bash
# Via Codacy MCP Server
# Results will show in your security dashboard
```

### 4. Build and Deploy

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

### 5. Post-Deployment Verification

**Test production endpoint:**
```bash
curl -I https://yourdomain.com/api/health
```

**Verify security headers:**
```bash
curl -I https://yourdomain.com | grep -E "(X-|Content-Security|Strict-Transport)"
```

**Test rate limiting in production:**
```bash
# Should get 429 after configured limit
for i in {1..60}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://yourdomain.com/api/profile
  sleep 0.1
done
```

---

## 🔍 Monitoring Setup

### 1. Security Event Monitoring

Watch logs for these security events:
- Rate limit violations
- CORS violations
- Validation failures
- Failed authentication attempts

**View logs:**
```bash
tail -f logs/application-*.log | grep -E "(RATE_LIMIT|CORS|VALIDATION|AUTH)"
```

### 2. Performance Monitoring

Monitor these metrics:
- Request rate vs rate limit threshold
- Failed authentication attempts
- Average response time
- Error rate

### 3. Alerting (Recommended)

Set up alerts for:
- High rate of 429 responses (potential DDoS)
- Spike in failed logins (potential brute force)
- High rate of validation errors
- Unusual traffic patterns

---

## 🐛 Troubleshooting

### Issue: Server won't start

**Error:** "Environment variable validation failed"

**Solution:**
1. Check `.env` file exists
2. Verify all required variables are set
3. Ensure secrets are at least 32 characters
4. Check for typos in variable names

### Issue: 429 Too Many Requests immediately

**Error:** Getting rate limited on first request

**Solution:**
1. Check rate limiting configuration in `.env`
2. Increase `RATE_LIMIT_MAX_REQUESTS` for testing
3. Clear any cached rate limit data
4. Verify your IP isn't being blocked

### Issue: CORS blocking requests

**Error:** "Not allowed by CORS"

**Solution:**
1. Check `ALLOWED_ORIGINS` includes your frontend URL
2. Verify origin header matches exactly (including protocol)
3. Check for trailing slashes
4. Ensure credentials are included in request if needed

### Issue: Input validation always failing

**Error:** All inputs return validation errors

**Solution:**
1. Check request Content-Type is `application/json`
2. Verify JSON is properly formatted
3. Review validation rules in `server/middleware/validation.ts`
4. Check for special characters that need escaping

---

## 📚 Additional Resources

### Documentation
- [SECURITY.md](./SECURITY.md) - Complete security guide
- [IMPLEMENTATION_WEEK1.md](./IMPLEMENTATION_WEEK1.md) - Implementation details
- [WEEK1_FINAL_REPORT.md](./WEEK1_FINAL_REPORT.md) - Final report

### Code References
- `server/env.ts` - Environment validation
- `server/middleware/validation.ts` - Input validation
- `server/index.ts` - Security middleware setup
- `server/auth/jwt-auth-routes.ts` - Auth routes with validation

### External Resources
- [Helmet Documentation](https://helmetjs.github.io/)
- [express-validator Guide](https://express-validator.github.io/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## ✨ Success Criteria

Your integration is successful when:

- [x] Server starts without environment validation errors
- [x] Rate limiting works (429 after threshold)
- [x] Input validation rejects invalid data
- [x] CORS allows only configured origins
- [x] Security headers are present in responses
- [x] TypeScript compiles without errors
- [x] No breaking changes to existing functionality

---

## 🎯 Next Steps

After successful integration:

1. **Test thoroughly** in development environment
2. **Deploy to staging** for additional testing
3. **Monitor logs** for any security events
4. **Proceed to Week 2** - Code Quality Setup
   - ESLint configuration
   - Prettier setup
   - Husky pre-commit hooks

---

**Integration Support:** See troubleshooting section or review documentation files  
**Last Updated:** October 29, 2025  
**Version:** 1.0.0
