import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // optional: guard UI while checking session

  // Normalize user to a consistent shape
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

  // Fetch current logged-in user on app load
  const getCurrentUser = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUser(normalizeUser(data));
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  // Call this after successful login API to update context
  const login = (userPayload) => {
    setUser(normalizeUser(userPayload));
  };

  // Clear cookie-backed session (if backend route exists) and context
  const logout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      // even if request fails, proceed to clear client state
    } finally {
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
