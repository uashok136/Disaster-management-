import React, { createContext, useState, useContext, useEffect } from 'react';
import { realtimeApp } from '@/api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState({ mode: 'local_realtime' });

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    setAuthError(null);
    setAppPublicSettings({ mode: 'local_realtime' });
    await checkUserAuth();
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await realtimeApp.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setUser(null);
      setAuthChecked(true);

      if (error?.type === 'auth_required' || error?.status === 401) {
        setAuthError({
          type: 'auth_required',
          message: 'Please log in to continue',
        });
        return;
      }

      setAuthError({
        type: 'unknown',
        message: error.message || 'Failed to load user state',
      });
    }
  };

  const login = async ({ email, password }) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const currentUser = await realtimeApp.auth.login({ email, password });
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthChecked(true);
      setIsLoadingAuth(false);
      return { success: true, user: currentUser };
    } catch (error) {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setUser(null);
      setAuthError({
        type: error?.type || 'unknown',
        message: error?.message || 'Login failed',
      });
      return { success: false, error };
    }
  };

  const register = async ({ full_name, email, password }) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const currentUser = await realtimeApp.auth.register({ full_name, email, password });
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthChecked(true);
      setIsLoadingAuth(false);
      return { success: true, user: currentUser };
    } catch (error) {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setUser(null);
      setAuthError({
        type: error?.type || 'unknown',
        message: error?.message || 'Registration failed',
      });
      return { success: false, error };
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthError({ type: 'auth_required', message: 'Please log in to continue' });

    realtimeApp.auth.logout();

    if (shouldRedirect && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      login,
      register,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
