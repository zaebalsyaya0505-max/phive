const { readSession } = require("../../lib/phantom-auth");
const { METHOD_NOT_ALLOWED, allowMethods, handleCors, json, readBearerToken } = require("../../lib/http-utils");

module.exports = async function subscriptionStatusHandler(req, res) {
  if (handleCors(req, res, ["GET", "OPTIONS"])) {
    return;
  }

  if (req.method !== "GET") {
    allowMethods(res, ["GET", "OPTIONS"]);
    json(res, 405, METHOD_NOT_ALLOWED);
    return;
  }

  try {
    const current = await readSession(readBearerToken(req));
    json(res, 200, {
      ok: true,
      address: current.session.address,
      wallet: current.wallet,
      entitlement: current.entitlement,
    });
  } catch (error) {
    json(res, error.statusCode || 500, {
      ok: false,
      error: error.code || "subscription_status_failed",
    });
  }
};
