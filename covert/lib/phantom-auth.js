const crypto = require("crypto");
const fetch = global.fetch || require("node-fetch");
const { Address, Cell, contractAddress, loadStateInit } = require("@ton/ton");
const nacl = require("tweetnacl");

const TON_PROOF_PREFIX = "ton-proof-item-v2/";
const TON_CONNECT_PREFIX = "ton-connect";
const MAINNET_CHAIN = "-239";
const TESTNET_CHAIN = "-3";
const TONCENTER_V3_MAINNET = "https://toncenter.com/api/v3";
const TONCENTER_V3_TESTNET = "https://testnet.toncenter.com/api/v3";
const DEFAULT_CHALLENGE_TTL_SECONDS = 15 * 60;
const DEFAULT_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const DEFAULT_PROOF_SKEW_SECONDS = 15 * 60;
const usedProofCache = new Map();

function issueTonChallenge({ requestHost, requestedDomain }) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const ttlSeconds = getNumberEnv("TON_AUTH_CHALLENGE_TTL_SECONDS", DEFAULT_CHALLENGE_TTL_SECONDS);
  const challengeDomain = resolveChallengeDomain(requestHost, requestedDomain);
  const challenge = {
    nonce: base64url(crypto.randomBytes(24)),
    aud: challengeDomain,
    iat: nowSeconds,
    exp: nowSeconds + ttlSeconds,
  };

  const token = signStructuredToken(challenge, getAuthSecret());
  return {
    payload: token,
    expiresAt: challenge.exp,
    ttlSeconds,
    domain: challenge.aud,
  };
}

async function verifyTonProof(input, { requestHost }) {
  cleanupUsedProofs();

  const addressText = requireString(input.address, "address");
  const network = normalizeNetwork(input.network);
  const publicKey = normalizePublicKey(input.public_key ?? input.publicKey);
  const proof = normalizeProof(input.proof);
  let parsedAddress;
  try {
    parsedAddress = Address.parse(addressText);
  } catch {
    throw badRequest("invalid_address");
  }
  const rawAddress = parsedAddress.toRawString();
  const expectedDomain = normalizeDomain(proof.domain.value);

  if (!isAllowedDomain(expectedDomain, requestHost)) {
    throw badRequest("domain_not_allowed");
  }
  if (proof.domain.lengthBytes !== Buffer.byteLength(expectedDomain, "utf8")) {
    throw badRequest("invalid_domain_length");
  }

  const challenge = verifyStructuredToken(proof.payload, getAuthSecret());
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (challenge.exp < nowSeconds) {
    throw badRequest("challenge_expired");
  }
  if (normalizeDomain(challenge.aud) !== expectedDomain) {
    throw badRequest("domain_mismatch");
  }

  const proofSkewSeconds = getNumberEnv("TON_AUTH_PROOF_SKEW_SECONDS", DEFAULT_PROOF_SKEW_SECONDS);
  if (Math.abs(nowSeconds - proof.timestamp) > proofSkewSeconds) {
    throw badRequest("proof_expired");
  }

  let stateInit;
  try {
    stateInit = loadStateInit(Cell.fromBase64(proof.stateInit).beginParse());
  } catch {
    throw badRequest("invalid_state_init");
  }
  const derivedAddress = contractAddress(parsedAddress.workChain, stateInit).toRawString();
  if (derivedAddress !== rawAddress) {
    throw badRequest("state_init_address_mismatch");
  }

  const onChainPublicKey = await getWalletPublicKey(rawAddress, network);
  if (onChainPublicKey && !buffersEqual(onChainPublicKey, publicKey)) {
    throw badRequest("public_key_mismatch");
  }

  const replayKey = createReplayKey(rawAddress, proof);
  if (usedProofCache.has(replayKey)) {
    throw badRequest("proof_already_used");
  }

  const signatureOk = verifyDetachedTonProof({
    address: parsedAddress,
    domain: expectedDomain,
    payload: proof.payload,
    publicKey,
    signature: proof.signature,
    timestamp: proof.timestamp,
  });

  if (!signatureOk) {
    throw badRequest("invalid_signature");
  }

  usedProofCache.set(replayKey, proof.timestamp + proofSkewSeconds);

  const walletContext = await resolveWalletContext(rawAddress, network);
  const session = createSession({
    address: rawAddress,
    network,
    publicKey: bufferToHex(publicKey),
    domain: expectedDomain,
  });

  return {
    token: session.token,
    session: {
      ...session.payload,
      wallet: walletContext.wallet,
      entitlement: walletContext.entitlement,
    },
    wallet: walletContext.wallet,
    entitlement: walletContext.entitlement,
  };
}

