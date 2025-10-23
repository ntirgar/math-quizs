"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser { id: string; email: string }
interface AuthContextValue { user: AuthUser | null; loading: boolean; refresh: () => void; logout: () => Promise<void>; }

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user,setUser] = useState<AuthUser|null>(null);
  const [loading,setLoading] = useState(true);
  const router = useRouter();
  const load = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user);
    } catch { setUser(null); } finally { setLoading(false); }
  };
  useEffect(()=> { load(); }, []);
  const refresh = () => { setLoading(true); load(); };
  const logout = async () => {
    await fetch('/api/auth/logout', { method:'POST' });
    setUser(null);
    // Redirect to landing page after logout
    router.push('/');
  };
  return <AuthContext.Provider value={{ user, loading, refresh, logout }}>{children}</AuthContext.Provider>;
};

export function useAuth(){
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
