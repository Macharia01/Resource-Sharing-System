import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

// Custom Message Box Component (copied for consistency)
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

function CreateListingPage() {
    const navigate = useNavigate();
    const { currentUser, logout, loadingAuth } = useAuth(); // Added loadingAuth

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [location, setLocation] = useState('');
    const [availabilityStatus, setAvailabilityStatus] = useState('Available');
    const [loading, setLoading] = useState(false);
    const [messageBox, setMessageBox] = useState({ show: false, message: '', type: '' });

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        };
    }, []);

    useEffect(() => {
        if (!loadingAuth && !currentUser) { // Check loadingAuth before redirecting
            setMessageBox({ show: true, message: "You need to be logged in to create a listing.", type: 'info' });
            logout();
            // Using a timeout for messagebox to show before redirect
            setTimeout(() => navigate('/login'), 1500); 
        }
    }, [currentUser, navigate, logout, loadingAuth]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessageBox({ show: false, message: '', type: '' }); // Clear previous messages
        setLoading(true);

        const token = localStorage.getItem('token');
        if (!token) {
            setMessageBox({ show: true, message: 'Authentication token not found. Please log in.', type: 'error' });
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

        try {
            const response = await fetch('http://localhost:5000/api/resources', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(listingData),
            });

            const data = await response.json();

            if (response.ok) {
                setMessageBox({ show: true, message: "Resource listing created successfully!", type: 'success' });
                // Navigate after message is acknowledged, or after a short delay
                setTimeout(() => navigate('/profile'), 1500);
            } else {
                setMessageBox({ show: true, message: `Failed to create listing: ${data.msg || 'Unknown error'}`, type: 'error' });
                console.error("Resource creation error:", data);
            }
        } catch (err) {
            console.error("Network or fetch error during resource creation:", err);
            setMessageBox({ show: true, message: `An error occurred: ${err.message || 'Check console for network error details.'}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Render nothing or a loading spinner while auth is loading
    if (loadingAuth || !currentUser) {
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
                    {/* Error display handled by MessageBox now */}

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

            {messageBox.show && (
                <MessageBox
                    message={messageBox.message}
                    type={messageBox.type}
                    onClose={() => {
                        setMessageBox({ ...messageBox, show: false });
                        // Optionally navigate after user acknowledges if it was an error requiring login
                        if (messageBox.type === 'error' && messageBox.message.includes('Authentication token not found')) {
                             navigate('/login');
                        }
                    }}
                />
            )}
        </div>
    );
}

export default CreateListingPage;
