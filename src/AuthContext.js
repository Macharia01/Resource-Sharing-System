// src/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false); // New state to track if initial auth check is done

  // This useEffect now explicitly monitors the presence of the 'token' in localStorage
  // This is a more robust way to handle the "single source of truth" for authentication status.
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('currentUser');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (!currentUser || currentUser.id !== parsedUser.id) { // Only update if different or currently null
          setCurrentUser(parsedUser);
        }
      } catch (e) {
        console.error("Failed to parse currentUser from localStorage", e);
        // If parsing fails, ensure storage is cleared
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        setCurrentUser(null);
      }
    } else if (currentUser) {
      // If there's no token or stored user in localStorage, but currentUser state is not null,
      // then the user is effectively logged out. Clear the state.
      setCurrentUser(null);
    }
    setIsAuthChecked(true); // Mark that the initial check is complete
  }, [currentUser]); // Depend on currentUser to trigger re-evaluation of localStorage.

  // The actual login function remains the same
  const login = (user, token) => {
    setCurrentUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  // The actual logout function is crucial: it clears localStorage FIRST, then state.
  const logout = () => {
    // 1. Clear localStorage immediately. This is the primary persistent state.
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    // 2. Clear React state. This should trigger re-renders in components.
    setCurrentUser(null); // Set to null after localStorage is confirmed cleared
    // 3. Provide user feedback
    alert("You have been logged out successfully!");
    // Navigation will be handled by the component calling this logout function (e.g., ProfilePage)
  };

  // Provide a loading state until the initial authentication check is complete
  if (!isAuthChecked) {
    return <div>Loading authentication...</div>; // Or a spinner/loading screen
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};