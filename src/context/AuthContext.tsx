import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  role: 'ADMIN' | 'STUDENT';
  name: string;
  nisn?: string;
  kelas?: string;
  nomorInduk?: string;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string, role?: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('tka_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const savedToken = localStorage.getItem('tka_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser({
        role: data.role,
        name: data.name,
        nisn: data.nisn,
        kelas: data.kelas,
        nomorInduk: data.nomorInduk,
        mustChangePassword: data.mustChangePassword,
      });
    } catch (err) {
      console.warn('Session check failed:', err);
      localStorage.removeItem('tka_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (username: string, password: string, role?: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.login(username, password, role);
      localStorage.setItem('tka_token', res.token);
      setToken(res.token);
      const authenticatedUser: User = {
        role: res.role,
        name: res.name,
        nisn: res.nisn,
        kelas: res.kelas,
        nomorInduk: res.nomorInduk,
        mustChangePassword: res.mustChangePassword,
      };
      setUser(authenticatedUser);
      return authenticatedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('tka_token');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
