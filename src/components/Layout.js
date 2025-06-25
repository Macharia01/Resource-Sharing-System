import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function Layout({ children }) {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans">
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-6 bg-white shadow">
        <h1 className="text-xl font-bold text-pink-600">ShareNet</h1>
        <nav className="space-x-6 flex items-center">
          <Link to="/" className="text-gray-600 hover:text-pink-500">Home</Link>
          <Link to="/browse" className="text-gray-600 hover:text-pink-500">Browse</Link>
          {currentUser && (
            <Link to="/create-listing" className="text-gray-600 hover:text-pink-500">Create Listing</Link>
          )}
          <Link to="/how-it-works" className="text-gray-600 hover:text-pink-500">How It Works</Link>
          <Link to="/categories" className="text-gray-600 hover:text-pink-500">Categories</Link>

          {currentUser && currentUser.role === 'admin' && ( // <-- NEW: Only show if admin
            <Link to="/admin-dashboard" className="text-gray-600 hover:text-pink-500">Admin</Link>
          )}

          {currentUser ? (
            <>
              <Link to="/profile" className="text-pink-600 font-semibold hover:text-pink-500">
                {currentUser.username || currentUser.email || 'User Profile'}
              </Link>
              {/* Logout button moved to profile page */}
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-pink-500">Login</Link>
              <Link to="/signup" className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700">Sign Up</Link>
            </>
          )}
        </nav>
      </header>

      <main className="pt-24">
        {children}
      </main>

      <footer className="text-center text-sm text-gray-300 py-6 bg-black border-t border-gray-800">
        &copy; {new Date().getFullYear()} ShareNet. All rights reserved.
      </footer>
    </div>
  );
}

export default Layout;