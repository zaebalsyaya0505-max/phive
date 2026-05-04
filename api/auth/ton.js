/**
 * Auth TON Routes - Consolidated
 * Combines: auth/ton/challenge, auth/ton/verify
 * Routes:
 *   GET /api/auth/ton/challenge
 *   POST /api/auth/ton/verify
 */

const { issueTonChallenge, verifyTonProof } = require('../../../covert/lib/phantom-auth');
const { METHOD_NOT_ALLOWED, allowMethods, firstHeader, getRequestHost, handleCors, json, setSessionCookie } = require('../../../covert/lib/http-utils');

module.exports = async (req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  
  if (pathname.startsWith('/api/auth/ton/challenge')) {
    return challengeHandler(req, res);
  } else if (pathname.startsWith('/api/auth/ton/verify')) {
    return verifyHandler(req, res);
  }
  
  res.status(404).json({ error: 'not_found' });
};

// ============= CHALLENGE ENDPOINT =============

async function challengeHandler(req, res) {
  if (handleCors(req, res, ['GET', 'OPTIONS'])) {
    return;
  }

  if (req.method !== 'GET') {
    allowMethods(res, ['GET', 'OPTIONS']);
    json(res, 405, METHOD_NOT_ALLOWED);
    return;
  }

  try {
    const challenge = issueTonChallenge({
      requestHost: getRequestHost(req),
      requestedDomain: resolveRequestedDomain(req),
    });
    json(res, 200, challenge);
  } catch (error) {
    json(res, error.statusCode || 500, {
      error: error.code || 'challenge_failed',
    });
  }
}

function resolveRequestedDomain(req) {
  const rawDomain = req.query?.domain;
  if (typeof rawDomain === 'string' && rawDomain.trim()) {
    return rawDomain.trim();
  }

  const origin = firstHeader(req, 'origin');
  if (!origin) {
    return '';
  }

  try {
    return new URL(origin).host;
  } catch {
    return '';
  }
}

// ============= VERIFY ENDPOINT =============

async function verifyHandler(req, res) {
  if (handleCors(req, res, ['POST', 'OPTIONS'])) {
    return;
  }

  if (req.method !== 'POST') {
    allowMethods(res, ['POST', 'OPTIONS']);
    json(res, 405, METHOD_NOT_ALLOWED);
    return;
  }

  try {
    const result = await verifyTonProof(req.body, {
      requestHost: getRequestHost(req),
    });

    const secureCookie = getRequestHost(req) && !String(getRequestHost(req)).includes('localhost');
    const maxAgeSeconds = Math.max(0, result.session.exp - result.session.iat);
    setSessionCookie(res, result.token, maxAgeSeconds, secureCookie);

    json(res, 200, {
      ok: true,
      token: result.token,
      session: result.session,
      wallet: result.wallet,
      entitlement: result.entitlement,
    });
  } catch (error) {
    json(res, error.statusCode || 500, {
      ok: false,
      error: error.code || 'verification_failed',
    });
  }
}
