'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, MeResponse, AuthResponse, RegisterPayload } from '../types/auth';
import { apiClient } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (loginInput: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload | { username: string; email: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await apiClient<MeResponse>('/auth/me');
      if (data.authenticated && data.user) {
        setUser(data.user);
        try {
          localStorage.setItem(
            'aurelle_user_profile',
            JSON.stringify({
              firstName: data.user.firstName || data.user.username || 'Customer',
              lastName: data.user.lastName || '',
              email: data.user.email,
              countryCode: data.user.countryCode || 'Sri Lanka (+94)',
              phone: data.user.phone || '',
              dateOfBirth: data.user.dateOfBirth || '',
            })
          );
        } catch {}
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (loginInput: string, password: string): Promise<User> => {
    const data = await apiClient<AuthResponse>('/auth/login', {
      data: { login: loginInput, password },
    });
    if (data.user) {
      setUser(data.user);
      try {
        localStorage.setItem(
          'aurelle_user_profile',
          JSON.stringify({
            firstName: data.user.firstName || data.user.username || 'Customer',
            lastName: data.user.lastName || '',
            email: data.user.email,
            countryCode: data.user.countryCode || 'Sri Lanka (+94)',
            phone: data.user.phone || '',
            dateOfBirth: data.user.dateOfBirth || '',
          })
        );
      } catch {}
      return data.user;
    }
    throw new Error(data.message || 'Login failed');
  };

  const register = async (
    payload: RegisterPayload | { username: string; email: string; password: string }
  ): Promise<User> => {
    const data = await apiClient<AuthResponse>('/auth/register', {
      data: payload,
    });
    if (data.user) {
      setUser(data.user);
      try {
        localStorage.setItem(
          'aurelle_user_profile',
          JSON.stringify({
            firstName: data.user.firstName || data.user.username || 'Customer',
            lastName: data.user.lastName || '',
            email: data.user.email,
            countryCode: data.user.countryCode || 'Sri Lanka (+94)',
            phone: data.user.phone || '',
            dateOfBirth: data.user.dateOfBirth || '',
          })
        );
      } catch {}
      return data.user;
    }
    throw new Error(data.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    try {
      localStorage.removeItem('aurelle_user_profile');
      localStorage.removeItem('aurelle_latest_order');
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
