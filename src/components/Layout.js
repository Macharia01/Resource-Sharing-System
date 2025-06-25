import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function Layout({ children }) {
    const { currentUser, logout } = useAuth();
    const location = useLocation();
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        };
    }, []);

    const fetchUnreadNotificationsCount = useCallback(async () => {
        if (!currentUser) {
            setUnreadNotificationsCount(0);
            return;
        }
        try {
            const response = await fetch('http://localhost:5000/api/notifications', {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                const unreadCount = data.filter(n => !n.is_read).length;
                setUnreadNotificationsCount(unreadCount);
            } else {
                console.error("Failed to fetch unread notifications count.");
                setUnreadNotificationsCount(0); // Reset count on error
            }
        } catch (error) {
            console.error("Network error fetching unread notifications count:", error);
            setUnreadNotificationsCount(0); // Reset count on network error
        }
    }, [currentUser, getAuthHeaders]);

    useEffect(() => {
        // Fetch count on component mount and when currentUser changes
        fetchUnreadNotificationsCount();

        // Set up an interval to refresh notifications every 30 seconds (adjust as needed)
        const intervalId = setInterval(fetchUnreadNotificationsCount, 30000); 

        // Clear interval on component unmount
        return () => clearInterval(intervalId);
    }, [fetchUnreadNotificationsCount]);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header / Navbar - Added fixed positioning classes */}
            <header className="bg-black text-white p-4 shadow-md w-full z-50 fixed top-0 left-0">
                <div className="container mx-auto flex justify-between items-center">
                    {/* ShareNet logo/text remains a home link */}
                    <Link to="/" className="text-2xl font-bold text-pink-600 hover:text-pink-400 transition-colors">
                        ShareNet
                    </Link>
                    <nav className="flex space-x-6 items-center">
                        {/* Explicit Home link */}
                        <Link
                            to="/"
                            className={`hover:text-pink-400 transition-colors ${location.pathname === '/' ? 'text-pink-400' : ''}`}
                        >
                            Home
                        </Link>
                        <Link
                            to="/browse"
                            className={`hover:text-pink-400 transition-colors ${location.pathname === '/browse' ? 'text-pink-400' : ''}`}
                        >
                            Browse
                        </Link>
                        {currentUser ? (
                            <>
                                <Link
                                    to="/create-listing"
                                    className={`hover:text-pink-400 transition-colors ${location.pathname === '/create-listing' ? 'text-pink-400' : ''}`}
                                >
                                    List Item
                                </Link>
                                {/* Swapped position: Notifications now comes before Profile */}
                                <Link
                                    to="/notifications"
                                    className={`relative hover:text-pink-400 transition-colors ${location.pathname === '/notifications' ? 'text-pink-400' : ''}`}
                                >
                                    Notifications
                                    {unreadNotificationsCount > 0 && (
                                        <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                            {unreadNotificationsCount}
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    to="/profile"
                                    className={`hover:text-pink-400 transition-colors ${location.pathname === '/profile' ? 'text-pink-400' : ''}`}
                                >
                                    Profile ({currentUser.username})
                                </Link>

                                {currentUser.role === 'admin' && (
                                    <Link
                                        to="/admin-dashboard"
                                        className={`hover:text-pink-400 transition-colors ${location.pathname === '/admin-dashboard' ? 'text-pink-400' : ''}`}
                                    >
                                        Admin
                                    </Link>
                                )}
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className={`hover:text-pink-400 transition-colors ${location.pathname === '/login' ? 'text-pink-400' : ''}`}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-4 py-2 bg-pink-600 rounded-md hover:bg-pink-700 transition-colors"
                                >
                                    Signup
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            {/* Main Content - Added padding-top to prevent content from going under the fixed header */}
            <main className="flex-grow pt-16"> {/* Adjust pt-16 if your header height changes */}
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-black text-white p-4 text-center text-sm shadow-inner mt-auto">
                <div className="container mx-auto">
                    &copy; {new Date().getFullYear()} ShareNet. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

export default Layout;
