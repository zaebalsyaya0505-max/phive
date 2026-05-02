const { readSession } = require("../../lib/phantom-auth");
const { METHOD_NOT_ALLOWED, allowMethods, clearSessionCookie, getRequestHost, handleCors, json, readBearerToken } = require("../../lib/http-utils");

module.exports = async function sessionHandler(req, res) {
  if (handleCors(req, res, ["GET", "DELETE", "OPTIONS"])) {
    return;
  }

  if (req.method === "DELETE") {
    const secureCookie = getRequestHost(req) && !String(getRequestHost(req)).includes("localhost");
    clearSessionCookie(res, secureCookie);
    json(res, 200, { ok: true });
    return;
  }

  if (req.method !== "GET") {
    allowMethods(res, ["GET", "DELETE", "OPTIONS"]);
    json(res, 405, METHOD_NOT_ALLOWED);
    return;
  }

  try {
    const current = await readSession(readBearerToken(req));
    json(res, 200, {
      ok: true,
      session: current.session,
      wallet: current.wallet,
      entitlement: current.entitlement,
    });
  } catch (error) {
    json(res, error.statusCode || 500, {
      ok: false,
      error: error.code || "session_invalid",
    });
  }
};
