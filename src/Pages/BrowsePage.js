import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext'; // Needed for authentication if browse is protected or for token

function BrowsePage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuth(); // To handle potential session expiry
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token'); // Assuming resources might be protected or you need to send token

      if (!token) {
        // Handle case where no token exists, if browse is supposed to be protected
        // For now, let's assume browse is public or backend handles it without token.
        // If protected, you'd redirect:
        // navigate('/login');
        // logout();
        // return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/resources', { // Assuming this endpoint for all resources
          headers: {
            'Content-Type': 'application/json',
            // 'x-auth-token': token, // Uncomment if this route requires authentication
          },
        });

        if (!response.ok) {
          const errData = await response.json();
          // If 401/403, might need to redirect to login
          if (response.status === 401 || response.status === 403) {
            alert('Session expired or unauthorized. Please log in again.');
            logout();
            navigate('/login');
            return;
          }
          throw new Error(errData.msg || 'Failed to fetch resources');
        }

        const data = await response.json();
        setResources(data);
      } catch (err) {
        console.error("Error fetching resources:", err);
        setError(err.message || 'An error occurred while fetching resources.');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [logout, navigate]); // Added logout, navigate to dependencies

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <p className="text-xl">Loading resources...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <p className="text-xl text-red-400">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans py-16 px-6 md:px-20">
      <div className="max-w-6xl mx-auto bg-black bg-opacity-70 p-10 rounded-lg shadow-2xl border border-pink-700">
        <h2 className="text-3xl font-extrabold text-white text-center mb-8">
          Browse Available Resources
        </h2>

        {resources.length === 0 ? (
          <p className="text-center text-lg text-gray-300">No resources found. Be the first to list one!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.map(resource => (
              <div key={resource.resource_id} className="bg-white rounded-lg shadow-lg overflow-hidden text-gray-900">
                <img
                  src={`https://placehold.co/400x250/e0e0e0/555555?text=${resource.name}`} // Placeholder image
                  alt={resource.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-pink-700 mb-2">{resource.name}</h3>
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">{resource.description}</p>
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                    <span><strong>Category:</strong> {resource.category}</span>
                    <span><strong>Status:</strong> {resource.availability_status}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4"><strong>Location:</strong> {resource.location}</p>
                  <p className="text-gray-600 text-sm mb-4"><strong>Owner:</strong> {resource.owner_username}</p>
                  <Link
                    to={`/item-details/${resource.resource_id}`} // Link to ItemDetailPage with ID
                    className="block w-full text-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors font-semibold"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowsePage;