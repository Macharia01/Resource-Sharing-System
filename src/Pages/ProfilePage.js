import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const defaultProfilePic = "https://placehold.co/150x150/e0e0e0/555555?text=User";

// Custom Message Box Component (copied from ItemDetailPage for consistency)
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

// Custom Confirmation Modal Component
const ConfirmationDialog = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101]">
            <div className="bg-white p-8 rounded-lg shadow-2xl text-gray-900 text-center max-w-sm mx-auto relative">
                <p className="text-lg font-semibold mb-6">{message}</p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

// Inline Modal Component for Editing Resource (for the user's own listings)
function EditUserResourceModal({ resource, onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: resource.name || '',
        description: resource.description || '',
        category: resource.category || '',
        location: resource.location || '',
        availability_status: resource.availability_status || 'Available',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(resource.resource_id, formData); // Pass the resource ID and updated form data
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full relative my-8 max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-3xl font-bold p-1 rounded-full hover:bg-gray-200 transition-colors leading-none"
                    aria-label="Close modal"
                >
                    &times;
                </button>

                <h3 className="text-2xl font-bold text-pink-700 mb-6 text-center">Edit Listing: {resource.name}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="editResourceName" className="block text-gray-700 text-sm font-medium mb-1">Name</label>
                        <input type="text" id="editResourceName" name="name" value={formData.name} onChange={handleChange} required
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label htmlFor="editResourceDescription" className="block text-gray-700 text-sm font-medium mb-1">Description</label>
                        <textarea id="editResourceDescription" name="description" value={formData.description} onChange={handleChange} required
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 h-24 resize-y"></textarea>
                    </div>
                    <div>
                        <label htmlFor="editResourceCategory" className="block text-gray-700 text-sm font-medium mb-1">Category</label>
                        <input type="text" id="editResourceCategory" name="category" value={formData.category} onChange={handleChange} required
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label htmlFor="editResourceLocation" className="block text-gray-700 text-sm font-medium mb-1">Location</label>
                        <input type="text" id="editResourceLocation" name="location" value={formData.location} onChange={handleChange} required
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label htmlFor="editResourceStatus" className="block text-gray-700 text-sm font-medium mb-1">Availability Status</label>
                        <select id="editResourceStatus" name="availability_status" value={formData.availability_status} onChange={handleChange} required
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white">
                            <option value="Available">Available</option>
                            <option value="Reserved">Reserved</option>
                            <option value="Borrowed">Borrowed</option>
                            <option value="Donated">Donated</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-4 mt-6">
                        <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}


function ProfilePage() {
    const { currentUser, logout, setCurrentUser, loadingAuth } = useAuth();
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    // Username in local state as it can be edited, but currentUser.username is source of truth for display
    const [username, setUsername] = useState('');
    const [address, setAddress] = useState('');

    // `loading` is for the component's *own* data fetching, distinct from `loadingAuth`
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const [userListings, setUserListings] = useState([]);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);

    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState(null);

    const [activeTab, setActiveTab] = useState('profile');

    const [messageBox, setMessageBox] = useState({ show: false, message: '', type: '' });
    const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null });

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        };
    }, []);

    const populateFormFields = (data) => {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || '');
        setPhoneNumber(data.phone_number || '');
        setUsername(data.username || ''); // Populate local username state
        setAddress(data.address || '');
    };

    const fetchData = useCallback(async () => {
        setLoading(true); // Start loading for this component's data
        setError(null);

        const token = localStorage.getItem('token');
        if (!currentUser || !token) {
            // This case should ideally be caught by the outer useEffect, but remains a safeguard.
            // If we reach here without currentUser, it implies a very quick redirect scenario.
            setLoading(false); // Ensure loading is off even if we're redirecting
            return;
        }

        try {
            // Fetch User Profile
            const profileResponse = await fetch('http://localhost:5000/api/user/profile', {
                headers: getAuthHeaders(),
            });
            const profileData = await profileResponse.json();

            if (!profileResponse.ok) {
                if (profileResponse.status === 401 || profileResponse.status === 403) {
                    setMessageBox({ show: true, message: 'Session expired or unauthorized. Please log in again.', type: 'error' });
                    logout();
                    navigate('/login'); // Immediate redirect
                } else {
                    setError(`Failed to fetch profile: ${profileData.msg || 'Unknown error'}`);
                }
                setLoading(false);
                return;
            }
            populateFormFields(profileData); // Populate local state with fetched profile data
            // IMPORTANT: Removed setCurrentUser from here to prevent re-render loop.
            // AuthContext's currentUser is now considered stable after initial login/decode.

            // Fetch User Listings
            const listingsResponse = await fetch('http://localhost:5000/api/user/listings', {
                headers: getAuthHeaders(),
            });
            const listingsData = await listingsResponse.json();
            if (!listingsResponse.ok) {
                setError(`Failed to fetch listings: ${listingsData.msg || 'Unknown error'}`);
            } else {
                setUserListings(listingsData);
            }

            // Fetch Received Requests
            const receivedRequestsResponse = await fetch('http://localhost:5000/api/requests/received', {
                headers: getAuthHeaders(),
            });
            const receivedRequestsData = await receivedRequestsResponse.json();
            if (!receivedRequestsResponse.ok) {
                setError(`Failed to fetch received requests: ${receivedRequestsData.msg || 'Unknown error'}`);
            } else {
                setReceivedRequests(receivedRequestsData);
            }

            // Fetch Sent Requests
            const sentRequestsResponse = await fetch('http://localhost:5000/api/requests/sent', {
                headers: getAuthHeaders(),
            });
            const sentRequestsData = await sentRequestsResponse.json();
            if (!sentRequestsResponse.ok) {
                setError(`Failed to fetch sent requests: ${sentRequestsData.msg || 'Unknown error'}`);
            } else {
                setSentRequests(sentRequestsData);
            }

        } catch (err) {
            console.error("ProfilePage: Caught error during data fetch:", err);
            setError('An error occurred while fetching your data. Check console for details.');
        } finally {
            setLoading(false); // End loading for this component's data
        }
    }, [currentUser, logout, navigate, getAuthHeaders]); // Removed setCurrentUser from deps

    useEffect(() => {
        // Only attempt to fetch data if AuthContext has finished loading AND we have a currentUser
        if (!loadingAuth && currentUser) {
            fetchData();
        } else if (!loadingAuth && !currentUser) {
            // If auth is done loading and no current user, redirect
            setMessageBox({ show: true, message: "You need to be logged in to view this page.", type: 'info' });
            logout(); // Ensure token cleared, etc.
            navigate('/login');
        }
        // Disable body scroll when modals/messagebox are open
        if (isResourceModalOpen || messageBox.show || confirmDialog.show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [loadingAuth, currentUser, fetchData, isResourceModalOpen, messageBox.show, confirmDialog.show, logout, navigate]);


    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
            setMessageBox({ show: true, message: 'Not authenticated. Please log in.', type: 'error' });
            logout();
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/user/profile', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    phoneNumber,
                    username, // Use local state for username
                    address,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessageBox({ show: true, message: "Profile updated successfully!", type: 'success' });
                setIsEditing(false); // Exit edit mode

                // IMPORTANT: Only update currentUser in AuthContext for essential, globally used fields
                // if they have changed. Here, we update username as it's displayed in Layout.
                if (currentUser.username !== username) {
                    setCurrentUser(prevUser => ({
                        ...prevUser,
                        username: username // Update username in AuthContext
                    }));
                }
                fetchData(); // Re-fetch all data to ensure local state is fully synchronized
            } else {
                setError(`Update failed: ${data.msg || 'Unknown error'}`);
                setMessageBox({ show: true, message: `Update failed: ${data.msg || 'Unknown error'}`, type: 'error' });
            }
        } catch (err) {
            console.error("Network or fetch error during profile update:", err);
            setMessageBox({ show: true, message: 'An error occurred during profile update. Please try again.', type: 'error' });
        }
    };

    const handleLogout = () => {
        logout();
        // navigate('/login'); // Logout already navigates
    };

    const handleCreateNewListing = () => {
        navigate('/create-listing');
    };

    const handleEditUserListing = (resource) => {
        setEditingResource(resource);
        setIsResourceModalOpen(true);
    };

    const handleUpdateUserListing = async (resourceId, updatedData) => {
        setError(null);
        try {
            const response = await fetch(`http://localhost:5000/api/user/resources/${resourceId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedData),
            });
            const data = await response.json();
            if (!response.ok) {
                setMessageBox({ show: true, message: `Update failed: ${data.msg || 'Unknown error'}`, type: 'error' });
                return;
            }
            setMessageBox({ show: true, message: data.msg, type: 'success' });
            setUserListings(prevListings => prevListings.map(item =>
                item.resource_id === resourceId ? { ...item, ...data.resource } : item
            ));
            setIsResourceModalOpen(false);
            setEditingResource(null);
        } catch (err) {
            console.error("Error updating user listing:", err);
            setMessageBox({ show: true, message: 'An error occurred while updating your listing.', type: 'error' });
        }
    };

    const handleDeleteUserListing = (resourceId) => {
        setConfirmDialog({
            show: true,
            message: 'Are you sure you want to delete this listing? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmDialog({ show: false, message: '', onConfirm: null }); // Close dialog immediately
                setError(null);
                try {
                    const response = await fetch(`http://localhost:5000/api/user/resources/${resourceId}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders(),
                    });
                    const data = await response.json();
                    if (!response.ok) {
                        setMessageBox({ show: true, message: `Deletion failed: ${data.msg || 'Unknown error'}`, type: 'error' });
                        return;
                    }
                    setMessageBox({ show: true, message: data.msg, type: 'success' });
                    setUserListings(prevListings => prevListings.filter(item => item.resource_id !== resourceId));
                } catch (err) {
                    console.error("Error deleting user listing:", err);
                    setMessageBox({ show: true, message: 'An error occurred while deleting your listing.', type: 'error' });
                }
            },
            onCancel: () => setConfirmDialog({ show: false, message: '', onConfirm: null })
        });
    };

    // --- Request Management Handlers ---
    const handleUpdateRequestStatus = (requestId, newStatus) => {
        setConfirmDialog({
            show: true,
            message: `Are you sure you want to set this request status to '${newStatus}'?`,
            onConfirm: async () => {
                setConfirmDialog({ show: false, message: '', onConfirm: null });
                try {
                    const response = await fetch(`http://localhost:5000/api/requests/${requestId}/status`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ status: newStatus }),
                    });
                    const data = await response.json();
                    if (response.ok) {
                        setMessageBox({ show: true, message: data.msg, type: 'success' });
                        // Re-fetch all data to ensure lists are updated
                        fetchData();
                    } else {
                        setMessageBox({ show: true, message: `Failed to update request: ${data.msg || 'Unknown error'}`, type: 'error' });
                    }
                } catch (err) {
                    console.error("Error updating request status:", err);
                    setMessageBox({ show: true, message: 'An error occurred while updating request status.', type: 'error' });
                }
            },
            onCancel: () => setConfirmDialog({ show: false, message: '', onConfirm: null })
        });
    };

    // Helper to render request table rows
    const renderRequestRow = (request, isSent) => {
        const otherParty = isSent ? request.owner_username : request.requester_username;
        const otherPartyEmail = isSent ? request.owner_email : request.requester_email;
        const otherPartyPhone = isSent ? request.owner_phone_number : request.requester_phone_number;
        const otherPartyAddress = isSent ? request.owner_address : request.requester_address;

        return (
            <tr key={request.request_id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link to={`/item-details/${request.resource_id}`} className="text-pink-600 hover:underline">
                        {request.resource_name}
                    </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{otherParty}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{request.status}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{new Date(request.pickup_date).toLocaleDateString()}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{new Date(request.return_date).toLocaleDateString()}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex flex-col">
                        <span>{request.pickup_method}</span>
                        <span className="text-gray-500 text-xs">{request.borrow_location}</span>
                    </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 max-w-xs overflow-hidden text-ellipsis">{request.message_to_owner || 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex flex-col">
                        <span>{otherPartyEmail}</span>
                        <span>{otherPartyPhone || 'N/A'}</span>
                        <span>{otherPartyAddress || 'N/A'}</span>
                    </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    {/* Owner Actions */}
                    {!isSent && request.status === 'Pending' && (
                        <div className="flex flex-col space-y-2">
                            <button
                                onClick={() => handleUpdateRequestStatus(request.request_id, 'Accepted')}
                                className="px-3 py-1 bg-green-500 text-white rounded-md text-xs hover:bg-green-600 transition-colors"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => handleUpdateRequestStatus(request.request_id, 'Rejected')}
                                className="px-3 py-1 bg-red-500 text-white rounded-md text-xs hover:bg-red-600 transition-colors"
                            >
                                Reject
                            </button>
                        </div>
                    )}
                    {!isSent && request.status === 'Accepted' && (
                         <button
                            onClick={() => handleUpdateRequestStatus(request.request_id, 'Completed')}
                            className="px-3 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600 transition-colors"
                        >
                            Mark Completed
                        </button>
                    )}

                    {/* Requester Actions & General Cancel */}
                    {(isSent || (currentUser && currentUser.role === 'admin')) && 
                     (request.status === 'Pending' || request.status === 'Accepted') && (
                        <button
                            onClick={() => handleUpdateRequestStatus(request.request_id, 'Cancelled')}
                            className={`px-3 py-1 rounded-md text-xs transition-colors mt-2 ${isSent ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
                        >
                            Cancel
                        </button>
                    )}
                </td>
            </tr>
        );
    };
    // --- End Request Management Handlers ---

    // Initial loading state while AuthContext is still determining current user
    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <p className="text-xl">Checking authentication status...</p>
            </div>
        );
    }

    // After AuthContext has loaded, if there's no current user, this component should not render directly.
    // The useEffect above will handle the redirect.
    if (!currentUser) {
        return null; // Don't render anything if not authenticated, redirect will happen
    }


    if (loading) { // This `loading` state is for the component's *own* data fetching, after auth is confirmed
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <p className="text-xl">Loading profile data...</p>
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
            <div className="max-w-6xl mx-auto bg-white p-10 rounded-lg shadow-2xl text-gray-900">
                <h2 className="text-3xl font-bold text-center text-pink-700 mb-8">
                    User Profile: {currentUser.username}
                </h2>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 mb-8">
                    <button
                        className={`py-2 px-4 text-lg font-medium ${activeTab === 'profile' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        My Profile
                    </button>
                    <button
                        className={`ml-6 py-2 px-4 text-lg font-medium ${activeTab === 'my_listings' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('my_listings')}
                    >
                        My Listings
                    </button>
                    <button
                        className={`ml-6 py-2 px-4 text-lg font-medium ${activeTab === 'requests_received' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('requests_received')}
                    >
                        Requests Received ({receivedRequests.filter(req => req.status === 'Pending').length})
                    </button>
                    <button
                        className={`ml-6 py-2 px-4 text-lg font-medium ${activeTab === 'requests_sent' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('requests_sent')}
                    >
                        Requests Sent ({sentRequests.filter(req => req.status === 'Pending').length})
                    </button>
                </div>

                {activeTab === 'profile' && (
                    <div className="flex flex-col md:flex-row items-start md:items-stretch gap-12">
                        {/* Left Section: Profile Picture and Basic Info / Actions */}
                        <div className="md:w-1/3 flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg shadow-inner">
                            <img
                                src={defaultProfilePic}
                                alt="Profile"
                                className="w-32 h-32 rounded-full object-cover border-4 border-pink-600 mb-4 shadow-lg"
                            />
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{username || currentUser.username}</h3>
                            <p className="text-gray-600 text-lg">{currentUser.role || 'Member'}</p>
                            <div className="mt-6 flex flex-col space-y-3 w-full px-4">
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="px-6 py-2 bg-pink-600 text-white rounded-md font-semibold hover:bg-pink-700 transition-colors"
                                >
                                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="px-6 py-2 bg-gray-400 text-white rounded-md font-semibold hover:bg-gray-500 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>

                        {/* Right Section: Detailed Info or Edit Form */}
                        <div className="md:w-2/3 p-6 bg-gray-50 rounded-lg shadow-inner">
                            {isEditing ? (
                                // Edit Form
                                <form onSubmit={handleProfileUpdate} className="space-y-6">
                                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Edit Your Details</h3>
                                    <div>
                                        <label htmlFor="editFirstName" className="block text-gray-700 text-sm font-medium mb-1">First Name</label>
                                        <input
                                            id="editFirstName"
                                            name="firstName"
                                            type="text"
                                            required
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm text-gray-900 bg-white"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="editLastName" className="block text-gray-700 text-sm font-medium mb-1">Last Name</label>
                                        <input
                                            id="editLastName"
                                            name="lastName"
                                            type="text"
                                            required
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm text-gray-900 bg-white"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="editUsername" className="block text-gray-700 text-sm font-medium mb-1">Username</label>
                                        <input
                                            id="editUsername"
                                            name="username"
                                            type="text"
                                            required
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm text-gray-900 bg-white"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="editEmail" className="block text-gray-700 text-sm font-medium mb-1">Email Address</label>
                                        <input
                                            id="editEmail"
                                            name="email"
                                            type="email"
                                            required
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm text-gray-900 bg-white"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="editPhoneNumber" className="block text-gray-700 text-sm font-medium mb-1">Phone Number</label>
                                        <input
                                            id="editPhoneNumber"
                                            name="phoneNumber"
                                            type="tel"
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm text-gray-900 bg-white"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="editAddress" className="block text-gray-700 text-sm font-medium mb-1">Address</label>
                                        <input
                                            id="editAddress"
                                            name="address"
                                            type="text"
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm text-gray-900 bg-white"
                                            placeholder="Your physical address (optional)"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <button
                                            type="submit"
                                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                // View Mode - Display current details
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Your Information</h3>
                                    <p className="text-gray-700"><strong className="text-pink-600">Full Name:</strong> {firstName} {lastName}</p>
                                    <p className="text-gray-700"><strong className="text-pink-600">Username:</strong> {username}</p>
                                    <p className="text-gray-700"><strong className="text-pink-600">Email:</strong> {email}</p>
                                    <p className="text-gray-700"><strong className="text-pink-600">Phone:</strong> {phoneNumber || 'Not provided'}</p>
                                    <p className="text-gray-700"><strong className="text-pink-600">Address:</strong> {address || 'Not provided'}</p>
                                    <p className="text-gray-700"><strong className="text-pink-600">Role:</strong> {currentUser.role}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'my_listings' && (
                    <div className="mt-8 p-6 bg-gray-50 rounded-lg shadow-inner">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-semibold text-gray-800">My Listings</h3>
                            <button
                                onClick={handleCreateNewListing}
                                className="px-4 py-2 bg-pink-600 text-white rounded-md font-semibold hover:bg-pink-700 transition-colors"
                            >
                                + Create New Listing
                            </button>
                        </div>

                        {userListings.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Posted
                                            </th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {userListings.map((listing) => (
                                            <tr key={listing.resource_id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {listing.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {listing.category}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {listing.availability_status}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(listing.posted_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleEditUserListing(listing)}
                                                        className="text-pink-600 hover:text-pink-900 mr-4"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUserListing(listing.resource_id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-700 text-center">You haven't listed any items yet.</p>
                        )}
                    </div>
                )}

                {activeTab === 'requests_received' && (
                    <div className="mt-8 p-6 bg-gray-50 rounded-lg shadow-inner">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Requests for My Items</h3>
                        {receivedRequests.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pickup Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method/Location</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {receivedRequests.map(req => renderRequestRow(req, false))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-700 text-center">No borrow requests have been made for your items yet.</p>
                        )}
                    </div>
                )}

                {activeTab === 'requests_sent' && (
                    <div className="mt-8 p-6 bg-gray-50 rounded-lg shadow-inner">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">My Borrow Requests</h3>
                        {sentRequests.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pickup Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method/Location</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message Sent</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {sentRequests.map(req => renderRequestRow(req, true))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-700 text-center">You haven't sent any borrow requests yet.</p>
                        )}
                    </div>
                )}


            </div>

            {/* Resource Edit Modal for User Listings */}
            {isResourceModalOpen && editingResource && (
                <EditUserResourceModal
                    resource={editingResource}
                    onClose={() => setIsResourceModalOpen(false)}
                    onSave={handleUpdateUserListing}
                />
            )}

            {/* Message Box for Alerts */}
            {messageBox.show && (
                <MessageBox
                    message={messageBox.message}
                    type={messageBox.type}
                    onClose={() => setMessageBox({ ...messageBox, show: false })}
                />
            )}

            {/* Confirmation Dialog */}
            {confirmDialog.show && (
                <ConfirmationDialog
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={confirmDialog.onCancel}
                />
            )}
        </div>
    );
}

export default ProfilePage;
