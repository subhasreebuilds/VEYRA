import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';

type User = { id: string; email: string };
type Profile = { isComplete: boolean; [key: string]: any };

type AuthState = {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      const { data } = await api.get('/auth/me');
      setUser(data);
      
      try {
        const profileRes = await api.get('/profile');
        setProfile(profileRes.data);
      } catch (e) {
        console.log('Profile not found', e);
      }
    } catch (error) {
      console.error('Failed to load user', error);
      await SecureStore.deleteItemAsync('accessToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string, userData: User) => {
    await SecureStore.setItemAsync('accessToken', token);
    setUser(userData);
    try {
      const profileRes = await api.get('/profile');
      setProfile(profileRes.data);
    } catch (e) {
      // Ignore if no profile
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, login, logout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};
