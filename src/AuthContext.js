import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true); 
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0); 
    const navigate = useNavigate();

    // Helper to get auth headers for API calls
    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        };
    }, []);

    // Function to decode token and set user data (synchronous and pure)
    const decodeToken = useCallback((token) => {
        if (!token) {
            return null;
        }
        try {
            const decoded = jwtDecode(token);
            // Check if token is expired
            if (decoded.exp * 1000 < Date.now()) {
                localStorage.removeItem('token');
                return null; // Token expired
            }
            // IMPORTANT: Return user object with correct ID mapping (user_id from backend JWT)
            return {
                id: decoded.user_id, // This MUST match the key used in your backend's JWT payload
                role: decoded.role,
                username: decoded.username 
            };
        } catch (error) {
            console.error("AuthContext: Failed to decode token or token is invalid.", error);
            localStorage.removeItem('token'); // Clear invalid token
            return null;
        }
    }, []);

    // Function to fetch unread notifications count - now directly uses currentUser from AuthProvider's state
    const fetchUnreadNotificationsCount = useCallback(async () => { 
        // Use the currentUser from the context's state, which is guaranteed to be up-to-date
        if (!currentUser || !currentUser.id) { 
            setUnreadNotificationsCount(0);
            return;
        }
        try {
            const response = await fetch('http://localhost:5000/api/notifications', {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const notifications = await response.json();
                const unreadCount = notifications.filter(n => !n.is_read).length;
                setUnreadNotificationsCount(unreadCount);
            } else if (response.status === 401 || response.status === 403) {
                setUnreadNotificationsCount(0); 
                // Don't logout/navigate here, let the main useEffect or consuming component handle it
                // to prevent multiple redirects.
            } else {
                console.error("AuthContext: Failed to fetch unread notifications count.", response.status, response.statusText);
                setUnreadNotificationsCount(0);
            }
        } catch (error) {
            console.error("AuthContext: Network error fetching unread notifications count.", error);
            setUnreadNotificationsCount(0);
        }
    }, [currentUser, getAuthHeaders]); // This dependency ensures the function updates if currentUser or headers change


    // PRIMARY useEffect: Handles initial authentication check and setting currentUser
    useEffect(() => {
        const initializeAuth = () => { // Removed async from here as fetchUnreadNotificationsCount is now in a separate useEffect
            setLoadingAuth(true); 
            const token = localStorage.getItem('token');
            const userFromToken = decodeToken(token); 
            setCurrentUser(userFromToken);
            setLoadingAuth(false); 
        };
        initializeAuth();
    }, [decodeToken]); 

    // NEW useEffect: Triggers notification count fetch whenever currentUser changes (after login/logout/initial load)
    useEffect(() => {
        if (currentUser) {
            fetchUnreadNotificationsCount(); // Call without arguments, as it uses internal currentUser
        } else {
            setUnreadNotificationsCount(0); // Clear count if no current user
        }
    }, [currentUser, fetchUnreadNotificationsCount]); // Depend on currentUser and fetchUnreadNotificationsCount


    // Login function
    const login = useCallback(async (token, userFromApi) => {
        localStorage.setItem('token', token);
        const decodedUser = decodeToken(token);
        if (decodedUser) {
            setCurrentUser({ ...userFromApi, ...decodedUser });
            // fetchUnreadNotificationsCount will be triggered by the new useEffect
        } else {
            setCurrentUser(null);
            setUnreadNotificationsCount(0);
            localStorage.removeItem('token');
        }
    }, [decodeToken]);

    // Logout function
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setCurrentUser(null); 
        setUnreadNotificationsCount(0); 
        navigate('/login'); 
    }, [navigate]);

    // Value provided to components consuming AuthContext
    const authContextValue = {
        currentUser,
        setCurrentUser, 
        login,
        logout,
        loadingAuth,
        isLoggedIn: !!currentUser, 
        unreadNotificationsCount, 
        refreshUnreadNotificationsCount: fetchUnreadNotificationsCount // Now this function signature is simpler
    };

    // Render loading indicator if authentication is still in progress
    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white flex items-center justify-center">
                <p className="text-xl">Initializing application...</p>
            </div>
        );
    }

    // Render children once authentication is complete
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
