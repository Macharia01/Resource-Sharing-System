import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './Pages/Homepage';
import CreateListingPage from './Pages/CreateListingPage';
import ItemDetailPage from './Pages/ItemDetailPage';
import SignupPage from './Pages/SignupPage';
import LoginPage from './Pages/LoginPage';
import ProfilePage from './Pages/ProfilePage';
import AdminDashboardPage from './Pages/AdminDashboardPage';
import BrowsePage from './Pages/BrowsePage';
import NotificationsPage from './Pages/NotificationsPage'; // NEW: Import NotificationsPage

import Layout from './components/Layout';
import { AuthProvider } from './AuthContext';

function App() {
  return (
    // CHANGE: AuthProvider now wraps children *inside* Router
    <Router>
      <AuthProvider>
        {/* Layout wraps all pages for consistent styling and potentially a shared Navbar */}
        <Routes>
          <Route path="/" element={<Layout><Homepage /></Layout>} />
          <Route path="/create-listing" element={<Layout><CreateListingPage /></Layout>} />
          
          <Route path="/item-details/:id" element={<Layout><ItemDetailPage /></Layout>} />
          <Route path="/Homepage" element={<Layout><Homepage /></Layout>} />
          <Route path="/signup" element={<Layout><SignupPage /></Layout>} />
          <Route path="/login" element={<Layout><LoginPage /></Layout>} />
          <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
          <Route path="/admin-dashboard" element={<Layout><AdminDashboardPage /></Layout>} />
          <Route path="/browse" element={<Layout><BrowsePage /></Layout>} />
          <Route path="/notifications" element={<Layout><NotificationsPage /></Layout>} /> {/* NEW: Notifications Page Route */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
