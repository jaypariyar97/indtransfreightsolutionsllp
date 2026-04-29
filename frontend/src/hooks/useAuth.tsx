import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';

export interface User {
  id?: string;
  email?: string;
  username: string;
  role: 'ADMIN' | 'EMPLOYEE';
  permissions?: Record<string, Record<string, boolean>>;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: 'admin' | 'employee') => Promise<void>;
  logout: () => void;
  hasPermission: (module: string, action: string) => boolean;
  /** True if the user has *any* action on the module (used for sidebar visibility). */
  hasAnyPermission: (module: string) => boolean;
  refresh: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Coerce whatever the backend (or older localStorage payload) sent us into the
 * canonical nested map: { module: { action: bool } }.
 *
 * Tolerates:
 *   - a JSON string (older /auth/login payloads)
 *   - the canonical nested object
 *   - a flat list of "module_action" strings
 *   - a flat map { "module_action": true }
 */
function normalisePermissions(raw: unknown): Record<string, Record<string, boolean>> {
  if (!raw) return {};
  let value: any = raw;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { return {}; }
  }
  if (Array.isArray(value)) {
    const out: Record<string, Record<string, boolean>> = {};
    for (const k of value) {
      if (typeof k !== 'string') continue;
      const [mod, ...rest] = k.replace(/\./g, '_').split('_');
      const action = rest.join('_');
      if (!mod || !action) continue;
      (out[mod] ??= {})[action] = true;
    }
    return out;
  }
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, Record<string, boolean>> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v && typeof v === 'object') {
        const bucket: Record<string, boolean> = {};
        for (const [ak, av] of Object.entries(v as Record<string, unknown>)) {
          bucket[ak] = av === true;
        }
        out[k] = bucket;
      } else if (v === true) {
        const [mod, ...rest] = k.replace(/\./g, '_').split('_');
        const action = rest.join('_');
        if (mod && action) (out[mod] ??= {})[action] = true;
      }
    }
    return out;
  }
  return {};
}

function normaliseUser(raw: any): User | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: raw.id,
    email: raw.email,
    username: raw.email || raw.username || raw.name || '',
    role: (raw.role || 'EMPLOYEE').toString().toUpperCase() as 'ADMIN' | 'EMPLOYEE',
    permissions: normalisePermissions(raw.permissions),
    mustChangePassword: !!raw.mustChangePassword,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('jwt_token');
      if (storedUser && token) {
        setUser(normaliseUser(JSON.parse(storedUser)));
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('jwt_token');
      }
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('jwt_token');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, role: 'admin' | 'employee') => {
    const response = await api.post<{ token: string; user: any }>('/auth/login', {
      email,
      password,
      role,
    });
    localStorage.setItem('jwt_token', response.token);
    const normalised = normaliseUser(response.user);
    localStorage.setItem('user', JSON.stringify(normalised));
    setUser(normalised);
  };

  /** Pull a fresh user payload from /auth/me (e.g. after permission edits). */
  const refresh = async () => {
    try {
      const me = await api.get<any>('/auth/me');
      const normalised = normaliseUser(me);
      if (normalised) {
        localStorage.setItem('user', JSON.stringify(normalised));
        setUser(normalised);
      }
    } catch {
      // ignore
    }
  };

  const updateUser = (patch: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/admin/login';
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions?.[module]?.[action] === true;
  };

  const hasAnyPermission = (module: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    const m = user.permissions?.[module];
    return !!(m && (m.view || m.add || m.edit || m.delete));
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
      refresh,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
