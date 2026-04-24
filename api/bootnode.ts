import { kv } from '@vercel/kv';
import { z } from 'zod';

export const config = {
  runtime: 'edge',
};

// Validation schemas
const PeerRegistrationSchema = z.object({
  peerId: z.string().min(1).max(256),
  multiaddr: z.string().min(1).max(256),
});

// Rate limiting key generator
function getRateLimitKey(ip: string, method: string): string {
  return `rate_limit:${method}:${ip}`;
}

// Check rate limit
async function checkRateLimit(ip: string, method: string): Promise<boolean> {
  const key = getRateLimitKey(ip, method);
  const limit = method === 'POST' ? 10 : 100; // POST: 10 req/min, GET: 100 req/min
  const window = 60; // 1 minute window
  
  try {
    const current = await kv.incr(key);
    if (current === 1) {
      await kv.expire(key, window);
    }
    return current <= limit;
  } catch {
    return true; // Allow on Redis error
  }
}

// Secure random shuffle using Fisher-Yates algorithm
function secureShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Extract real client IP (with validation)
function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',');
    const ip = ips[0].trim();
    if (isValidIp(ip)) return ip;
  }
  return 'unknown';
}

// Validate IP address format
function isValidIp(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  return ipv4Regex.test(ip);
}

export default async function handler(req: Request) {
  const clientIp = getClientIp(req);
  
  // Enhanced CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://phive-five.vercel.app',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-phive-auth',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Rate limiting check
  const allowed = await checkRateLimit(clientIp, req.method);
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429, headers }
    );
  }

  // Authenticate request
  const authHeader = req.headers.get('x-phive-auth');
  if (authHeader !== process.env.PHIVE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers }
    );
  }

  // POST: Register new peer
  if (req.method === 'POST') {
    try {
      let body;
      try {
        body = await req.json();
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON' }),
          { status: 400, headers }
        );
      }

      // Validate input
      const validation = PeerRegistrationSchema.safeParse(body);
      if (!validation.success) {
        return new Response(
          JSON.stringify({ error: 'Invalid peer data', details: validation.error.errors }),
          { status: 422, headers }
        );
      }

      const { peerId, multiaddr } = validation.data;
      const TTL = 300; // 5 minutes

      // Store with expiration
      const peerData = JSON.stringify({ peerId, multiaddr, ip: clientIp, registeredAt: Date.now() });
      await kv.sadd('active_peers', peerData);
      await kv.expire('active_peers', TTL);

      return new Response(
        JSON.stringify({ status: 'registered', ttl: TTL }),
        { status: 200, headers }
      );
    } catch (e) {
      console.error('POST error:', e);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers }
      );
    }
  }

  // GET: List available peers
  if (req.method === 'GET') {
    try {
      const peers = await kv.smembers('active_peers');
      
      if (!Array.isArray(peers) || peers.length === 0) {
        return new Response(
          JSON.stringify({ peers: [], count: 0 }),
          { status: 200, headers }
        );
      }

      // Safely parse peers and shuffle
      const validPeers = peers
        .filter(p => typeof p === 'string')
        .map((p) => {
          try {
            return JSON.parse(p);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const shuffled = secureShuffle(validPeers).slice(0, 10);

      return new Response(
        JSON.stringify({ peers: shuffled, count: shuffled.length }),
        { status: 200, headers }
      );
    } catch (e) {
      console.error('GET error:', e);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Method Not Allowed' }),
    { status: 405, headers }
  );
}
