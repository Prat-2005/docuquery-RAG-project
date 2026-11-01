import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Test if we have a token and if it's still valid
        const token = localStorage.getItem('access_token');
        if (token) {
          const response = await api.get('/auth/me');
          setUser(response.data);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        localStorage.removeItem('access_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (token, userData = null) => {
    localStorage.setItem('access_token', token);
    if (userData) {
      setUser(userData);
      return;
    }

    const response = await api.get('/auth/me');
    setUser(response.data);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
