import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Fetch current logged-in user when app loads
  async function getCurrentUser() {
    try {
      // Call your backend /me route, include credentials to send cookies
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);   // set user info in context
      } else {
        setUser(null);   // no user logged in
      }
    } catch (err) {
      console.error("Failed to fetch current user:", err);
      setUser(null);
    }
  }


  useEffect(() => {
    getCurrentUser();
  }, []);


  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); // if you add logout backend route
    setUser(null);
  };


  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
