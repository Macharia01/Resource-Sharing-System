import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './Pages/Homepage';
import CreateListingPage from './Pages/CreateListingPage';
import Layout from './components/Layout';
import ItemDetailPage from './Pages/ItemDetailPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Homepage /></Layout>} />
        <Route path="/create-listing" element={<Layout><CreateListingPage /></Layout>} />
        <Route path="/ItemDetailPage" element={<Layout><ItemDetailPage /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
