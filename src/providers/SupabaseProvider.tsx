import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

const TON_AUTH_TOKEN_KEY = 'phantom_ton_token';
const TON_AUTH_USER_KEY = 'phantom_ton_user';

interface SupabaseContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: string;
  signOut: () => Promise<void>;
  isTonAuth: boolean;
  tonUser: { address: string; publicKey: string; isPremium: boolean; role: string } | null;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider');
  }
  return context;
}

interface SupabaseProviderProps {
  children: ReactNode;
}

async function fetchRole(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('[Supabase] Failed to fetch role:', error.message);
      return 'user';
    }
    return data?.role ?? 'user';
  } catch {
    return 'user';
  }
}

async function syncTonToProfile(address: string, publicKey: string): Promise<void> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      await supabase
        .from('profiles')
        .update({ ton_address: address, ton_public_key: publicKey })
        .eq('id', session.session.user.id);
    }
  } catch {
    // Profile sync is non-critical — TON auth works standalone
  }
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('user');
  const [isTonAuth, setIsTonAuth] = useState(false);
  const [tonUser, setTonUser] = useState<{ address: string; publicKey: string; isPremium: boolean; role: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const userRole = await fetchRole(session.user.id);
        setRole(userRole);
      }
      setLoading(false);
    }).catch(() => {
      // Ignore lock race conditions - known Supabase JS client bug
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const userRole = await fetchRole(session.user.id);
        setRole(userRole);
      } else {
        setRole('user');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TON_AUTH_TOKEN_KEY);
    const userStr = localStorage.getItem(TON_AUTH_USER_KEY);
    if (token && userStr && !user) {
      try {
        const parsed = JSON.parse(userStr);
        setTonUser(parsed);
        setIsTonAuth(true);
        syncTonToProfile(parsed.address, parsed.publicKey);
      } catch {
        localStorage.removeItem(TON_AUTH_TOKEN_KEY);
        localStorage.removeItem(TON_AUTH_USER_KEY);
      }
    }
  }, [user]);

  const signOut = async () => {
    localStorage.removeItem(TON_AUTH_TOKEN_KEY);
    localStorage.removeItem(TON_AUTH_USER_KEY);
    setTonUser(null);
    setIsTonAuth(false);
    await supabase.auth.signOut();
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/50 p-6 rounded-xl text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Configuration Error</h2>
          <p className="text-white/70 mb-4">Supabase URL or Key is missing.</p>
          <p className="text-xs text-white/40">
            Please add <code className="bg-white/10 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-white/10 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> to Vercel Environment Variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SupabaseContext.Provider value={{ session, user, loading, role, signOut, isTonAuth, tonUser }}>
      {children}
    </SupabaseContext.Provider>
  );
}
