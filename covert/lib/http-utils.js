const METHOD_NOT_ALLOWED = { error: "method_not_allowed" };

function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function allowMethods(res, methods) {
  res.setHeader("Allow", methods.join(", "));
}

function getRequestHost(req) {
  const forwardedHost = firstHeader(req, "x-forwarded-host");
  if (forwardedHost) {
    return forwardedHost.split(",")[0].trim();
  }
  return firstHeader(req, "host");
}

function firstHeader(req, name) {
  const raw = req.headers[name];
  if (Array.isArray(raw)) {
    return raw[0] ?? "";
  }
  return raw ?? "";
}

function applyCors(req, res, methods) {
  const origin = firstHeader(req, "origin");
  if (!origin) {
    return;
  }

  const allowedOrigin = resolveAllowedOrigin(origin, getRequestHost(req));
  if (!allowedOrigin) {
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", methods.join(", "));
  appendVaryHeader(res, "Origin");
}

function handleCors(req, res, methods) {
  applyCors(req, res, methods);
  if (req.method !== "OPTIONS") {
    return false;
  }
  allowMethods(res, methods);
  res.statusCode = 204;
  res.end();
  return true;
}

function readBearerToken(req) {
  const authorization = firstHeader(req, "authorization");
  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim();
  }

  const cookieHeader = firstHeader(req, "cookie");
  if (!cookieHeader) {
    return "";
  }

  for (const pair of cookieHeader.split(";")) {
    const [rawName, ...rest] = pair.trim().split("=");
    if (rawName === "phantom_session") {
      return decodeURIComponent(rest.join("="));
    }
  }

  return "";
}

function setSessionCookie(res, token, maxAgeSeconds, secure) {
  const parts = [
    `phantom_session=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) {
    parts.push("Secure");
  }
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearSessionCookie(res, secure) {
  const parts = [
    "phantom_session=",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) {
    parts.push("Secure");
  }
  res.setHeader("Set-Cookie", parts.join("; "));
}

function resolveAllowedOrigin(origin, requestHost) {
  let parsedOrigin;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return "";
  }

  const allowedHosts = resolveAllowedHosts(requestHost);
  return allowedHosts.includes(parsedOrigin.host.toLowerCase()) ? parsedOrigin.origin : "";
}

function resolveAllowedHosts(requestHost) {
  const configured = process.env.TON_AUTH_ALLOWED_DOMAINS
    ?.split(",")
    .map((item) => String(item ?? "").trim().toLowerCase())
    .filter(Boolean);

  if (configured && configured.length > 0) {
    return configured;
  }

  const host = String(requestHost ?? "").trim().toLowerCase();
  return host ? [host] : [];
}

function appendVaryHeader(res, value) {
  const current = res.getHeader("Vary");
  if (!current) {
    res.setHeader("Vary", value);
    return;
  }

  const existing = Array.isArray(current) ? current.join(", ") : String(current);
  const values = existing
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!values.some((item) => item.toLowerCase() === value.toLowerCase())) {
    values.push(value);
  }

  res.setHeader("Vary", values.join(", "));
}

module.exports = {
  applyCors,
  handleCors,
  METHOD_NOT_ALLOWED,
  allowMethods,
  clearSessionCookie,
  firstHeader,
  getRequestHost,
  json,
  readBearerToken,
  setSessionCookie,
};
