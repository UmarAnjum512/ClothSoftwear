import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [activeRegister, setActiveRegister] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check active register shift
  const fetchActiveRegister = async () => {
    try {
      const res = await api.get('/register/current');
      if (res.data.success && res.data.active) {
        setActiveRegister(res.data.register);
      } else {
        setActiveRegister(null);
      }
    } catch (err) {
      setActiveRegister(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            await fetchActiveRegister();
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      await fetchActiveRegister();
      return res.data;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setActiveRegister(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        activeRegister,
        fetchActiveRegister,
        login,
        logout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
