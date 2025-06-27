import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Ensure you have installed this: npm install jwt-decode

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true); // Manages initial auth check state
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0); // State for unread count
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
            // Log error internally but don't disrupt app flow
            console.error("AuthContext: Failed to decode token or token is invalid.", error);
            localStorage.removeItem('token'); // Clear invalid token
            return null;
        }
    }, []);

    // Function to fetch unread notifications count
    const fetchUnreadNotificationsCount = useCallback(async (user) => { // Takes user as argument
        if (!user || !user.id) { // Ensure a user object with an ID is passed
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
                // Handle unauthorized, but let the main auth useEffect handle logout/redirection
                setUnreadNotificationsCount(0); // Clear count on auth error
            } else {
                // Log other fetch errors internally
                console.error("AuthContext: Failed to fetch unread notifications count.", response.status, response.statusText);
                setUnreadNotificationsCount(0);
            }
        } catch (error) {
            // Log network errors internally
            console.error("AuthContext: Network error fetching unread notifications count.", error);
            setUnreadNotificationsCount(0);
        }
    }, [getAuthHeaders]);


    // PRIMARY useEffect: Handles initial authentication check and loading state
    useEffect(() => {
        const initializeAuth = async () => {
            setLoadingAuth(true); // Start loading

            const token = localStorage.getItem('token');
            const userFromToken = decodeToken(token); // Synchronously get user from token

            setCurrentUser(userFromToken); // Set currentUser based on token

            if (userFromToken) {
                // If a valid user is found from token, then fetch their notifications
                await fetchUnreadNotificationsCount(userFromToken); // Await the fetch
            } else {
                setUnreadNotificationsCount(0); // No user, reset count
            }
            
            setLoadingAuth(false); // Authentication check is now complete
        };

        initializeAuth();
    }, [decodeToken, fetchUnreadNotificationsCount]); // Dependencies: decodeToken, fetchUnreadNotificationsCount


    // Login function
    const login = useCallback(async (token, userFromApi) => { // `userFromApi` is the user object from backend API response
        localStorage.setItem('token', token);
        // Prioritize data from API response, but ensure 'id' from token is used for consistency
        const decodedUser = decodeToken(token);
        if (decodedUser) {
             // Merge API user data with decoded ID/role (API might have more fields)
            setCurrentUser({ ...userFromApi, ...decodedUser });
            await fetchUnreadNotificationsCount(decodedUser); // Fetch notifications right after login
        } else {
            // Fallback if token decoding somehow fails even after successful login
            setCurrentUser(null);
            setUnreadNotificationsCount(0);
            localStorage.removeItem('token');
        }
    }, [decodeToken, fetchUnreadNotificationsCount]);

    // Logout function
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setCurrentUser(null); // Clear user state
        setUnreadNotificationsCount(0); // Reset count immediately
        navigate('/login'); // Redirect to login page on logout
    }, [navigate]);

    // Value provided to components consuming AuthContext
    const authContextValue = {
        currentUser,
        setCurrentUser, 
        login,
        logout,
        loadingAuth,
        unreadNotificationsCount, // Expose the unread count
        refreshUnreadNotificationsCount: fetchUnreadNotificationsCount // Expose a method to refresh the count
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
