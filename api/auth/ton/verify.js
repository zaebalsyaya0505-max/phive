const { verifyTonProof } = require("../../../lib/phantom-auth");
const { METHOD_NOT_ALLOWED, allowMethods, getRequestHost, handleCors, json, setSessionCookie } = require("../../../lib/http-utils");

module.exports = async function verifyHandler(req, res) {
  if (handleCors(req, res, ["POST", "OPTIONS"])) {
    return;
  }

  if (req.method !== "POST") {
    allowMethods(res, ["POST", "OPTIONS"]);
    json(res, 405, METHOD_NOT_ALLOWED);
    return;
  }

  try {
    const result = await verifyTonProof(req.body, {
      requestHost: getRequestHost(req),
    });

    const secureCookie = getRequestHost(req) && !String(getRequestHost(req)).includes("localhost");
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
      error: error.code || "verification_failed",
    });
  }
};
