'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchApi } from '../lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  // profile properties would be attached here if included by backend
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  profileComplete: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      setLoading(true);
      const userData = await fetchApi('/auth/me', { ignore401: true });
      if (!userData) {
        setUser(null);
        setProfileComplete(false);
        return;
      }
      setUser(userData);
      
      // Also check profile completion status
      try {
        const profile = await fetchApi('/profile', { ignore401: true });
        setProfileComplete(profile?.isComplete || false);
      } catch (err) {
        setProfileComplete(false);
      }
    } catch (error) {
      setUser(null);
      setProfileComplete(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const logout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      setUser(null);
      setProfileComplete(false);
      router.push('/login');
    }
  };

  // Handle Protected Routes Redirection
  useEffect(() => {
    if (loading) return;

    const isAuthRoute = pathname === '/login' || pathname === '/register';
    
    const protectedRoutes = [
      '/dashboard', '/skin-analysis', '/grooming', '/nutrition', 
      '/recipes', '/products', '/progress', '/profile', '/settings', '/onboarding'
    ];
    
    const isProtectedRoute = protectedRoutes.includes(pathname);

    if (!user && isProtectedRoute) {
      router.push('/login');
    } else if (user && isAuthRoute) {
      router.push(profileComplete ? '/dashboard' : '/onboarding');
    } else if (user && isProtectedRoute && pathname !== '/onboarding' && !profileComplete) {
      router.push('/onboarding');
    }
  }, [user, loading, pathname, profileComplete, router]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, profileComplete, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
