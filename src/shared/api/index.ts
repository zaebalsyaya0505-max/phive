const API_BASE = import.meta.env.VITE_API_URL || '';
const DEFAULT_TIMEOUT = 10000; // 10 seconds

interface RequestOptions {
  method?: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
}

class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, timeout = DEFAULT_TIMEOUT } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    signal: controller.signal,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new ApiError(
        `API Error ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return response.json() as Promise<T>;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }

    if (error instanceof TypeError) {
      throw new ApiError('Network error: unable to connect', 0);
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'GET', headers }),

  post: <T>(endpoint: string, body: Record<string, unknown>, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'POST', body, headers }),

  bootnode: {
    getPeers: (authToken: string) =>
      request<{ peers: Array<{ peerId: string; multiaddr: string; ip: string }> }>('/api/bootnode', {
        method: 'GET',
        headers: { 'x-phive-auth': authToken },
      }),

    registerPeer: (authToken: string, peerId: string, multiaddr: string) =>
      request<{ status: string }>('/api/bootnode', {
        method: 'POST',
        body: { peerId, multiaddr },
        headers: { 'x-phive-auth': authToken },
      }),
  },

  auth: {
    tonLogin: (address: string, signature: string) =>
      request<{ token: string; user: Record<string, unknown> }>('/api/auth/ton', {
        method: 'POST',
        body: { address, signature },
      }),

    getSession: (token: string) =>
      request<{ valid: boolean; user: Record<string, unknown> }>('/api/auth/session', {
        method: 'POST',
        body: { token },
      }),
  },

  user: {
    getProfile: (token: string) =>
      request<Record<string, unknown>>('/api/user', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }),
  },

  v1: {
    getConfig: () =>
      request<Record<string, unknown>>('/api/v1/config'),

    getData: () =>
      request<Record<string, unknown>>('/api/v1/data'),

    getRoutes: () =>
      request<Record<string, unknown>>('/api/v1/routes'),
  },
};

export { ApiError };
export type { RequestOptions };