async function readSession(token) {
  if (!token) {
    throw unauthorized("missing_session");
  }
  const payload = verifyStructuredToken(token, getSessionSecret());
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp < nowSeconds) {
    throw unauthorized("session_expired");
  }

  const walletContext = await resolveWalletContext(payload.address, payload.network);
  return {
    token,
    session: {
      ...payload,
      wallet: walletContext.wallet,
      entitlement: walletContext.entitlement,
    },
    wallet: walletContext.wallet,
    entitlement: walletContext.entitlement,
  };
}

function createSession({ address, network, publicKey, domain }) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const ttlSeconds = getNumberEnv("TON_AUTH_SESSION_TTL_SECONDS", DEFAULT_SESSION_TTL_SECONDS);
  const payload = {
    iss: "phantom-ton-auth",
    sub: address,
    address,
    network,
    publicKey,
    domain,
    iat: nowSeconds,
    exp: nowSeconds + ttlSeconds,
  };

  return {
    token: signStructuredToken(payload, getSessionSecret()),
    payload,
    ttlSeconds,
  };
}

async function resolveWalletContext(address, network) {
  const wallet = await getWalletState(address, network);
  const entitlement = await resolveEntitlement(address, network, wallet);
  return {
    wallet,
    entitlement,
  };
}

async function resolveEntitlement(address, network, wallet) {
  const rules = getSubscriptionRules();
  if (rules.error) {
    return {
      active: false,
      plan: "free",
      source: "invalid_rules_json",
      expiresAt: null,
      rule: null,
    };
  }

  if (rules.items.length === 0) {
    return {
      active: false,
      plan: "free",
      source: wallet.available ? "toncenter_no_rules" : "wallet_state_unavailable",
      expiresAt: null,
      rule: null,
    };
  }

  for (const rule of rules.items) {
    const evaluation = await evaluateSubscriptionRule(rule, address, network, wallet);
    if (evaluation.matched) {
      return {
        active: true,
        plan: evaluation.plan,
        source: "toncenter_rule",
        expiresAt: null,
        rule: {
          type: evaluation.type,
          label: evaluation.label,
          evidence: evaluation.evidence,
        },
      };
    }
  }

  return {
    active: false,
    plan: "free",
    source: wallet.available ? "toncenter_no_match" : "wallet_state_unavailable",
    expiresAt: null,
    rule: null,
  };
}

async function getWalletPublicKey(address, network) {
  const endpoint = network === TESTNET_CHAIN
    ? "https://testnet.toncenter.com/api/v3/runGetMethod"
    : "https://toncenter.com/api/v3/runGetMethod";
  const headers = {
    "content-type": "application/json",
  };
  const apiKey = process.env.TONCENTER_API_KEY?.trim();
  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      address,
      method: "get_public_key",
      stack: [],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const body = await response.json();
  const stack = Array.isArray(body.stack)
    ? body.stack
    : Array.isArray(body.result?.stack)
      ? body.result.stack
      : [];
  const first = stack[0];
  if (!first) {
    return null;
  }

  const rawValue = typeof first.value === "string"
    ? first.value
    : Array.isArray(first) && first.length > 1
      ? first[1]
      : null;
  if (rawValue == null) {
    return null;
  }

  const numeric = String(rawValue).trim();
  let bigintValue;
  try {
    bigintValue = numeric.startsWith("0x")
      ? BigInt(numeric)
      : BigInt(numeric);
  } catch {
    return null;
  }

  return bigIntTo32Buffer(bigintValue);
}

