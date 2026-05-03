import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  api: {
    bodyParser: false,
  },
};

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (!edgeAuthValid(req)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const target = firstHeader(req, TARGET_HEADER);
  const upstreamMethod = (firstHeader(req, METHOD_HEADER) || "GET").toUpperCase();

  if (!target) {
    res.status(400).json({ error: "missing_target" });
    return;
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    res.status(400).json({ error: "invalid_target" });
    return;
  }

  if (targetUrl.protocol !== "https:" || !ALLOWED_HOSTS.has(targetUrl.host)) {
    res.status(403).json({ error: "target_not_allowed" });
    return;
  }

  const requestBody = await readRawBody(req);
  const upstreamHeaders = buildUpstreamHeaders(req, requestBody.length);

  const upstreamResponse = await fetch(targetUrl, {
    method: upstreamMethod,
    headers: upstreamHeaders,
    body: bodyAllowed(upstreamMethod) ? requestBody : undefined,
    redirect: "manual",
  });

  const responseBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
  copyResponseHeaders(upstreamResponse, res);
  res.setHeader("x-phantom-status", "relayed");
  res.setHeader("x-phantom-upstream-code", String(upstreamResponse.status));
  const contentType = upstreamResponse.headers.get("content-type");
  if (contentType) {
    res.setHeader("content-type", contentType);
  }
  res.status(upstreamResponse.status).send(responseBuffer);
}

function edgeAuthValid(req: VercelRequest): boolean {
  const expected = process.env.PHANTOM_EDGE_KEY?.trim();
  if (!expected) {
    return true;
  }
  return firstHeader(req, EDGE_AUTH_HEADER) === expected;
}

function firstHeader(req: VercelRequest, name: string): string {
  const raw = req.headers[name];
  if (Array.isArray(raw)) {
    return raw[0] ?? "";
  }
  return raw ?? "";
}

function bodyAllowed(method: string): boolean {
  return !["GET", "HEAD"].includes(method);
}

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function buildUpstreamHeaders(req: VercelRequest, contentLength: number): Headers {
  const headers = new Headers();
  const passthrough = [
    "authorization",
    "client-token",
    "accept",
    "content-type",
    "user-agent",
    "accept-language",
    "range",
  ];

  for (const header of passthrough) {
    const value = firstHeader(req, header);
    if (value) {
      headers.set(header, value);
    }
  }

  if (contentLength > 0) {
    headers.set("content-length", String(contentLength));
  }

  return headers;
}

function copyResponseHeaders(upstreamResponse: Response, res: VercelResponse) {
  const passthrough = [
    "content-type",
    "cache-control",
    "etag",
    "last-modified",
  ];

  for (const header of passthrough) {
    const value = upstreamResponse.headers.get(header);
    if (value) {
      res.setHeader(header, value);
    }
  }
}
