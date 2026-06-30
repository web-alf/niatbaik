// Auth: token rehydrate on mount, login/logout/updateUser, derived design role,
// and 401-session-expiry recovery. Ported from app.jsx (auth bootstrap + handlers).
// Routing/data/UI no longer live here — see the router, useDataStore, useUiStore.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toDesignRole, firstPathForRole } from '@/lib/nav';
import { useUiStore } from '@/store/ui';
import type { Role, User } from '@/types/api';

interface AuthValue {
  user: User | null;
  role: Role;
  authLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
}

const AuthCtx = createContext<AuthValue | null>(null);
export const useAuth = (): AuthValue => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();
  const role = toDesignRole(user);

  // Rehydrate session from the JWT on mount. The user object is intentionally NOT
  // persisted to localStorage — api.me() is the single source of truth. Public
  // routes live outside the auth guard, so no public-flow redirect dance is needed.
  useEffect(() => {
    const token = api.getToken && api.getToken();
    if (token) {
      api.me().then((res) => {
        if (res?.data) setUser(res.data);
        else api.clearToken && api.clearToken();
      }).catch(() => {
        api.clearToken && api.clearToken();
      }).finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  // 401 on an authenticated request → token cleared in api.ts, which fires
  // nb-session-expired. Drop back to login instead of a silently-failing dashboard.
  const navRef = useRef(navigate);
  navRef.current = navigate;
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      useUiStore.getState().showToast('Sesi berakhir. Silakan masuk kembali.');
      navRef.current('/login');
    };
    window.addEventListener('nb-session-expired', onExpired);
    return () => window.removeEventListener('nb-session-expired', onExpired);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    navigate(firstPathForRole(toDesignRole(userData)));
  };

  const logout = () => {
    api.logout && api.logout();
    setUser(null);
    try { localStorage.removeItem('niatbaik_session'); } catch { /* ignore legacy */ }
    navigate('/');
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  return (
    <AuthCtx.Provider value={{ user, role, authLoading, login, logout, updateUser }}>
      {children}
    </AuthCtx.Provider>
  );
}
