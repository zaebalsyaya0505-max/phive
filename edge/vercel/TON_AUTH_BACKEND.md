# TON Auth Backend

This folder now contains a minimal TON authentication backend for the site.

The backend is intentionally stateless with respect to user accounts:

- no user profile database
- no wallet-to-account storage on the server
- wallet ownership is proven with `ton_proof`
- current wallet state is resolved live from TON Center
- subscription/entitlement is derived from on-chain rules, not a per-user server map

## Endpoints

- `GET /api/auth/ton/challenge`
  - Returns a signed `payload` string for `ton_proof`.
  - Optional query: `?domain=site.com` when API host and site host differ.
- `POST /api/auth/ton/verify`
  - Accepts TON Connect account data plus `ton_proof`.
  - Verifies:
    - allowed domain
    - signed challenge freshness
    - `state_init -> address` integrity
    - `get_public_key` match from TON Center
    - detached Ed25519 signature
  - Returns a signed session token, current wallet state, and sets `phantom_session` cookie.
- `GET /api/auth/session`
  - Reads `Authorization: Bearer <token>` or `phantom_session`.
  - Returns current wallet session, live wallet state, and entitlement.
- `DELETE /api/auth/session`
  - Clears `phantom_session`.
- `GET /api/subscription/status`
  - Returns live wallet state and entitlement for the authenticated wallet session.

All auth endpoints now answer CORS preflight `OPTIONS` requests for allowed site origins.

## Expected Verify Body

```json
{
  "address": "EQ...",
  "network": "-239",
  "public_key": "<hex-or-base64>",
  "proof": {
    "timestamp": 1710000000,
    "domain": {
      "lengthBytes": 11,
      "value": "example.com"
    },
    "payload": "<payload from /challenge>",
    "signature": "<base64 signature>",
    "state_init": "<base64 boc>"
  }
}
```

## Environment

- `TON_AUTH_SECRET`
  - Required in production. Used to sign challenge payloads.
- `TON_SESSION_SECRET`
  - Optional. Defaults to `TON_AUTH_SECRET`.
- `TON_AUTH_ALLOWED_DOMAINS`
  - Comma-separated host list, for example: `site.com,www.site.com,localhost:3000`
- `TONCENTER_API_KEY`
  - Optional. Increases TON Center rate limits.
- `TON_SUBSCRIPTION_RULES_JSON`
  - Optional on-chain entitlement rules. This is global config, not a user database.
  - Supported rule types:
    - `ton_balance`
    - `jetton_balance`
    - `nft_ownership`
  - Rules are evaluated in order; first match wins.

```json
[
  {
    "type": "ton_balance",
    "minBalanceTon": "1.5",
    "plan": "supporter",
    "label": "native-balance"
  },
  {
    "type": "jetton_balance",
    "jettonMaster": "EQC..............................................",
    "minAmount": "1",
    "plan": "premium",
    "label": "premium-jetton"
  },
  {
    "type": "nft_ownership",
    "collectionAddress": "EQD..............................................",
    "plan": "premium",
    "label": "premium-nft"
  }
]
```

## Site Flow

1. Call `GET /api/auth/ton/challenge` or `GET /api/auth/ton/challenge?domain=<site-host>`.
2. Pass returned `payload` into TON Connect `tonProof` request.
3. After wallet connect, send account + proof to `POST /api/auth/ton/verify`.
4. Store returned bearer token if you do not rely on cookie mode.
5. Call `GET /api/auth/session` to restore login state and fetch live wallet status from TON.

## Important Limitation

Replay protection is currently best-effort in-memory only. That is fine for local dev and a single warm instance, but a production multi-instance deployment still needs durable nonce storage if you want strict one-time proof usage.

## Notes

- If the site host differs from the API host, bearer-token mode is preferred over cookie-only mode.
- Wallet balance/status and on-chain entitlement are refreshed on every `session` / `subscription` read.