async function getWalletState(address, network) {
  const normalizedAddress = Address.parse(address).toRawString();

  try {
    const walletResponse = await fetchToncenterJson("/walletStates", network, {
      address: normalizedAddress,
    });
    const walletState = Array.isArray(walletResponse.wallets) ? walletResponse.wallets[0] : null;
    if (walletState) {
      return normalizeWalletState(walletState, normalizedAddress, network);
    }
  } catch {
    // fall through to account state fallback
  }

  try {
    const accountResponse = await fetchToncenterJson("/accountStates", network, {
      address: normalizedAddress,
      include_boc: "false",
    });
    const accountState = Array.isArray(accountResponse.accounts) ? accountResponse.accounts[0] : null;
    if (accountState) {
      return normalizeWalletState(accountState, normalizedAddress, network);
    }
  } catch (error) {
    return unavailableWalletState(normalizedAddress, network, error.code || "wallet_state_unavailable");
  }

  return unavailableWalletState(normalizedAddress, network, "wallet_not_found");
}

function normalizeWalletState(input, fallbackAddress, network) {
  const balanceNano = normalizeIntegerString(input.balance ?? "0");
  const lastTransactionLt = input.last_transaction_lt == null ? null : String(input.last_transaction_lt);
  const lastTransactionHash = input.last_transaction_hash == null ? null : String(input.last_transaction_hash);
  const seqno = Number.isFinite(Number(input.seqno)) ? Number(input.seqno) : null;

  return {
    available: true,
    source: "toncenter",
    address: normalizeTonAddress(input.address ?? fallbackAddress) || fallbackAddress,
    network,
    balanceNano,
    balanceTon: formatTonAmount(balanceNano),
    status: String(input.status ?? "unknown"),
    walletType: input.wallet_type ? String(input.wallet_type) : null,
    isWallet: typeof input.is_wallet === "boolean" ? input.is_wallet : null,
    isSignatureAllowed: typeof input.is_signature_allowed === "boolean" ? input.is_signature_allowed : null,
    seqno,
    lastTransactionLt,
    lastTransactionHash,
  };
}

function unavailableWalletState(address, network, reason) {
  return {
    available: false,
    source: "toncenter",
    address,
    network,
    balanceNano: "0",
    balanceTon: "0",
    status: "unknown",
    walletType: null,
    isWallet: null,
    isSignatureAllowed: null,
    seqno: null,
    lastTransactionLt: null,
    lastTransactionHash: null,
    error: reason,
  };
}

function getSubscriptionRules() {
  const source = process.env.TON_SUBSCRIPTION_RULES_JSON?.trim();
  if (!source) {
    return {
      items: [],
      error: null,
    };
  }

  try {
    const parsed = JSON.parse(source);
    return {
      items: Array.isArray(parsed) ? parsed : [],
      error: null,
    };
  } catch {
    return {
      items: [],
      error: "invalid_rules_json",
    };
  }
}

async function evaluateSubscriptionRule(rule, address, network, wallet) {
  const type = normalizeRuleType(rule?.type);
  const plan = normalizePlan(rule?.plan);
  const label = normalizeOptionalString(rule?.label);

  if (type === "ton_balance") {
    const requiredBalance = parseRequiredTonBalance(rule);
    const actualBalance = parseBigIntOrZero(wallet.balanceNano);
    return {
      matched: wallet.available && actualBalance >= requiredBalance,
      plan,
      type,
      label,
      evidence: {
        balanceNano: actualBalance.toString(),
        requiredBalanceNano: requiredBalance.toString(),
      },
    };
  }

  if (type === "jetton_balance") {
    const jettonMaster = normalizeTonAddress(
      rule?.jettonMaster
      ?? rule?.jetton_master
      ?? rule?.jettonAddress
      ?? rule?.jetton_address
      ?? "",
    );
    const requiredAmount = parseBigIntOrZero(rule?.minAmount ?? rule?.min_amount ?? "1");
    const jettonState = await getJettonWalletState(address, network, jettonMaster);
    return {
      matched: jettonState.available && parseBigIntOrZero(jettonState.balance) >= requiredAmount,
      plan,
      type,
      label,
      evidence: {
        jettonMaster,
        jettonWallet: jettonState.walletAddress,
        balance: jettonState.balance,
        requiredAmount: requiredAmount.toString(),
      },
    };
  }

  if (type === "nft_ownership") {
    const collectionAddress = normalizeTonAddress(
      rule?.collection
      ?? rule?.collectionAddress
      ?? rule?.collection_address
      ?? "",
    );
    const ownership = await getNftOwnershipState(address, network, collectionAddress);
    return {
      matched: ownership.available && ownership.itemCount > 0,
      plan,
      type,
      label,
      evidence: {
        collectionAddress,
        itemCount: ownership.itemCount,
        sampleItemAddress: ownership.sampleItemAddress,
      },
    };
  }

  return {
    matched: false,
    plan,
    type: "unsupported",
    label,
    evidence: {
      reason: "unsupported_rule_type",
    },
  };
}

