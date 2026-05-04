import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useSupabase } from '@/providers/SupabaseProvider';

const SESSION_KEY = 'phantom_admin_token';

async function verifyAdminToken(): Promise<boolean> {
  try {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return false;

    const res = await fetch('/api/v1/admin/auth', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (!data.admin) return false;

    const exp = sessionStorage.getItem(`${SESSION_KEY}_exp`);
    if (exp && Date.now() > Number(exp)) {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(`${SESSION_KEY}_exp`);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, requiredRole, redirectTo = '/auth/login' }: ProtectedRouteProps) {
  const { user, role, loading } = useSupabase();
  const location = useLocation();
  const [adminVerified, setAdminVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (requiredRole === 'admin') {
      verifyAdminToken().then(setAdminVerified);
    }
  }, [requiredRole]);

  if (requiredRole === 'admin') {
    if (adminVerified === null) {
      return (
        <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50 text-sm">Проверка авторизации...</p>
          </div>
        </div>
      );
    }

    if (!adminVerified) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-phantom-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
