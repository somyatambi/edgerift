import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface User {
  id: number;
  username: string;
  email: string;
  plan: 'free' | 'member' | 'premium';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('edgerift_token');
    if (savedToken) {
      fetch('/api/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((r) => {
          if (!r.ok) throw new Error('Token invalid');
          return r.json();
        })
        .then((data) => {
          if (data.user) {
            setToken(savedToken);
            setUser(data.user);
          }
        })
        .catch(() => {
          localStorage.removeItem('edgerift_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? 'Login failed.' };
      localStorage.setItem('edgerift_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return {};
    } catch {
      return { error: 'Cannot reach server. Make sure the API server is running.' };
    }
  };

  const register = async (username: string, email: string, password: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? 'Registration failed.' };
      localStorage.setItem('edgerift_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return {};
    } catch {
      return { error: 'Cannot reach server. Make sure the API server is running.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('edgerift_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
