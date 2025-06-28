import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function Layout({ children }) {
    // Destructure unreadNotificationsCount and refreshUnreadNotificationsCount from useAuth
    const { currentUser, logout, unreadNotificationsCount, refreshUnreadNotificationsCount } = useAuth();
    const location = useLocation();

    // Effect for periodic refresh of the notification badge in the navbar
    useEffect(() => {
        // The initial fetch for current user is now handled in AuthContext itself via its useEffect.
        // This useEffect now primarily handles the periodic refresh.
        const intervalId = setInterval(() => {
            if (currentUser) { // Only refresh if user is logged in
                refreshUnreadNotificationsCount(); // Call without arguments
            }
        }, 30000); // Refresh every 30 seconds

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(intervalId);

    }, [currentUser, refreshUnreadNotificationsCount]); // Depend on currentUser and the refresh function


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
                                {/* Notifications link now uses unreadNotificationsCount from AuthContext */}
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
            <main className="flex-grow pt-16"> 
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
