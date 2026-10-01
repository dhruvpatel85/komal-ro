import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        const role = await SecureStore.getItemAsync('userRole');
        if (token && role) {
          setUserToken(token);
          setUserRole(role);
        }
      } catch (e) {
        console.error('Failed to load token from storage', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredAuth();
  }, []);

  const login = async (token, role) => {
    try {
      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.setItemAsync('userRole', role);
      setUserToken(token);
      setUserRole(role);
    } catch (e) {
      console.error('Failed to save auth details', e);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userRole');
      setUserToken(null);
      setUserRole(null);
    } catch (e) {
      console.error('Failed to clear auth details', e);
    }
  };

  return (
    <AuthContext.Provider value={{ userToken, userRole, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
