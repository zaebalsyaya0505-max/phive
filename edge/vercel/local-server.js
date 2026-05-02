const express = require('express');
const fetch = require('node-fetch');
const { issueTonChallenge, readSession, verifyTonProof } = require('./lib/phantom-auth');
const { applyCors, getRequestHost, readBearerToken, setSessionCookie, clearSessionCookie } = require('./lib/http-utils');
const bypassStatusRouter = require('./api/bypass-status');

const app = express();
const PORT = 3000;

const TARGET_HEADER = "x-phantom-target";
const METHOD_HEADER = "x-phantom-method";
const EDGE_AUTH_HEADER = "x-phantom-edge-key";
const ALLOWED_HOSTS = new Set([
  "spclient.spotify.com",
  "clienttoken.spotify.com",
  "api-partner.spotify.com",
  "music.youtube.com",
  "api.music.yandex.net",
  "music.yandex.net",
  "music.yandex.ru",
  "api-v2.soundcloud.com",
  "soundcloud.com",
]);

// Serve static files from public directory
app.use(express.static('public'));

app.use('/api/bypass-status', bypassStatusRouter);
app.use('/api/auth', express.json({ limit: '1mb' }));
app.use('/api/subscription', express.json({ limit: '1mb' }));
app.use(['/api/auth', '/api/subscription'], (req, res, next) => {
  const methods = req.path === '/session'
    ? ['GET', 'DELETE', 'OPTIONS']
    : req.path === '/ton/verify'
      ? ['POST', 'OPTIONS']
      : ['GET', 'OPTIONS'];
  applyCors(req, res, methods);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.get('/api/auth/ton/challenge', (req, res) => {
  try {
    const challenge = issueTonChallenge({
      requestHost: getRequestHost(req),
      requestedDomain: typeof req.query?.domain === 'string' ? req.query.domain : '',
    });
    res.json(challenge);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.code || 'challenge_failed' });
  }
});

app.post('/api/auth/ton/verify', async (req, res) => {
  try {
    const result = await verifyTonProof(req.body, { requestHost: getRequestHost(req) });
    const secureCookie = getRequestHost(req) && !String(getRequestHost(req)).includes('localhost');
    const maxAgeSeconds = Math.max(0, result.session.exp - result.session.iat);
    setSessionCookie(res, result.token, maxAgeSeconds, secureCookie);
    res.json({
      ok: true,
      token: result.token,
      session: result.session,
      wallet: result.wallet,
      entitlement: result.entitlement,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, error: error.code || 'verification_failed' });
  }
});

app.get('/api/auth/session', (req, res) => {
  Promise.resolve(readSession(readBearerToken(req)))
    .then((session) => {
    res.json({
      ok: true,
      session: session.session,
      wallet: session.wallet,
      entitlement: session.entitlement,
    });
    })
    .catch((error) => {
    res.status(error.statusCode || 500).json({ ok: false, error: error.code || 'session_invalid' });
    });
});

app.delete('/api/auth/session', (req, res) => {
  const secureCookie = getRequestHost(req) && !String(getRequestHost(req)).includes('localhost');
  clearSessionCookie(res, secureCookie);
  res.json({ ok: true });
});

app.get('/api/subscription/status', (req, res) => {
  Promise.resolve(readSession(readBearerToken(req)))
    .then((session) => {
    res.json({
      ok: true,
      address: session.session.address,
      wallet: session.wallet,
      entitlement: session.entitlement,
    });
    })
    .catch((error) => {
    res.status(error.statusCode || 500).json({ ok: false, error: error.code || 'subscription_status_failed' });
    });
});

app.post('/api/phantom-gateway', express.raw({ type: '*/*' }), async (req, res) => {
  console.log('📡 Phantom Gateway request received');

  // Check auth (simplified)
  const authHeader = req.headers[EDGE_AUTH_HEADER.toLowerCase()];
  if (authHeader !== 'test-key-123') {
    console.log('❌ Auth failed');
    return res.status(401).json({ error: "unauthorized" });
  }

  const target = req.headers[TARGET_HEADER.toLowerCase()];
  const upstreamMethod = (req.headers[METHOD_HEADER.toLowerCase()] || "GET").toUpperCase();

  if (!target) {
    console.log('❌ Missing target');
    return res.status(400).json({ error: "missing_target" });
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    console.log('❌ Invalid target URL');
    return res.status(400).json({ error: "invalid_target" });
  }

  if (targetUrl.protocol !== "https:" || !ALLOWED_HOSTS.has(targetUrl.host)) {
    console.log('❌ Target not allowed:', targetUrl.host);
    return res.status(403).json({ error: "target_not_allowed" });
  }

  console.log(`🔄 Proxying ${upstreamMethod} to ${target}`);

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: upstreamMethod,
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Phantom/1.0',
        'Accept': req.headers['accept'] || '*/*',
        'Accept-Encoding': 'gzip, deflate',
        ...Object.fromEntries(
          Object.entries(req.headers)
            .filter(([key]) => key.startsWith('x-') || key === 'authorization')
        )
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      redirect: "manual",
    });

    const responseBuffer = Buffer.from(await upstreamResponse.arrayBuffer());

    // Copy headers
    upstreamResponse.headers.forEach((value, key) => {
      if (!['transfer-encoding', 'connection', 'keep-alive', 'proxy-authenticate'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.setHeader("x-phantom-status", "relayed");
    res.setHeader("x-phantom-upstream-code", String(upstreamResponse.status));

    console.log(`✅ Relayed with status ${upstreamResponse.status}`);
    res.status(upstreamResponse.status).send(responseBuffer);

  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    res.status(500).json({ error: "proxy_error", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Phantom Gateway server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoint: POST http://localhost:${PORT}/api/phantom-gateway`);
  console.log(`🔐 TON challenge: GET http://localhost:${PORT}/api/auth/ton/challenge`);
  console.log(`🔐 TON verify: POST http://localhost:${PORT}/api/auth/ton/verify`);
  console.log(`🔑 Test auth key: test-key-123`);
});
