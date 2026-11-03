'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        const user: User | null = data.user || data;
        setState({ user, loading: false, isAuthenticated: !!user });
      } else {
        setState({ user: null, loading: false, isAuthenticated: false });
      }
    } catch {
      setState({ user: null, loading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    const data = await res.json();
    const user: User = data.user || data;
    setState({ user, loading: false, isAuthenticated: true });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setState({ user: null, loading: false, isAuthenticated: false });
    }
  }, []);

  return { ...state, login, logout, refetch: fetchUser };
}
