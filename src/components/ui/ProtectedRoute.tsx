import { Navigate, useLocation } from 'react-router';
import { useSupabase } from '@/providers/SupabaseProvider';

const SESSION_KEY = 'phantom_admin_token';

function isAdminSessionValid(): boolean {
  try {
    const token = sessionStorage.getItem(SESSION_KEY);
    const exp = sessionStorage.getItem(`${SESSION_KEY}_exp`);
    if (!token || !exp) return false;
    return Date.now() < Number(exp);
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

  if (requiredRole === 'admin') {
    if (isAdminSessionValid()) {
      return <>{children}</>;
    }
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
