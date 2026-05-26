import React, { createContext, useState, useContext, useEffect } from 'react';
import { geoterritoriosApi } from '@/api/geoterritoriosClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({
    id: 'geoterritorios-local',
    public_settings: {
      name: 'GeoTerritórios',
      mode: 'local'
    }
  });

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingAuth(true);
      setIsLoadingPublicSettings(false);
      setAuthError(null);
      await checkUserAuth();
    } catch (error) {
      console.error('Unexpected auth error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'Erro inesperado ao carregar autenticação local'
      });
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      const currentUser = await geoterritoriosApi.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthError({
        type: 'auth_required',
        message: 'Autenticação local indisponível'
      });
    }
  };

  const logout = () => {
    geoterritoriosApi.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    checkUserAuth();
  };

  const navigateToLogin = () => {
    geoterritoriosApi.auth.redirectToLogin();
    checkUserAuth();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
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
