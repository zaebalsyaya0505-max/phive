# Covert Admin Panel - Security Engineer Implementation

## Overview

Zero-visibility admin panel with steganographic data transmission. No `/admin` URLs. No explicit authentication. Hidden in plain sight.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        COVERT SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│  CLIENT (Mobile/Web)                                            │
│  ├── Event Collection                                           │
│  ├── Double Encryption (ChaCha20 + AES-GCM)                       │
│  └── Steganography Encoding                                     │
├─────────────────────────────────────────────────────────────────┤
│  TRANSPORT                                                      │
│  ├── Dead Drop Endpoints                                        │
│  │   ├── POST /api/v1/sync/preferences                          │
│  │   ├── POST /api/v1/analytics/batch                          │
│  │   ├── POST /api/v1/media/upload                              │
│  │   └── WebSocket /ws/updates                                  │
│  └── Steganography Channels                                     │
│      ├── EXIF Metadata                                          │
│      ├── HTTP Headers                                           │
│      ├── Timing Patterns                                        │
│      └── WebSocket Padding                                      │
├─────────────────────────────────────────────────────────────────┤
│  SERVER                                                         │
│  ├── Stego Extraction                                           │
│  ├── Decryption                                                 │
│  ├── Audit Logging                                              │
│  └── Blind Admin Interface                                      │
│      ├── GET /blog/editor (User Management)                    │
│      ├── GET /help/troubleshooting (Analytics)                  │
│      ├── GET /user/settings (Control Panel)                    │
│      └── GET /api/v1/config (Key Exchange)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Properties

| Property | Implementation |
|----------|----------------|
| **No Admin URLs** | All endpoints disguised as user features |
| **No Explicit Auth** | Access via Konami code, query params, hidden triggers |
| **Double Encryption** | ChaCha20-Poly1305 (client) + AES-256-GCM (server) |
| **Perfect Forward Secrecy** | Per-session ECDH key exchange |
| **Plausible Deniability** | All endpoints serve legitimate dual purpose |
| **Detectability Resistance** | Traffic indistinguishable from normal usage |

---

## Dead Drop Endpoints

### 1. Sync Preferences
```
POST /api/v1/sync/preferences
Cover: User preference sync
Hidden: JSON field steganography
Capacity: 2KB per request
```

### 2. Analytics Batch
```
POST /api/v1/analytics/batch  
Cover: Anonymous analytics
Hidden: Timing + binary encoding
Capacity: 4KB per request
```

### 3. Media Upload
```
POST /api/v1/media/upload
Cover: Image/avatar upload
Hidden: EXIF metadata encoding
Capacity: 8KB per request
```

### 4. WebSocket Updates
```
WebSocket /ws/updates
Cover: Real-time notifications
Hidden: Binary frame padding
Capacity: 512B per frame
```

---

## Steganography Techniques

### EXIF Encoding
```javascript
// GPS coordinates → user_id + timestamp
// Camera model → campaign_id
// Software field → encrypted payload
```

### Header Encoding
```javascript
// Accept-Language q-values → payload bits
// X-Request-ID → UUID with embedded data
// Referer query params → base64 chunks
```

### Timing Channel
```javascript
// 100ms = bit 0, 200ms = bit 1, 300ms = separator
// Bandwidth: 5-20 bits/second
```

### WebSocket Padding
```javascript
// [0x00 0x01] + [random padding] + [length] + [payload]
```

---

## Blind Admin Interface

### Access Methods

| Page | Cover Function | Hidden Function | Access Trigger |
|------|----------------|-----------------|----------------|
| `/blog/editor` | Content editor | User management | Konami code |
| `/help/troubleshooting` | Help docs | Analytics dashboard | `?debug=true` |
| `/user/settings` | Profile settings | Control panel | Triple-click logo |
| `/api/v1/config` | App config | Key exchange | `?view=full` |

### Konami Code
```javascript
// ↑ ↑ ↓ ↓ ← → ← → B A
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown',
                'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight',
                'b','a'];
```

---

## Encryption

### Double Envelope
```
Plaintext
    ↓
ChaCha20-Poly1305 (client session key)
    ↓
AES-256-GCM (server master key)
    ↓
Base64/Steganography encoding
```

### Key Exchange
```javascript
// ECDH P-256 via blind handshake in /api/v1/config
// Server public key hidden in ETag header
// Client public key hidden in X-Request-ID
```

---

## Deliverables for Other Agents

### For Mobile App Builder
- `STEGANOGRAPHY_SPEC.md` - Encoding methods
- `KEY_EXCHANGE.md` - Crypto protocol
- `DEAD_DROPS.json` - Endpoint configuration
- Event schema and payload structure

### For UI Designer
- `BLIND_ROUTES.json` - URL mappings
- `UI_CONSTRAINTS.md` - Security requirements
- HTML templates for blind pages
- Console API specification

---

## Quick Start

```bash
# Install dependencies
cd edge/vercel
npm install

# Set environment variables
export COVERT_MASTER_KEY=your-64-char-hex-key
export COVERT_MASTER_KEY_PREV=previous-key-for-rotation

# Run locally
npm start

# Deploy to Vercel
vercel --prod
```

---

## Testing Covert Channel

```bash
# Test sync preferences endpoint
curl -X POST http://localhost:3000/api/v1/sync/preferences \
  -H "Content-Type: application/json" \
  -H "Accept-Language: en;q=0.9,ru;q=0.8,fr;q=0.7" \
  -d '{"prefs_data":"BASE64_ENCODED_PAYLOAD"}'

# Access blind admin interface
curl http://localhost:3000/blog/editor?view=hidden

# Access with Konami code (browser)
# Visit /blog/editor and press: ↑ ↑ ↓ ↓ ← → ← → B A
```

---

## Audit & Monitoring

All covert events logged to console with prefix `COVERT_`:
- `COVERT_AUDIT` - Individual events
- `COVERT_BATCH` - Batch uploads
- `COVERT_MEDIA` - EXIF-encoded uploads
- `COVERT_WS` - WebSocket messages
- `COVERT_WS_FALLBACK` - HTTP fallback

---

## Security Checklist

- [ ] No `/admin` in URL paths
- [ ] No `admin` in response bodies (unless encrypted)
- [ ] All admin data encrypted before transmission
- [ ] No hardcoded keys in code
- [ ] Keys rotated every 24 hours
- [ ] Session keys ephemeral (PFS)
- [ ] Audit log immutable
- [ ] Rate limiting on dead drop endpoints

---

**Implementation Date:** 2024-01-15  
**Version:** 1.0.0  
**Author:** Security Engineer
