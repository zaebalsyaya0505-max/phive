const { issueTonChallenge } = require("../../../lib/phantom-auth");
const { METHOD_NOT_ALLOWED, allowMethods, firstHeader, getRequestHost, handleCors, json } = require("../../../lib/http-utils");

function resolveRequestedDomain(req) {
  const rawDomain = req.query?.domain;
  if (typeof rawDomain === "string" && rawDomain.trim()) {
    return rawDomain.trim();
  }

  const origin = firstHeader(req, "origin");
  if (!origin) {
    return "";
  }

  try {
    return new URL(origin).host;
  } catch {
    return "";
  }
}

module.exports = async function challengeHandler(req, res) {
  if (handleCors(req, res, ["GET", "OPTIONS"])) {
    return;
  }

  if (req.method !== "GET") {
    allowMethods(res, ["GET", "OPTIONS"]);
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
      error: error.code || "challenge_failed",
    });
  }
};
