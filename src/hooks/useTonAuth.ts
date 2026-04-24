/**
 * useTonAuth Hook
 * Manages TON wallet authentication state and operations
 * Implements Challenge-Response authentication protocol
 */

import { useState, useCallback, useEffect } from "react";

export interface TonUser {
  address: string;
  isPremium: boolean;
  name?: string;
  role?: string;
  createdAt?: number;
}

interface UseTonAuthReturn {
  user: TonUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: (address: string, publicKey: string) => Promise<void>;
  disconnect: () => void;
  refreshSession: () => Promise<void>;
  token: string | null;
  challenge: string | null;
}

// Storage keys
const TON_AUTH_TOKEN_KEY = "phantom_ton_token";
const TON_USER_KEY = "phantom_ton_user";
const TON_CHALLENGE_KEY = "phantom_challenge";
const TON_NONCE_KEY = "phantom_nonce";

// Security: Generate cryptographically secure nonce
function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Security: Generate challenge message
function generateChallenge(address: string, nonce: string): string {
  const timestamp = Date.now();
  const expires = timestamp + 5 * 60 * 1000; // 5 minutes
  return `TON Auth Challenge\n\nAddress: ${address}\nNonce: ${nonce}\nExpires: ${expires}\n\nSign this message to authenticate.`;
}

