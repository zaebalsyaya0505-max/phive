# Covert Steganography Specification
## Version: 1.0.0
## Classification: Security Engineer Deliverable

---

## Overview

This document specifies how data is hidden within seemingly legitimate traffic. All techniques maintain plausibility and deniability.

---

## 1. EXIF Metadata Encoding

### Location: `/api/v1/media/upload`

**Embedding Strategy:**
- GPS coordinates field → Encoded user_id + timestamp
- Camera model field → Ad campaign identifier
- Software field → Encrypted metrics payload

**Format:**
```
GPS Latitude:  encoded_user_id (as decimal degrees)
GPS Longitude: timestamp (as decimal degrees)
Camera Model:  base64(campaign_id + checksum)
Software:      aes_gcm(encrypted_metrics)
```

**Example:**
```javascript
{
  "0th": {
    "Make": "Canon",
    "Model": "EOS R5", // Actually: base64(campaign_id)
    "Software": "Adobe Lightroom", // Actually: encrypted payload
    "DateTime": "2024:01:15 14:30:00" // Cover timestamp
  },
  "GPS": {
    "GPSLatitude": [[45, 1], [30, 1], [0, 1]], // Encoded user_id
    "GPSLongitude": [[122, 1], [41, 1], [0, 1]] // Encoded timestamp
  }
}
```

---

## 2. HTTP Header Steganography

### Location: All endpoints, especially `/api/v1/config` (GET)

**Techniques:**

#### A. Accept-Language q-values
```
Accept-Language: en-US,en;q=0.9,ru;q=0.8,fr;q=0.7
                                   ^^^
                                   Encoded bits (q-values encode data)
```

#### B. X-Request-ID Pattern
```
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
              UUIDv4 with embedded payload in variant bits
```

#### C. User-Agent Variation
```
User-Agent: Mozilla/5.0 (Linux; Android 14; SM-G998B)
                                           ^^^^^^^^
                                           Device ID encodes 4 bytes
```

#### D. Referer Query Parameters
```
Referer: https://app.com/page?ref=home&track=abc123
                                         ^^^^^^
                                         Base64 encoded data
```

---

## 3. Timing Channel Encoding

### Location: `/ws/updates` WebSocket

**Principle:** Inter-request intervals encode binary data.

```
100ms delay = bit 0
200ms delay = bit 1
300ms delay = separator/frame boundary
```

**Frame Structure:**
```
[heartbeat] - 100ms - [heartbeat] - 200ms - [heartbeat] - 300ms
                0                    1                  separator
```

**Bandwidth:** ~5 bits/second (stealth mode) to ~20 bits/second (burst mode)

---

## 4. WebSocket Binary Frame Padding

### Location: `/ws/updates`

**Structure:**
```
[0x00 0x01] - Heartbeat sequence (cover)
[padding]   - Random bytes (entropy mask)
[payload]   - Encrypted data (actual content)
```

**Masking:** XOR with WebSocket masking key + additional layer

---

## 5. JSON Field Encoding

### Location: `/api/v1/sync/preferences`

**Strategy:** Base64 data disguised as preference blob.

```json
{
  "theme": "dark",
  "notifications": true,
  "prefs_data": "eyJjb25maWciOnsibGFuZyI6InJ1In19...", // Covert payload
  "timestamp": 1705328400
}
```

---

## 6. Encryption Layer

**Algorithm:** AES-256-GCM + ChaCha20-Poly1305 (double envelope)

```
Plaintext
    ↓
ChaCha20-Poly1305 (outer layer, mobile/app key)
    ↓
AES-256-GCM (inner layer, server key)
    ↓
Base64/Raw bytes for steganography embedding
```

**Key Exchange:** ECDH P-256 via blind handshake in `/api/v1/config`

---

## 7. Payload Structure

### Encrypted Packet Format

```
[1 byte]  - Version (0x01)
[8 bytes] - Timestamp (millis since epoch, big-endian)
[2 bytes] - Payload length (big-endian)
[N bytes] - Encrypted payload (double envelope)
[16 bytes] - AES-GCM auth tag
```

### Payload Types

| Type | Code | Description |
|------|------|-------------|
| USER_REGISTER | 0x01 | New user registration |
| AD_IMPRESSION | 0x02 | Ad viewed |
| AD_CLICK | 0x03 | Ad clicked |
| CONVERSION | 0x04 | Purchase/conversion |
| SESSION_START | 0x05 | App opened |
| SESSION_END | 0x06 | App closed |
| HEARTBEAT | 0xFF | Keep-alive (no data) |

---

## 8. Detection Resistance

### Entropy Matching
- Encrypted data XORed with PRNG stream to match cover traffic entropy
- Statistical properties indistinguishable from random noise

### Traffic Shaping
- Requests follow natural user patterns
- Jitter added to timing (±15% variance)
- Request sizes match legitimate app behavior

### Plausible Deniability
- All endpoints serve legitimate dual purpose
- Decoy data returned when not authorized
- No single point of failure (5 independent channels)

---

## 9. Client Implementation Notes

### For Mobile App Builder

**Required SDK:**
- EXIF manipulation: `exif-interface` (Android), `ImageIO` (iOS)
- Timing: `System.nanoTime()` precision
- WebSocket: Native URLSessionWebSocketTask / OkHttp

**Battery Optimization:**
- Batch events (max 50 per batch)
- Sync only on charging + WiFi (configurable)
- Adaptive interval: 15s (active) → 5min (background)

---

## 10. Server Decoding Pipeline

```
Raw Request
    ↓
[Stego Extractor] → Extract hidden data from carrier
    ↓
[Decryptor] → AES-GCM + ChaCha20 decryption
    ↓
[Validator] → Timestamp freshness, signature check
    ↓
[Processor] → Route to blind admin interface
    ↓
[Storage] → Append to audit log (immutable)
```

---

**Document ID:** STEGO-SPEC-v1.0
**Author:** Security Engineer
**Delivered to:** Mobile App Builder, UI Designer
