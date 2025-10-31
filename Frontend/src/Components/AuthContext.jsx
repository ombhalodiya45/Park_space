import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ✅ Normalize user data
  const normalizeUser = (data) => {
    if (!data) return null;
    return {
      id: data.id || data._id || data.userId || null,
      fullName: data.fullName || data.name || 'User',
      email: data.email || '',
      phoneNumber: data.phoneNumber || '',
      vehicles: data.vehicles || [],
    };
  };

  // ✅ Fetch current user using stored token (if available)
  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch('http://localhost:5000/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}), // ✅ attach token if exists
        },
        credentials: 'include', // include cookies if backend sets them
      });

      if (res.ok) {
        const data = await res.json();
        setUser(normalizeUser(data));
      } else {
        setUser(null);
        localStorage.removeItem('token'); // clear invalid token
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  // ✅ Called after successful login
  const login = (userPayload) => {
    setUser(normalizeUser(userPayload));
  };

  // ✅ Logout function
  const logout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.warn('Logout request failed, clearing local state.');
    } finally {
      localStorage.removeItem('token'); // ✅ clear token
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
