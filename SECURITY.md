# 🔐 Security Guidelines for pHive

## Overview

This document outlines the security measures implemented in pHive and provides guidelines for maintaining security in production.

## Security Measures Implemented

### 1. API Authentication & Rate Limiting

**File:** `api/bootnode.ts`

- ✅ **Authentication:** All API requests require `x-phive-auth` header
- ✅ **Rate Limiting:** 
  - POST requests: 10 per minute per IP
  - GET requests: 100 per minute per IP
- ✅ **CORS Headers:** Restricted to configured origin
- ✅ **Input Validation:** All inputs validated with Zod schema
- ✅ **TTL (Time-to-Live):** Redis entries expire after 5 minutes

### 2. Input Validation & Sanitization

**Files:** `api/bootnode.ts`, `src/hooks/useTonAuth.ts`

- ✅ **Zod Schemas:** Type-safe validation
- ✅ **Address Format Validation:** TON addresses validated on client & server
- ✅ **Size Limits:** Maximum field lengths enforced
- ✅ **Secure Randomization:** Fisher-Yates algorithm for peer shuffling

### 3. Authentication & Session Management

**File:** `src/hooks/useTonAuth.ts`

- ✅ **Cryptographic Nonce:** Generated with `crypto.getRandomValues()`
- ✅ **Challenge-Response Protocol:** 5-minute expiration window
- ✅ **Token Validation:** Expiration checking implemented
- ⚠️ **Note:** Tokens currently stored in localStorage (XSS-vulnerable)
  - **TODO:** Migrate to httpOnly cookies for production

### 4. Removed Security Risks

**File:** `src/pages/TonLoginPage.tsx`

- ✅ Removed hardcoded demo wallet credentials
- ✅ Improved error message handling (no raw error disclosure)

### 5. Security Headers

**File:** `vercel.json`

Implemented headers:
```
- X-Content-Type-Options: nosniff (prevents MIME-type sniffing)
- X-Frame-Options: DENY/SAMEORIGIN (prevents clickjacking)
- X-XSS-Protection: 1; mode=block (XSS protection)
- Strict-Transport-Security: max-age=31536000 (HSTS)
- Content-Security-Policy (CSP) - prevents inline script execution
- Referrer-Policy: strict-origin-when-cross-origin
```

### 6. Environment Variables

**File:** `.env.example`

- ✅ **PHIVE_SECRET_KEY:** Must be >= 32 characters, alphanumeric + special
- ✅ **ALLOWED_ORIGIN:** CORS origin configured per environment
- ✅ **No Secrets in Code:** All sensitive values via environment variables

## Critical Pre-Production Checklist

### 🔴 MUST DO BEFORE PRODUCTION

- [ ] **Rotate PHIVE_SECRET_KEY**
  ```bash
  openssl rand -base64 32
  ```
  - Add to Vercel Project Settings → Environment Variables

- [ ] **Configure Vercel Secrets**
  ```
  vercel env pull
  # Edit and configure:
  # - PHIVE_SECRET_KEY
  # - KV_REST_API_TOKEN
  # - ALLOWED_ORIGIN (your production domain)
  ```

- [ ] **Enable Supabase RLS (Row-Level Security)**
  - Go to Supabase Dashboard → Tables
  - Enable RLS on all tables
  - Configure policies for authenticated users only

- [ ] **Update Domain Fronting** (if using)
  - `vercel.json` → Replace `YOUR_ACTUAL_SERVER_DOMAIN`

- [ ] **Set CORS Origin**
  - `.env` → Update `ALLOWED_ORIGIN` to your domain

### 🟡 HIGH PRIORITY

- [ ] **Implement httpOnly Cookies**
  ```typescript
  // Replace localStorage token storage with:
  // Set-Cookie: auth_token=...; HttpOnly; Secure; SameSite=Strict
  ```

- [ ] **Enable Vercel Analytics & Monitoring**
  - Track suspicious rate limit hits
  - Monitor error rates

- [ ] **Configure Sentry or Similar**
  - Error tracking without exposing user data
  - Never log sensitive data

