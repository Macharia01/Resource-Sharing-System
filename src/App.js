import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './Pages/Homepage';
import CreateListingPage from './Pages/CreateListingPage';
import ItemDetailPage from './Pages/ItemDetailPage';
import SignupPage from './Pages/SignupPage';
import LoginPage from './Pages/LoginPage';
import ProfilePage from './Pages/ProfilePage';
import AdminDashboardPage from './Pages/AdminDashboardPage';
import BrowsePage from './Pages/BrowsePage'; // <-- NEW: Import BrowsePage

import Layout from './components/Layout';
import { AuthProvider } from './AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout><Homepage /></Layout>} />
          <Route path="/create-listing" element={<Layout><CreateListingPage /></Layout>} />
          {/* MODIFIED: ItemDetailPage now expects an ID parameter */}
          <Route path="/item-details/:id" element={<Layout><ItemDetailPage /></Layout>} />
          <Route path="/signup" element={<Layout><SignupPage /></Layout>} />
          <Route path="/login" element={<Layout><LoginPage /></Layout>} />
          <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
          <Route path="/admin-dashboard" element={<Layout><AdminDashboardPage /></Layout>} />
          <Route path="/browse" element={<Layout><BrowsePage /></Layout>} /> {/* <-- NEW: Browse Page Route */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;