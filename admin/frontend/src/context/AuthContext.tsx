'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  _id: string;
  login: string;
  fullName: string;
  corporateEmail: string;
  department: string;
  position: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
        if (pathname === '/AWIS/login') {
          router.push('/AWIS/dashboard');
        }
      } catch (error) {
        setUser(null);
        if (pathname.startsWith('/AWIS') && pathname !== '/AWIS/login') {
          router.push('/AWIS/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [pathname, router]);

  const login = (userData: User) => {
    setUser(userData);
    router.push('/AWIS/dashboard');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      router.push('/AWIS/login');
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