- [ ] **Run Security Audit**
  ```bash
  npm audit
  npm audit fix (if needed)
  ```

### 🟢 MEDIUM PRIORITY

- [ ] **Implement Logging & Monitoring**
  - Track failed auth attempts
  - Monitor for abuse patterns

- [ ] **Add IP Validation**
  - Implement geolocation blocking if needed

- [ ] **Content Security Policy (CSP) Fine-tuning**
  - Test CSP in report-only mode
  - Adjust for your specific needs

## API Security Details

### Bootnode API (`api/bootnode.ts`)

**Endpoints:**

#### POST /api/bootnode
Register a new peer node

**Request:**
```bash
curl -X POST https://your-domain.vercel.app/api/bootnode \
  -H "Content-Type: application/json" \
  -H "x-phive-auth: YOUR_PHIVE_SECRET_KEY" \
  -d '{
    "peerId": "QmXxxx...",
    "multiaddr": "/ip4/127.0.0.1/tcp/4001"
  }'
```

**Response:**
```json
{ "status": "registered", "ttl": 300 }
```

**Rate Limit:** 10 requests/minute per IP

---

#### GET /api/bootnode
Get list of active peers

**Request:**
```bash
curl https://your-domain.vercel.app/api/bootnode \
  -H "x-phive-auth: YOUR_PHIVE_SECRET_KEY"
```

**Response:**
```json
{
  "peers": [
    { "peerId": "Qm...", "multiaddr": "...", "ip": "..." }
  ],
  "count": 5
}
```

**Rate Limit:** 100 requests/minute per IP

---

### Rate Limiting

**Rules:**
- Rate limit key: `rate_limit:{METHOD}:{IP}`
- Window: 60 seconds
- Limits:
  - `POST`: 10 req/min
  - `GET`: 100 req/min
- Response on limit exceeded: `429 Too Many Requests`

## Vulnerability Disclosure

If you discover a security vulnerability, please:

1. **DO NOT** create a public issue
2. Email security details to: [your-security-email]
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
4. Allow 48 hours for initial response

## Dependencies Security

**Regularly check for vulnerabilities:**

```bash
# Audit dependencies
npm audit

# Fix automatically if possible
npm audit fix

# Force audit failure on vulnerabilities
npm audit --audit-level=moderate
```

### Installed Security Packages

- `helmet` - Security headers middleware
- `cors` - CORS handling
- `express-rate-limit` - Rate limiting
- `zod` - Runtime type validation
- `@vercel/kv` - Secure KV storage

## Testing Security

### Manual Testing

```bash
# Test rate limiting
for i in {1..15}; do 
  curl -H "x-phive-auth: test" https://your-domain.vercel.app/api/bootnode
done

# Test auth bypass
curl https://your-domain.vercel.app/api/bootnode  # Should fail with 401

# Test CORS
curl -H "Origin: https://other-domain.com" \
  https://your-domain.vercel.app/api/bootnode
```

### Automated Testing

```bash
npm run lint    # Check code quality
npm audit       # Check dependencies
npm run build   # Check build for issues
```

## Production Deployment Checklist

- [ ] Environment variables configured in Vercel
- [ ] PHIVE_SECRET_KEY rotated (minimum 32 characters)
- [ ] Supabase RLS enabled on all tables
- [ ] CORS origin set to production domain
- [ ] Security headers verified in browser DevTools
- [ ] npm audit clean (no vulnerabilities)
- [ ] Error logging configured (Sentry or similar)
- [ ] Monitoring alerts set up
- [ ] Backup & disaster recovery plan in place
- [ ] Security policy documented & communicated
- [ ] Rate limiting tested & verified
- [ ] DDoS protection enabled (Vercel default)

## Useful Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Vercel Security Docs](https://vercel.com/docs/edge-network/security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Web Security Academy](https://portswigger.net/web-security)

---

**Last Updated:** April 24, 2026  
**Version:** 1.0.0  
**Maintained By:** pHive Security Team
