import { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fhq_user')); } catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    const res = await api.post('/v1/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('fhq_token', token);
    localStorage.setItem('fhq_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fhq_token');
    localStorage.removeItem('fhq_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