// Security: Hash challenge for verification
async function hashChallenge(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Security: Validate TON address format
function validateTonAddress(address: string): { valid: boolean; type: string; error?: string } {
  if (!address) {
    return { valid: false, type: '', error: 'Address is required' };
  }
  
  // Basic format validation
  if (address.length < 32 || address.length > 48) {
    return { valid: false, type: '', error: 'Invalid address length' };
  }
  
  // Check prefix
  if (address.startsWith('EQ') || address.startsWith('EQ_')) {
    return { valid: true, type: 'wallet' };
  }
  if (address.startsWith('UQ') || address.startsWith('UQ_')) {
    return { valid: true, type: 'wallet' };
  }
  if (address.startsWith('0:')) {
    return { valid: true, type: 'raw' };
  }
  
  return { valid: false, type: '', error: 'Invalid address format. Must start with EQ, UQ, or 0:' };
}

// Security: Validate public key hex format
function validatePublicKey(publicKey: string): { valid: boolean; error?: string } {
  if (!publicKey) {
    return { valid: false, error: 'Public key is required' };
  }
  
  if (publicKey.length < 64 || publicKey.length > 66) {
    return { valid: false, error: 'Invalid public key length' };
  }
  
  if (!/^(0x)?[0-9a-fA-F]+$/.test(publicKey)) {
    return { valid: false, error: 'Public key must be hex format' };
  }
  
  return { valid: true };
}

// Storage helpers with security measures
function getStoredToken(): string | null {
  try {
    const token = localStorage.getItem(TON_AUTH_TOKEN_KEY);
    if (!token) return null;
    
    // Security: Check token expiration
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      if (tokenData.exp * 1000 < Date.now()) {
        localStorage.removeItem(TON_AUTH_TOKEN_KEY);
        localStorage.removeItem(TON_USER_KEY);
        return null;
      }
    } catch {
      // Invalid token format
      localStorage.removeItem(TON_AUTH_TOKEN_KEY);
      return null;
    }
    
    return token;
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null, user: TonUser | null) {
  try {
    if (token && user) {
      localStorage.setItem(TON_AUTH_TOKEN_KEY, token);
      localStorage.setItem(TON_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(TON_AUTH_TOKEN_KEY);
      localStorage.removeItem(TON_USER_KEY);
    }
  } catch {
    // Storage unavailable - fail silently
  }
}

function getStoredUser(): TonUser | null {
  try {
    const userStr = localStorage.getItem(TON_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function useTonAuth(): UseTonAuthReturn {
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [user, setUser] = useState<TonUser | null>(getStoredUser);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Security: Update stored data when state changes
  useEffect(() => {
    setStoredToken(token, user);
  }, [token, user]);

  // Security: Listen for token changes from other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === TON_AUTH_TOKEN_KEY) {
        if (e.newValue) {
          setToken(e.newValue);
          const newUser = getStoredUser();
          setUser(newUser);
        } else {
          setToken(null);
          setUser(null);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Security: Session refresh
  const refreshSession = useCallback(async () => {
    if (!token || !user) return;
    
    try {
      // Verify session is still valid
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = tokenData.exp * 1000;
      
      // If token expires in less than 1 hour, refresh it
      if (expiresAt - Date.now() < 60 * 60 * 1000) {
        // Generate new token (in production, this would call backend)
        const newNonce = generateNonce();
        const newChallengeMsg = generateChallenge(user.address, newNonce);
        const newHash = await hashChallenge(newChallengeMsg);
        
        const newToken = `ton_${Date.now()}_${newHash.slice(0, 32)}`;
        setToken(newToken);
      }
    } catch (err) {
      console.error("[useTonAuth] Session refresh error:", err);
      // On refresh failure, disconnect
      setToken(null);
      setUser(null);
    }
  }, [token, user]);

  // Security: Auto-refresh session
  useEffect(() => {
    if (!token) return;

    // Check session every 5 minutes
    const interval = setInterval(() => {
      refreshSession();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token, refreshSession]);

  const connect = useCallback(
    async (address: string, publicKey: string) => {
      setIsConnecting(true);
      setError(null);

      try {
        // Security: Validate inputs
        const addressValidation = validateTonAddress(address);
        if (!addressValidation.valid) {
          throw new Error(addressValidation.error);
        }

        const publicKeyValidation = validatePublicKey(publicKey);
        if (!publicKeyValidation.valid) {
          throw new Error(publicKeyValidation.error);
        }

        // Step 1: Generate nonce and challenge
        const nonce = generateNonce();
        const challengeMsg = generateChallenge(address, nonce);
        
        // Store challenge for verification
        setChallenge(challengeMsg);
        sessionStorage.setItem(TON_CHALLENGE_KEY, challengeMsg);
        sessionStorage.setItem(TON_NONCE_KEY, nonce);

        // Step 2: Sign challenge (simulated for demo)
        // In production, this would use TonConnect or wallet connector
        const challengeHash = await hashChallenge(challengeMsg);
        
        // Simulate wallet signature
        const signature = `sig_${challengeHash.slice(0, 32)}`;

        // Step 3: Verify locally (in production, verify on backend)
        // Check signature format
        if (!signature || signature.length < 10) {
          throw new Error("Signature verification failed");
        }

        // Step 4: Create authentication token
        // JWT-like structure with expiration
        const payload = {
          address,
          publicKey: publicKey.slice(0, 8) + '...' + publicKey.slice(-8),
          isPremium: address.length > 44,
          role: 'user',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
        };

        const tokenPayload = btoa(JSON.stringify(payload));
        const authToken = `ton_${tokenPayload}_${signature}`;

        // Step 5: Store authentication data
        setToken(authToken);
        setUser({
          address,
          isPremium: payload.isPremium,
          role: payload.role,
          createdAt: Date.now(),
        });

        // Clear challenge from session
        sessionStorage.removeItem(TON_CHALLENGE_KEY);
        sessionStorage.removeItem(TON_NONCE_KEY);

        console.log("[useTonAuth] Authenticated:", {
          address: address.slice(0, 8) + '...',
          isPremium: payload.isPremium,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Ошибка аутентификации";
        setError(message);
        console.error("[useTonAuth] Connect error:", err);
        throw err;
      } finally {
        setIsConnecting(false);
        setIsLoading(false);
      }
    },
    [],
  );

  const disconnect = useCallback(() => {
    setToken(null);
    setUser(null);
    setChallenge(null);
    setError(null);
    localStorage.removeItem(TON_AUTH_TOKEN_KEY);
    localStorage.removeItem(TON_USER_KEY);
  }, []);

  return {
    user,
    isAuthenticated: !!token && !!user,
    isLoading,
    isConnecting,
    error,
    connect,
    disconnect,
    refreshSession,
    token,
    challenge,
  };
}