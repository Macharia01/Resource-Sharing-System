import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Ensure you have installed this: npm install jwt-decode

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true); // Tracks if auth state is still being determined
    const navigate = useNavigate();

    // Function to decode token and set user data
    const decodeTokenAndSetUser = useCallback((token) => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check if token is expired
                if (decoded.exp * 1000 < Date.now()) {
                    console.log("Token expired, logging out.");
                    localStorage.removeItem('token');
                    setCurrentUser(null);
                    return null; // Token expired
                }
                // Set current user based on decoded token
                // Ensure the user object contains username as it's used in ProfilePage
                setCurrentUser({
                    id: decoded.userId,
                    role: decoded.role,
                    username: decoded.username // This is now present in the backend JWT payload
                });
                return decoded;
            } catch (error) {
                console.error("Failed to decode token or token is invalid:", error);
                localStorage.removeItem('token');
                setCurrentUser(null);
                return null;
            }
        }
        setCurrentUser(null); // No token, no user
        return null;
    }, []);

    // Effect to check for token in localStorage on app load
    useEffect(() => {
        const token = localStorage.getItem('token');
        setLoadingAuth(true); // Start auth loading
        decodeTokenAndSetUser(token);
        setLoadingAuth(false); // End auth loading
    }, [decodeTokenAndSetUser]);

    // Login function
    const login = useCallback(async (token, user) => {
        localStorage.setItem('token', token);
        // We set the full user object received from login API for immediate use
        setCurrentUser(user); 
        // Also decode token to ensure consistent state and expiry check
        decodeTokenAndSetUser(token); 
    }, [decodeTokenAndSetUser]);

    // Logout function
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        // Removed localStorage.removeItem('currentUser') as currentUser is now derived from token or explicitly set by login.
        setCurrentUser(null);
        navigate('/login'); // Redirect to login page on logout
    }, [navigate]);

    const authContextValue = {
        currentUser,
        setCurrentUser, 
        login,
        logout,
        loadingAuth 
    };

    if (loadingAuth) {
        // Simple loading indicator while authentication is being checked
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white flex items-center justify-center">
                <p className="text-xl">Initializing application...</p>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
