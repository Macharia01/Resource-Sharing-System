import React from 'react';
import { Link } from 'react-router-dom';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#2e1f25] to-[#e192a3] text-white font-sans">
      {/* Header */}
      <header className="flex justify-between items-center p-6 bg-pink-50 shadow-md text-gray-800">
        <h1 className="text-xl font-bold text-pink-600">ShareNet</h1>
        <nav className="space-x-6">
          <Link to="/" className="hover:text-pink-500">Home</Link>
          <Link to="/create-listing" className="hover:text-pink-500">Create Listing</Link>
          <Link to="/ItemDetailPage" className="hover:text-pink-500">ItemDetailPage</Link>
          <Link to="#" className="hover:text-pink-500">About</Link>
          <Link to="#" className="hover:text-pink-500">Login</Link>
          <Link to="#" className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700">Sign Up</Link>
        </nav>
      </header>

      {/* Page Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-300 py-6 bg-black border-t border-gray-800">
        &copy; {new Date().getFullYear()} ShareNet. All rights reserved.
      </footer>
    </div>
  );
}

export default Layout;