async function getJettonWalletState(address, network, jettonMaster) {
  if (!jettonMaster) {
    return {
      available: false,
      balance: "0",
      walletAddress: null,
    };
  }

  try {
    const response = await fetchToncenterJson("/jetton/wallets", network, {
      owner_address: normalizeTonAddress(address),
      jetton_address: jettonMaster,
      exclude_zero_balance: "false",
      limit: "1",
    });
    const wallet = Array.isArray(response.jetton_wallets) ? response.jetton_wallets[0] : null;
    return {
      available: !!wallet,
      balance: wallet ? normalizeIntegerString(wallet.balance ?? "0") : "0",
      walletAddress: wallet?.address ? normalizeTonAddress(wallet.address) : null,
    };
  } catch {
    return {
      available: false,
      balance: "0",
      walletAddress: null,
    };
  }
}

async function getNftOwnershipState(address, network, collectionAddress) {
  if (!collectionAddress) {
    return {
      available: false,
      itemCount: 0,
      sampleItemAddress: null,
    };
  }

  try {
    const response = await fetchToncenterJson("/nft/items", network, {
      owner_address: normalizeTonAddress(address),
      collection_address: collectionAddress,
      include_on_sale: "true",
      limit: "1",
    });
    const items = Array.isArray(response.nft_items) ? response.nft_items : [];
    return {
      available: true,
      itemCount: items.length,
      sampleItemAddress: items[0]?.address ? normalizeTonAddress(items[0].address) : null,
    };
  } catch {
    return {
      available: false,
      itemCount: 0,
      sampleItemAddress: null,
    };
  }
}

