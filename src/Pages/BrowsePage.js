import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { useAuth } from '../AuthContext';

// Custom Message Box Component (same as used in other pages for consistency)
const MessageBox = ({ message, type, onClose }) => {
    let bgColor = '';
    let textColor = '';
    switch (type) {
        case 'success':
            bgColor = 'bg-green-500';
            textColor = 'text-white';
            break;
        case 'error':
            bgColor = 'bg-red-500';
            textColor = 'text-white';
            break;
        case 'info':
            bgColor = 'bg-blue-500';
            textColor = 'text-white';
            break;
        default:
            bgColor = 'bg-gray-700';
            textColor = 'text-white';
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100]">
            <div className={`p-6 rounded-lg shadow-2xl ${bgColor} ${textColor} text-center max-w-sm mx-auto relative`}>
                <p className="text-lg font-semibold mb-4">{message}</p>
                <button
                    onClick={onClose}
                    className="mt-3 px-6 py-2 bg-white text-gray-800 rounded-md hover:bg-gray-100 transition-colors duration-200"
                >
                    OK
                </button>
            </div>
        </div>
    );
};

function BrowsePage() {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // To read query parameters
    
    // State for search query
    const [searchQuery, setSearchQuery] = useState('');
    // State to hold the actual query that was used for fetching (to avoid immediate re-fetch on every keystroke)
    const [activeSearchQuery, setActiveSearchQuery] = useState('');

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'x-auth-token': token, // Still good practice to send, even if route is public
        };
    }, []);

    const [messageBox, setMessageBox] = useState({ show: false, message: '', type: '' });

    const fetchResources = useCallback(async (query = '') => {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token'); 
        // Note: For a public browse page, token might not be strictly necessary for the GET /api/resources endpoint.
        // However, if your backend requires it even for public reads, the AuthContext's logout/navigate will handle it.

        let url = 'http://localhost:5000/api/resources';
        if (query) {
            url += `?search=${encodeURIComponent(query)}`;
        }

        try {
            const response = await fetch(url, {
                headers: getAuthHeaders(), // Always send headers, even if token is optional for this route
            });

            if (!response.ok) {
                const errData = await response.json();
                if (response.status === 401 || response.status === 403) {
                    setMessageBox({ show: true, message: 'Session expired or unauthorized. Please log in again.', type: 'error' });
                    logout();
                    navigate('/login');
                } else {
                    setError(`Failed to fetch resources: ${errData.msg || 'Unknown error'}`);
                }
                return;
            }

            const data = await response.json();
            setResources(data);
        } catch (err) {
            console.error("Error fetching resources:", err);
            setError(err.message || 'An error occurred while fetching resources.');
        } finally {
            setLoading(false);
        }
    }, [logout, navigate, getAuthHeaders]);

    useEffect(() => {
        // Initial fetch on component mount
        fetchResources(activeSearchQuery);
    }, [fetchResources, activeSearchQuery]); // Depend on activeSearchQuery to trigger re-fetch

    // Handler for search input change
    const handleSearchInputChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Handler for search button click
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setActiveSearchQuery(searchQuery); // Update active search query to trigger fetch
    };

    useEffect(() => {
        // Disable body scroll when messagebox is open
        if (messageBox.show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [messageBox.show]);

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

                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="mb-8 flex space-x-4">
                    <input
                        type="text"
                        placeholder="Search by name, description, or category..."
                        value={searchQuery}
                        onChange={handleSearchInputChange}
                        className="flex-grow px-4 py-2 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <button
                        type="submit"
                        className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors font-semibold"
                    >
                        Search
                    </button>
                </form>

                {resources.length === 0 ? (
                    <p className="text-center text-lg text-gray-300">No resources found matching your criteria. Be the first to list one!</p>
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

            {messageBox.show && (
                <MessageBox
                    message={messageBox.message}
                    type={messageBox.type}
                    onClose={() => setMessageBox({ ...messageBox, show: false })}
                />
            )}
        </div>
    );
}

export default BrowsePage;
