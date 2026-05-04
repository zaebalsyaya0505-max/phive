import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, timingSafeEqual } from "crypto";
import { withRateLimit, denyRateLimited } from "../middleware/rate-limit.js";

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY;

export const config = {
  api: {
    bodyParser: true,
  },
};

function signToken(payload: Record<string, any>): string {
  if (!ADMIN_SECRET) throw new Error("ADMIN_SECRET_KEY not configured");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", ADMIN_SECRET).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

function verifyToken(token: string): Record<string, any> | null {
  if (!ADMIN_SECRET) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  const expectedSig = createHmac("sha256", ADMIN_SECRET).update(payloadB64).digest("base64url");
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function setSecurityHeaders(res: VercelResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);

  if (!ADMIN_SECRET) {
    res.status(500).json({ error: "server_misconfiguration" });
    return;
  }

  if (req.method === "POST") {
    const rate = await withRateLimit(req, res, { max: 10, windowMs: 60000, keyPrefix: "admin-auth" });
    if (!rate.allowed) {
      denyRateLimited(res);
      return;
    }

    const { code } = req.body || {};
    if (!code || typeof code !== "string") {
      res.status(400).json({ error: "missing_code" });
      return;
    }

    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

    const isValid = timingSafeEqual(
      Buffer.from(code),
      Buffer.from(ADMIN_SECRET)
    );

    if (isValid) {
      const token = signToken({
        admin: true,
        iat: Date.now(),
        exp: Date.now() + 8 * 60 * 60 * 1000,
      });
      res.status(200).json({
        token,
        expiresAt: Date.now() + 8 * 60 * 60 * 1000,
      });
    } else {
      res.status(401).json({ error: "invalid_code" });
    }
    return;
  }

  if (req.method === "GET") {
    const authHeader = req.headers.authorization;
    const tokenParam = req.query.token as string | undefined;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : tokenParam;

    if (!token) {
      res.status(401).json({ error: "missing_token" });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: "invalid_or_expired_token" });
      return;
    }

    res.status(200).json({ admin: true, exp: payload.exp });
    return;
  }

  res.setHeader("Allow", "POST, GET");
  res.status(405).json({ error: "method_not_allowed" });
}
