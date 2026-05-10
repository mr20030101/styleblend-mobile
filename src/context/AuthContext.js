import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, logout as apiLogout } from '../api/auth';
import { getSettings } from '../api/pos';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const stored = await AsyncStorage.getItem('user');
        if (token && stored) {
          setUser(JSON.parse(stored));
          await fetchSettings();
        }
      } catch {
        // proceed as unauthenticated if storage is unavailable
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await getSettings();
      setSettings(res.data);
    } catch {}
  };

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    await AsyncStorage.setItem('token', res.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    await fetchSettings();
  };

  const logout = async () => {
    try { await apiLogout(); } catch {}
    await AsyncStorage.multiRemove(['token', 'user']);
    setUser(null);
    setSettings({});
  };

  return (
    <AuthContext.Provider value={{ user, settings, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
