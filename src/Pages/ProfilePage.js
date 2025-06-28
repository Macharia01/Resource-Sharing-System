// frontend/src/Pages/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

// Import common components
import MessageBox from '../components/common/MessageBox';
import ConfirmationDialog from '../components/common/ConfirmationDialog';

// Import profile-specific components
import ProfileDetails from '../components/profile/ProfileDetails';
import MyListings from '../components/profile/MyListings';
import RequestsReceived from '../components/profile/RequestsReceived';
import RequestsSent from '../components/profile/RequestsSent';
import EditUserResourceModal from '../components/profile/EditUserResourceModal';

function ProfilePage() {
    const { currentUser, logout, setCurrentUser, loadingAuth } = useAuth();
    const navigate = useNavigate();

    // Profile Details state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [username, setUsername] = useState('');
    const [address, setAddress] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Data for tabs
    const [userListings, setUserListings] = useState([]);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);

    // Modal states
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState(null);

    // Component-wide states
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true); // For this component's data fetching
    const [error, setError] = useState(null);

    // Message/Confirmation dialog states
    const [messageBox, setMessageBox] = useState({ show: false, message: '', type: '' });
    const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null });

    // Helper to get auth headers
    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        };
    }, []);

    // Populates local state from fetched user data
    const populateFormFields = useCallback((data) => {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || '');
        setPhoneNumber(data.phone_number || '');
        setUsername(data.username || '');
        setAddress(data.address || '');
    }, []);

    // Main data fetching function
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (!currentUser) {
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessageBox({ show: true, message: 'Authentication token missing. Please log in.', type: 'error' });
                logout();
                navigate('/login');
                return;
            }

            // Fetch User Profile
            const profileResponse = await fetch('http://localhost:5000/api/user/profile', {
                headers: getAuthHeaders(),
            });
            const profileData = await profileResponse.json();

            if (!profileResponse.ok) {
                if (profileResponse.status === 401 || profileResponse.status === 403) {
                    setMessageBox({ show: true, message: 'Session expired or unauthorized. Please log in again.', type: 'error' });
                    logout();
                    navigate('/login');
                } else {
                    setError(`Failed to fetch profile: ${profileData.msg || 'Unknown error'}`);
                }
                setLoading(false);
                return;
            }
            populateFormFields(profileData);

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
            setLoading(false);
        }
    }, [currentUser, logout, navigate, getAuthHeaders, populateFormFields]); // Added populateFormFields to deps


    // useEffect for initial data load and authentication check
    useEffect(() => {
        if (!loadingAuth && currentUser) {
            fetchData();
        } else if (!loadingAuth && !currentUser) {
            setMessageBox({ show: true, message: "You need to be logged in to view this page.", type: 'info' });
            logout();
            navigate('/login');
        }
        // Handle body scroll locking for modals/messagebox
        if (isResourceModalOpen || messageBox.show || confirmDialog.show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [loadingAuth, currentUser, fetchData, isResourceModalOpen, messageBox.show, confirmDialog.show, logout, navigate]);


    // Handlers for Profile Details
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/user/profile', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    firstName, lastName, email, phoneNumber, username, address,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setMessageBox({ show: true, message: "Profile updated successfully!", type: 'success' });
                setIsEditing(false);
                if (currentUser.username !== username) {
                    setCurrentUser(prevUser => ({
                        ...prevUser,
                        username: username 
                    }));
                }
                fetchData(); // Re-fetch all data to ensure local state is fully synchronized
            } else {
                setMessageBox({ show: true, message: `Update failed: ${data.msg || 'Unknown error'}`, type: 'error' });
            }
        } catch (err) {
            console.error("Network or fetch error during profile update:", err);
            setMessageBox({ show: true, message: 'An error occurred during profile update. Please try again.', type: 'error' });
        }
    };

    const handleLogout = useCallback(() => {
        logout();
    }, [logout]);


    // Handlers for My Listings
    const handleCreateNewListing = useCallback(() => {
        navigate('/create-listing');
    }, [navigate]);

    const handleEditUserListing = useCallback((resource) => {
        setEditingResource(resource);
        setIsResourceModalOpen(true);
    }, []);

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
            // Optimistically update list without full re-fetch for faster UI feedback
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

    const handleDeleteUserListing = useCallback((resourceId) => {
        setConfirmDialog({
            show: true,
            message: 'Are you sure you want to delete this listing? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmDialog({ show: false, message: '', onConfirm: null });
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
    }, [getAuthHeaders]);


    // Handlers for Request Management
    const handleUpdateRequestStatus = useCallback((requestId, newStatus) => {
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
                        fetchData(); // Re-fetch all data to ensure lists are fully updated after request status change
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
    }, [getAuthHeaders, fetchData]);


    // Render loading/error states for the page
    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <p className="text-xl">Checking authentication status...</p>
            </div>
        );
    }

    if (!currentUser) {
        return null; // Will be redirected by useEffect if not authenticated
    }

    if (loading) { 
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
                <div className="flex border-b border-gray-200 mb-8 overflow-x-auto"> {/* Added overflow-x-auto for responsiveness */}
                    <button
                        className={`py-2 px-4 text-lg font-medium whitespace-nowrap ${activeTab === 'profile' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        My Profile
                    </button>
                    <button
                        className={`ml-6 py-2 px-4 text-lg font-medium whitespace-nowrap ${activeTab === 'my_listings' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('my_listings')}
                    >
                        My Listings
                    </button>
                    <button
                        className={`ml-6 py-2 px-4 text-lg font-medium whitespace-nowrap ${activeTab === 'requests_received' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('requests_received')}
                    >
                        Requests Received ({receivedRequests.filter(req => req.status === 'Pending').length})
                    </button>
                    <button
                        className={`ml-6 py-2 px-4 text-lg font-medium whitespace-nowrap ${activeTab === 'requests_sent' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('requests_sent')}
                    >
                        Requests Sent ({sentRequests.filter(req => req.status === 'Pending').length})
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'profile' && (
                    <ProfileDetails
                        currentUser={currentUser}
                        firstName={firstName}
                        lastName={lastName}
                        email={email}
                        phoneNumber={phoneNumber}
                        username={username}
                        address={address}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        handleProfileUpdate={handleProfileUpdate}
                        handleLogout={handleLogout}
                        setFirstName={setFirstName}
                        setLastName={setLastName}
                        setEmail={setEmail}
                        setPhoneNumber={setPhoneNumber}
                        setUsername={setUsername}
                        setAddress={setAddress}
                    />
                )}

                {activeTab === 'my_listings' && (
                    <MyListings
                        userListings={userListings}
                        handleCreateNewListing={handleCreateNewListing}
                        handleEditUserListing={handleEditUserListing}
                        handleDeleteUserListing={handleDeleteUserListing}
                    />
                )}

                {activeTab === 'requests_received' && (
                    <RequestsReceived
                        receivedRequests={receivedRequests}
                        onUpdateRequestStatus={handleUpdateRequestStatus}
                        currentUser={currentUser} // Pass currentUser for role checks in RequestRow
                    />
                )}

                {activeTab === 'requests_sent' && (
                    <RequestsSent
                        sentRequests={sentRequests}
                        onUpdateRequestStatus={handleUpdateRequestStatus}
                        currentUser={currentUser} // Pass currentUser for role checks in RequestRow
                    />
                )}

            </div>

            {/* Modals and Dialogs */}
            {isResourceModalOpen && editingResource && (
                <EditUserResourceModal
                    resource={editingResource}
                    onClose={() => setIsResourceModalOpen(false)}
                    onSave={handleUpdateUserListing}
                />
            )}

            {messageBox.show && (
                <MessageBox
                    message={messageBox.message}
                    type={messageBox.type}
                    onClose={() => setMessageBox({ ...messageBox, show: false })}
                />
            )}

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