async function fetchToncenterJson(path, network, query) {
  const url = new URL(`${getToncenterApiBase(network)}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item));
      }
      continue;
    }
    url.searchParams.append(key, String(value));
  }

  const headers = {};
  const apiKey = process.env.TONCENTER_API_KEY?.trim();
  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    throw badGateway(`toncenter_http_${response.status}`);
  }

  return response.json();
}

function getToncenterApiBase(network) {
  return network === TESTNET_CHAIN ? TONCENTER_V3_TESTNET : TONCENTER_V3_MAINNET;
}

function verifyDetachedTonProof({ address, domain, payload, publicKey, signature, timestamp }) {
  const workchainBuffer = Buffer.alloc(4);
  workchainBuffer.writeInt32BE(address.workChain, 0);

  const domainBuffer = Buffer.from(domain, "utf8");
  const domainLengthBuffer = Buffer.alloc(4);
  domainLengthBuffer.writeUInt32LE(domainBuffer.length, 0);

  const timestampBuffer = Buffer.alloc(8);
  timestampBuffer.writeBigUInt64LE(BigInt(timestamp), 0);

  const message = Buffer.concat([
    Buffer.from(TON_PROOF_PREFIX, "utf8"),
    workchainBuffer,
    Buffer.from(address.hash),
    domainLengthBuffer,
    domainBuffer,
    timestampBuffer,
    Buffer.from(payload, "utf8"),
  ]);

  const messageHash = crypto.createHash("sha256").update(message).digest();
  const fullMessage = Buffer.concat([
    Buffer.from([0xff, 0xff]),
    Buffer.from(TON_CONNECT_PREFIX, "utf8"),
    messageHash,
  ]);
  const resultHash = crypto.createHash("sha256").update(fullMessage).digest();

  return nacl.sign.detached.verify(
    new Uint8Array(resultHash),
    new Uint8Array(signature),
    new Uint8Array(publicKey),
  );
}

function normalizeProof(input) {
  if (!input || typeof input !== "object") {
    throw badRequest("missing_proof");
  }

  const domain = input.domain;
  if (!domain || typeof domain !== "object") {
    throw badRequest("missing_domain");
  }

  return {
    timestamp: Number(requireStringOrNumber(input.timestamp, "proof.timestamp")),
    domain: {
      lengthBytes: Number(requireStringOrNumber(domain.lengthBytes ?? domain.length_bytes, "proof.domain.lengthBytes")),
      value: requireString(domain.value, "proof.domain.value"),
    },
    payload: requireString(input.payload, "proof.payload"),
    signature: normalizeSignature(input.signature),
    stateInit: requireString(input.state_init ?? input.stateInit, "proof.state_init"),
  };
}

function normalizePublicKey(value) {
  if (!value) {
    throw badRequest("missing_public_key");
  }
  const raw = String(value).trim();
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  const decoded = decodeMaybeBase64(raw);
  if (decoded.length !== 32) {
    throw badRequest("invalid_public_key");
  }
  return decoded;
}

function normalizeSignature(value) {
  const decoded = decodeMaybeBase64(requireString(value, "proof.signature"));
  if (decoded.length !== 64) {
    throw badRequest("invalid_signature_length");
  }
  return decoded;
}

function normalizeNetwork(value) {
  const raw = String(value ?? MAINNET_CHAIN).trim().toLowerCase();
  if (raw === MAINNET_CHAIN || raw === "mainnet") {
    return MAINNET_CHAIN;
  }
  if (raw === TESTNET_CHAIN || raw === "testnet") {
    return TESTNET_CHAIN;
  }
  throw badRequest("unsupported_network");
}

function signStructuredToken(payload, secret) {
  const encodedPayload = base64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const signature = signValue(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

function verifyStructuredToken(token, secret) {
  const [encodedPayload, signature] = String(token ?? "").split(".");
  if (!encodedPayload || !signature) {
    throw unauthorized("invalid_token");
  }

  const expected = signValue(encodedPayload, secret);
  if (!timingSafeEqual(signature, expected)) {
    throw unauthorized("invalid_token_signature");
  }

  let payload;
  try {
    payload = JSON.parse(base64urlDecode(encodedPayload).toString("utf8"));
  } catch {
    throw unauthorized("invalid_token_payload");
  }

  return payload;
}

function signValue(value, secret) {
  return base64url(crypto.createHmac("sha256", secret).update(value).digest());
}

function createReplayKey(address, proof) {
  return crypto
    .createHash("sha256")
    .update(address)
    .update(proof.payload)
    .update(proof.signature)
    .digest("hex");
}

function cleanupUsedProofs() {
  const nowSeconds = Math.floor(Date.now() / 1000);
  for (const [key, expiresAt] of usedProofCache.entries()) {
    if (expiresAt <= nowSeconds) {
      usedProofCache.delete(key);
    }
  }
}

function resolveChallengeDomain(requestHost, requestedDomain) {
  const configured = resolveAllowedDomains(requestHost);
  if (configured.length === 0) {
    throw badRequest("missing_allowed_domain");
  }
  const normalizedRequested = normalizeDomain(requestedDomain);
  if (normalizedRequested && configured.includes(normalizedRequested)) {
    return normalizedRequested;
  }
  const normalizedRequestHost = normalizeDomain(requestHost);
  if (normalizedRequestHost && configured.includes(normalizedRequestHost)) {
    return normalizedRequestHost;
  }
  return configured[0];
}

function resolveAllowedDomains(requestHost) {
  const configured = process.env.TON_AUTH_ALLOWED_DOMAINS
    ?.split(",")
    .map((item) => normalizeDomain(item))
    .filter(Boolean);

  if (configured && configured.length > 0) {
    return configured;
  }

  const normalizedRequestHost = normalizeDomain(requestHost);
  return normalizedRequestHost ? [normalizedRequestHost] : [];
}

function isAllowedDomain(domain, requestHost) {
  return resolveAllowedDomains(requestHost).includes(normalizeDomain(domain));
}

function normalizeDomain(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getAuthSecret() {
  return process.env.TON_AUTH_SECRET?.trim() || "dev-ton-auth-secret-change-me";
}

function getSessionSecret() {
  return process.env.TON_SESSION_SECRET?.trim() || getAuthSecret();
}

function normalizeRuleType(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "ton_balance" || normalized === "native_balance") {
    return "ton_balance";
  }
  if (normalized === "jetton_balance" || normalized === "jetton") {
    return "jetton_balance";
  }
  if (normalized === "nft_ownership" || normalized === "nft") {
    return "nft_ownership";
  }
  return "unsupported";
}

function normalizePlan(value) {
  const normalized = String(value ?? "").trim();
  return normalized || "premium";
}

function normalizeOptionalString(value) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function normalizeTonAddress(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "";
  }
  try {
    return Address.parse(normalized).toRawString();
  } catch {
    return normalized;
  }
}

function normalizeIntegerString(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "0";
  }
  try {
    return BigInt(normalized).toString();
  } catch {
    return "0";
  }
}

function parseRequiredTonBalance(rule) {
  const minBalanceNano = normalizeOptionalString(rule?.minBalanceNano ?? rule?.min_balance_nano);
  if (minBalanceNano) {
    return parseBigIntOrZero(minBalanceNano);
  }
  const minBalanceTon = normalizeOptionalString(rule?.minBalanceTon ?? rule?.min_balance_ton);
  if (minBalanceTon) {
    return parseTonAmountToNano(minBalanceTon);
  }
  return 0n;
}

function parseBigIntOrZero(value) {
  try {
    return BigInt(String(value ?? "0").trim() || "0");
  } catch {
    return 0n;
  }
}

function parseTonAmountToNano(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return 0n;
  }

  const sign = normalized.startsWith("-") ? -1n : 1n;
  const unsigned = normalized.replace(/^[+-]/, "");
  const [wholePartRaw, fractionPartRaw = ""] = unsigned.split(".", 2);
  const wholePart = wholePartRaw || "0";
  const fractionDigits = fractionPartRaw.replace(/[^0-9]/g, "").slice(0, 9).padEnd(9, "0");
  const nanos = (BigInt(wholePart) * 1000000000n) + BigInt(fractionDigits || "0");
  return nanos * sign;
}

function formatTonAmount(value) {
  const amount = parseBigIntOrZero(value);
  const sign = amount < 0n ? "-" : "";
  const normalized = amount < 0n ? -amount : amount;
  const whole = normalized / 1000000000n;
  const fraction = (normalized % 1000000000n).toString().padStart(9, "0").replace(/0+$/, "");
  return fraction ? `${sign}${whole}.${fraction}` : `${sign}${whole}`;
}

function getNumberEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function base64url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64urlDecode(value) {
  const normalized = String(value)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64");
}

function decodeMaybeBase64(value) {
  const normalized = String(value).trim();
  try {
    const decoded = base64urlDecode(normalized);
    if (decoded.length > 0) {
      return decoded;
    }
  } catch {
    // no-op
  }
  try {
    return Buffer.from(normalized, "base64");
  } catch {
    throw badRequest("invalid_base64");
  }
}

function bigIntTo32Buffer(value) {
  const hex = value.toString(16).padStart(64, "0");
  return Buffer.from(hex, "hex");
}

function bufferToHex(value) {
  return Buffer.from(value).toString("hex");
}

function buffersEqual(a, b) {
  return Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;
}

function timingSafeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function requireString(value, field) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    throw badRequest(`missing_${field.replace(/[.]/g, "_")}`);
  }
  return normalized;
}

function requireStringOrNumber(value, field) {
  if (value === undefined || value === null || value === "") {
    throw badRequest(`missing_${field.replace(/[.]/g, "_")}`);
  }
  return value;
}

function badRequest(code) {
  return Object.assign(new Error(code), { statusCode: 400, code });
}

function unauthorized(code) {
  return Object.assign(new Error(code), { statusCode: 401, code });
}

function badGateway(code) {
  return Object.assign(new Error(code), { statusCode: 502, code });
}

module.exports = {
  createSession,
  issueTonChallenge,
  readSession,
  verifyTonProof,
};
