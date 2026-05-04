# Covert Key Exchange Protocol
## Zero-Knowledge Blind Handshake

---

## Design Principles

1. **No explicit key exchange endpoint** - Keys derived from legitimate traffic patterns
2. **Plausible deniability** - Handshake appears as normal app behavior
3. **Forward secrecy** - Per-session ephemeral keys
4. **No identifiable metadata** - Keys never transmitted in raw form

---

## ECDH P-256 Key Agreement

### Phase 1: Implicit Initiation

**Trigger:** App fetches `/api/v1/config` (legitimate config request)

**Client Actions:**
1. Generate ephemeral EC keypair (P-256)
2. Derive public key bytes (uncompressed point: 0x04 + X + Y)
3. Hide public key in `X-Request-ID` header (steganography encoding)

**Server Response:**
- Server extracts client public key from request headers
- Generates server ephemeral keypair
- Computes shared secret: `ECDH(server_private, client_public)`
- Hides server public key in response `ETag` header
- Returns encrypted config with session keys

### Phase 2: Shared Secret Derivation

```python
# Client-side derivation
client_private = generate_ecdh_keypair()
server_public = extract_from_etag(response.headers['ETag'])
shared_secret = ecdh_compute(client_private, server_public)

# Key expansion via HKDF-SHA256
encryption_key = hkdf(shared_secret, salt='covert-v1', info='encryption')
auth_key = hkdf(shared_secret, salt='covert-v1', info='authentication')
nonce_seed = hkdf(shared_secret, salt='covert-v1', info='nonces')
```

### Phase 3: Session Key Rotation

**Rotation Triggers:**
- Every 100 messages
- Every 24 hours
- On network change (WiFi ↔ Mobile)
- On app background/foreground transition

**Rotation Method:**
```
new_key = HKDF(old_key, salt=current_timestamp, info='rotation')
```

---

## Double Envelope Encryption

### Outer Layer: ChaCha20-Poly1305 (Client Key)

**Purpose:** Protect data from server compromise

```
key = client_derived_secret (32 bytes)
nonce = 12-byte random (from nonce_seed stream)
plaintext = original payload

Ciphertext = ChaCha20-Poly1305(key, nonce, plaintext)
Output: nonce (12) + ciphertext + tag (16)
```

### Inner Layer: AES-256-GCM (Server Key)

**Purpose:** Server-side verification and processing

```
key = server_master_key (stored in env, rotated monthly)
nonce = 12-byte counter (monotonic, per-session)
plaintext = ChaCha20 output from outer layer

Ciphertext = AES-256-GCM(key, nonce, plaintext)
Output: version (1) + timestamp (8) + length (2) + ciphertext + tag (16)
```

---

## Header Encoding Scheme

### X-Request-ID Encoding

**Format:** `XXXXXXXX-XXXX-4XXX-8XXX-XXXXXXXXXXXX` (UUIDv4 mask)

**Payload embedding:**
- Bits 0-47: Random (maintain UUID entropy)
- Bits 48-63: Client public key fragment (8 bytes encoded in variant/version)
- Remaining: Additional key data in timestamp fields

**Example:**
```
Request 1: 550e8400-e29b-41d4-a716-446655440000 (first 8 bytes of pubkey)
Request 2: 6ba7b810-9dad-11d1-80b4-00c04fd430c8 (next 8 bytes)
Request 3: ... (completes 32-byte uncompressed key)
```

### ETag Response Encoding

**Format:** `"<hex_encoded>"` (standard ETag format)

**Payload:**
- Server public key (64 bytes uncompressed → 128 hex chars)
- Session ID (8 bytes → 16 hex chars)
- Checksum (4 bytes → 8 hex chars)

**Example:**
```
ETag: "04a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890a1b2c3d4"
       │└──────────────────────────────────────────────────────────────────────────────┘│
       │                                    Server public key                              │
       └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Storage (Client-Side)

### Android (Keystore)

```kotlin
val keyStore = KeyStore.getInstance("AndroidKeyStore")
keyStore.load(null)

// Ephemeral keys stored in memory only
// Long-term keys in hardware-backed keystore
val keyGen = KeyPairGenerator.getInstance("EC", "AndroidKeyStore")
val spec = KeyGenParameterSpec.Builder(
    "covert_ephemeral",
    KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
)
    .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
    .setUserAuthenticationRequired(false)
    .setRandomizedEncryptionRequired(true)
    .build()
keyGen.initialize(spec)
```

### iOS (Secure Enclave)

```swift
let attributes: [String: Any] = [
    kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
    kSecAttrKeySizeInBits as String: 256,
    kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
    kSecPrivateKeyAttrs as String: [
        kSecAttrIsPermanent as String: false, // Ephemeral
        kSecAttrApplicationTag as String: "covert.session"
    ]
]
```

---

## Server Key Management

### Environment Variables

```bash
# Server master key (AES-256, hex-encoded)
COVERT_MASTER_KEY=abcdef1234567890...

# Previous key (for rotation window)
COVERT_MASTER_KEY_PREV=previous123456...

# Key rotation timestamp
COVERT_KEY_ROTATION_AT=1705328400
```

### Key Rotation Protocol

1. Generate new master key
2. Update `COVERT_MASTER_KEY_PREV` with current key
3. Update `COVERT_MASTER_KEY` with new key
4. Set `COVERT_KEY_ROTATION_AT` to now + 24h
5. Both keys accepted for 48h overlap period

---

## Security Properties

| Property | Implementation |
|----------|----------------|
| Forward Secrecy | Per-session ephemeral ECDH keys |
| Post-compromise | 24h key rotation |
| Metadata protection | All keys hidden in legitimate headers |
| Deniability | Traffic indistinguishable from normal app usage |
| Replay resistance | Timestamp + nonce uniqueness check |

---

## Verification Checklist

- [ ] No raw key material in URL parameters
- [ ] All public keys encoded via steganography
- [ ] Private keys never leave secure hardware (mobile)
- [ ] Server accepts multiple key versions during rotation
- [ ] Shared secret derived via standard ECDH (no custom crypto)

---

**Document ID:** KEY-EX-v1.0
**Classification:** Security Engineer Deliverable → Mobile App Builder
