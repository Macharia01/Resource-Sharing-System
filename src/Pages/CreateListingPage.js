import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function CreateListingPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState('Available');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      alert("You need to be logged in to create a listing.");
      navigate('/login');
      logout();
    }
  }, [currentUser, navigate, logout]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please log in.');
      setLoading(false);
      logout();
      navigate('/login');
      return;
    }

    const listingData = {
      name,
      description,
      category,
      location,
      availability_status: availabilityStatus,
    };

    console.log("Sending listing data to backend:", listingData); // <-- NEW LOG
    console.log("Sending with token:", token); // <-- NEW LOG

    try {
      const response = await fetch('http://localhost:5000/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(listingData),
      });

      const data = await response.json();
      console.log("Backend response received:", data); // <-- NEW LOG
      console.log("Backend response status:", response.status); // <-- NEW LOG

      if (response.ok) {
        alert("Resource listing created successfully!");
        console.log("Resource creation successful:", data);
        navigate('/profile');
      } else {
        setError(`Failed to create listing: ${data.msg || 'Unknown error'}`);
        console.error("Resource creation error:", data); // <-- IMPROVED ERROR LOG
        alert(`Failed to create listing: ${data.msg || 'Unknown server error. Check console for details.'}`); // <-- IMPROVED ALERT
      }
    } catch (err) {
      console.error("Network or fetch error during resource creation:", err); // <-- IMPROVED ERROR LOG
      setError('An error occurred during listing creation. Please try again.');
      alert(`An error occurred: ${err.message || 'Check browser console for network error details.'}`); // <-- IMPROVED ALERT
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-black bg-opacity-70 p-10 rounded-lg shadow-2xl border border-pink-700">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create New Listing
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Share an item with the community!
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Item Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              placeholder="e.g., Electric Drill, Camping Tent"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              placeholder="Provide a detailed description of your item."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
              Category
            </label>
            <input
              id="category"
              name="category"
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              placeholder="e.g., Tools, Electronics, Books"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
              Location (City/Area)
            </label>
            <input
              id="location"
              name="location"
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              placeholder="e.g., Nairobi, CBD"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="availabilityStatus" className="block text-sm font-medium text-gray-300 mb-1">
              Initial Availability Status
            </label>
            <select
              id="availabilityStatus"
              name="availabilityStatus"
              value={availabilityStatus}
              onChange={(e) => setAvailabilityStatus(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm bg-white"
              required
            >
              <option value="Available">Available</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateListingPage;