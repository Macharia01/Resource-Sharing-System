import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { v4 as uuidv4 } from 'uuid'; // For generating notification IDs if needed, though backend handles this


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

// Custom Confirmation Modal Component (copied for consistency)
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

// Inline Modal Component for Editing User
function EditUserModal({ user, onClose, onSave }) {
    const [formData, setFormData] = useState({
        firstName: user.first_name || '', 
        lastName: user.last_name || '',   
        email: user.email || '',
        phoneNumber: user.phone_number || '', 
        username: user.username || '',
        address: user.address || '',
        role: user.role || 'member',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(user.user_id, formData); 
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full relative my-8">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-3xl font-bold p-1 rounded-full hover:bg-gray-200 transition-colors leading-none"
                    aria-label="Close modal"
                >
                    &times;
                </button>

                <h3 className="text-2xl font-bold text-pink-700 mb-6 text-center">Edit User: {user.username}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="editUserFirstName" className="block text-gray-700 text-sm font-medium mb-1">First Name</label>
                        <input type="text" id="editUserFirstName" name="firstName" value={formData.firstName} onChange={handleChange} required
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label htmlFor="editUserLastName" className="block text-gray-700 text-sm font-medium mb-1">Last Name</label>
                        <input type="text" id="editUserLastName" name="lastName" value={formData.lastName} onChange={handleChange} required
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label htmlFor="editUserUsername" className="block text-gray-700 text-sm font-medium mb-1">Username</label>
                        <input type="text" id="editUserUsername" name="username" value={formData.username} onChange={handleChange} required
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label htmlFor="editUserEmail" className="block text-gray-700 text-sm font-medium mb-1">Email</label>
                        <input type="email" id="editUserEmail" name="email" value={formData.email} onChange={handleChange} required
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label htmlFor="editUserPhoneNumber" className="block text-gray-700 text-sm font-medium mb-1">Phone Number</label>
                        <input type="tel" id="editUserPhoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label htmlFor="editUserAddress" className="block text-gray-700 text-sm font-medium mb-1">Address</label>
                        <input type="text" id="editUserAddress" name="address" value={formData.address} onChange={handleChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label htmlFor="editUserRole" className="block text-gray-700 text-sm font-medium mb-1">Role</label>
                        <select id="editUserRole" name="role" value={formData.role} onChange={handleChange} required
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white">
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
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

// Inline Modal Component for Editing Resource
function EditResourceModal({ resource, onClose, onSave }) {
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
        onSave(resource.resource_id, formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full relative my-8">
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

// Inline Modal Component for Request Status Update
function EditRequestStatusModal({ request, onClose, onSave }) {
    const [status, setStatus] = useState(request.status || 'Pending');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(request.request_id, status);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full relative my-8">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-3xl font-bold p-1 rounded-full hover:bg-gray-200 transition-colors leading-none"
                    aria-label="Close modal"
                >
                    &times;
                </button>

                <h3 className="text-2xl font-bold text-pink-700 mb-6 text-center">Update Request Status</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="requestStatus" className="block text-gray-700 text-sm font-medium mb-1">Status</label>
                        <select id="requestStatus" name="status" value={status} onChange={(e) => setStatus(e.target.value)} required
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white">
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Completed">Completed</option>
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


function AdminDashboardPage() {
    const { currentUser, logout, loadingAuth } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalUsers: 0,
        totalResourcesListed: 0,
        pendingBorrowRequests: 0,
        pendingUserReports: 0, 
        recentUserActivity: "Loading..."
    });
    const [users, setUsers] = useState([]);
    const [resources, setResources] = useState([]);
    const [requests, setRequests] = useState([]); // NEW: State for requests
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState('dashboard');

    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState(null);

    const [isRequestStatusModalOpen, setIsRequestStatusModalOpen] = useState(false); // NEW: Request status modal state
    const [editingRequest, setEditingRequest] = useState(null); // NEW: Request being edited


    // State for search queries
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [listingSearchQuery, setListingSearchQuery] = useState('');
    const [requestSearchQuery, setRequestSearchQuery] = useState(''); // NEW: Request search query

    const [messageBox, setMessageBox] = useState({ show: false, message: '', type: '' });
    const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null });


    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        };
    }, []);

    const handleApiError = useCallback((status, msg) => {
        if (status === 401 || status === 403) {
            setMessageBox({ show: true, message: 'Session expired or unauthorized. Please log in again.', type: 'error' });
            logout();
            navigate('/login');
        } else {
            setMessageBox({ show: true, message: `Operation failed: ${msg || 'Unknown error'}`, type: 'error' });
        }
    }, [logout, navigate]);

    const fetchAdminStats = useCallback(async () => {
        if (activeView === 'dashboard') setLoading(true); 
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/admin/dashboard-stats', {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (!response.ok) {
                handleApiError(response.status, data.msg);
                return;
            }
            setStats(data);
        } catch (err) {
            console.error("AdminDashboardPage: Error fetching admin dashboard data:", err);
            setError('An error occurred while fetching admin data. Please try again.');
        } finally {
            if (activeView === 'dashboard') setLoading(false);
        }
    }, [getAuthHeaders, handleApiError, activeView]); 


    const fetchUsers = useCallback(async () => {
        if (activeView === 'users') setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/admin/users', {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (!response.ok) {
                handleApiError(response.status, data.msg);
                return;
            }
            setUsers(data); 
        } catch (err) {
            console.error("AdminDashboardPage: Error fetching users:", err);
            setError('An error occurred while fetching user data. Please try again.');
        } finally {
            if (activeView === 'users') setLoading(false);
        }
    }, [getAuthHeaders, handleApiError, activeView]); 

    const fetchResources = useCallback(async () => {
        if (activeView === 'listings') setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/admin/resources', {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (!response.ok) {
                handleApiError(response.status, data.msg);
                return;
            }
            setResources(data);
        } catch (err) {
            console.error("AdminDashboardPage: Error fetching resources:", err);
            setError('An error occurred while fetching resource data. Please try again.');
        } finally {
            if (activeView === 'listings') setLoading(false);
        }
    }, [getAuthHeaders, handleApiError, activeView]); 

    // NEW: Function to fetch all requests
    const fetchRequests = useCallback(async () => {
        if (activeView === 'requests') setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/admin/requests', {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (!response.ok) {
                handleApiError(response.status, data.msg);
                return;
            }
            setRequests(data);
        } catch (err) {
            console.error("AdminDashboardPage: Error fetching requests:", err);
            setError('An error occurred while fetching request data. Please try again.');
        } finally {
            if (activeView === 'requests') setLoading(false);
        }
    }, [getAuthHeaders, handleApiError, activeView]);

    const handleDeleteUser = (userId) => {
        setConfirmDialog({
            show: true,
            message: 'Are you sure you want to delete this user? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmDialog({ show: false, message: '', onConfirm: null });
                setError(null);
                try {
                    const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders(),
                    });
                    const data = await response.json();
                    if (!response.ok) {
                        handleApiError(response.status, data.msg);
                        return;
                    }
                    setMessageBox({ show: true, message: data.msg, type: 'success' });
                    setUsers(prevUsers => prevUsers.filter(user => user.user_id !== userId));
                    fetchAdminStats(); // Refresh stats after deletion
                } catch (err) {
                    console.error("Error deleting user:", err);
                    setMessageBox({ show: true, message: 'An error occurred while deleting the user.', type: 'error' });
                }
            },
            onCancel: () => setConfirmDialog({ show: false, message: '', onConfirm: null })
        });
    };

    const handleDeleteResource = (resourceId) => {
        setConfirmDialog({
            show: true,
            message: 'Are you sure you want to delete this listing? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmDialog({ show: false, message: '', onConfirm: null });
                setError(null);
                try {
                    const response = await fetch(`http://localhost:5000/api/admin/resources/${resourceId}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders(),
                    });
                    const data = await response.json();
                    if (!response.ok) {
                        handleApiError(response.status, data.msg);
                        return;
                    }
                    setMessageBox({ show: true, message: data.msg, type: 'success' });
                    setResources(prevResources => prevResources.filter(resource => resource.resource_id !== resourceId));
                    fetchAdminStats(); // Refresh stats after deletion
                } catch (err) {
                    console.error("Error deleting resource:", err);
                    setMessageBox({ show: true, message: 'An error occurred while deleting the listing.', type: 'error' });
                }
            },
            onCancel: () => setConfirmDialog({ show: false, message: '', onConfirm: null })
        });
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleUpdateUser = async (userId, updatedData) => {
        setError(null);
        try {
            const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedData), 
            });
            const data = await response.json(); 
            if (!response.ok) {
                handleApiError(response.status, data.msg);
                return;
            }
            setMessageBox({ show: true, message: data.msg, type: 'success' });
            setUsers(prevUsers => prevUsers.map(user =>
                user.user_id === userId ? { 
                    ...user, 
                    first_name: data.user.firstName, 
                    last_name: data.user.lastName,
                    email: data.user.email,
                    phone_number: data.user.phoneNumber,
                    username: data.user.username,
                    address: data.user.address,
                    role: data.user.role,
                } : user
            ));
            setIsUserModalOpen(false);
            setEditingUser(null);
        } catch (err) {
            console.error("Error updating user:", err);
            setMessageBox({ show: true, message: 'An error occurred while updating the user.', type: 'error' });
        }
    };

    const handleEditResource = (resource) => {
        setEditingResource(resource);
        setIsResourceModalOpen(true);
    };

    const handleUpdateResource = async (resourceId, updatedData) => {
        setError(null);
        try {
            const response = await fetch(`http://localhost:5000/api/admin/resources/${resourceId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedData),
            });
            const data = await response.json();
            if (!response.ok) {
                handleApiError(response.status, data.msg);
                return;
            }
            setMessageBox({ show: true, message: data.msg, type: 'success' });
            setResources(prevResources => prevResources.map(resource =>
                resource.resource_id === resourceId ? { ...resource, ...data.resource } : resource
            ));
            setIsResourceModalOpen(false);
            setEditingResource(null);
        } catch (err) {
            console.error("Error updating resource:", err);
            setMessageBox({ show: true, message: 'An error occurred while updating the resource.', type: 'error' });
        }
    };

    // NEW: Handlers for Request Management
    const handleEditRequestStatus = (request) => {
        setEditingRequest(request);
        setIsRequestStatusModalOpen(true);
    };

    const handleUpdateRequestStatus = async (requestId, newStatus) => {
        setError(null);
        try {
            const response = await fetch(`http://localhost:5000/api/admin/requests/${requestId}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await response.json();
            if (!response.ok) {
                handleApiError(response.status, data.msg);
                return;
            }
            setMessageBox({ show: true, message: data.msg, type: 'success' });
            // Update the local requests state
            setRequests(prevRequests => prevRequests.map(req =>
                req.request_id === requestId ? { ...req, status: newStatus, updated_at: new Date().toISOString() } : req
            ));
            setIsRequestStatusModalOpen(false);
            setEditingRequest(null);
            fetchAdminStats(); // Refresh dashboard stats to update pending request count
        } catch (err) {
            console.error("Error updating request status:", err);
            setMessageBox({ show: true, message: 'An error occurred while updating the request status.', type: 'error' });
        }
    };

    const handleDeleteRequest = (requestId) => {
        setConfirmDialog({
            show: true,
            message: 'Are you sure you want to delete this request? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmDialog({ show: false, message: '', onConfirm: null });
                setError(null);
                try {
                    const response = await fetch(`http://localhost:5000/api/admin/requests/${requestId}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders(),
                    });
                    const data = await response.json();
                    if (!response.ok) {
                        handleApiError(response.status, data.msg);
                        return;
                    }
                    setMessageBox({ show: true, message: data.msg, type: 'success' });
                    setRequests(prevRequests => prevRequests.filter(req => req.request_id !== requestId));
                    fetchAdminStats(); // Refresh stats after deletion
                } catch (err) {
                    console.error("Error deleting request:", err);
                    setMessageBox({ show: true, message: 'An error occurred while deleting the request.', type: 'error' });
                }
            },
            onCancel: () => setConfirmDialog({ show: false, message: '', onConfirm: null })
        });
    };


    // Filtered data based on search queries
    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (user.first_name || '').toLowerCase().includes(userSearchQuery.toLowerCase()) || 
        (user.last_name || '').toLowerCase().includes(userSearchQuery.toLowerCase()) 
    );

    const filteredResources = resources.filter(resource =>
        resource.name.toLowerCase().includes(listingSearchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(listingSearchQuery.toLowerCase()) ||
        resource.category.toLowerCase().includes(listingSearchQuery.toLowerCase()) ||
        resource.owner_username.toLowerCase().includes(listingSearchQuery.toLowerCase())
    );

    const filteredRequests = requests.filter(request => // NEW: Filter requests
        request.resource_name.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
        request.requester_username.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
        request.owner_username.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
        request.status.toLowerCase().includes(requestSearchQuery.toLowerCase())
    );


    useEffect(() => {
        // Only proceed if authentication state is loaded
        if (loadingAuth) {
            return;
        }

        if (!currentUser || !localStorage.getItem('token')) {
            setMessageBox({ show: true, message: "You must be logged in to access the Admin Dashboard.", type: 'error' });
            logout();
            navigate('/login');
            return;
        }

        if (currentUser.role !== 'admin') {
            setMessageBox({ show: true, message: 'Access Denied: You do not have administrator privileges. Redirecting to home.', type: 'error' });
            setLoading(false); 
            setTimeout(() => navigate('/'), 3000);
            return;
        }

        // Fetch data based on activeView
        if (activeView === 'dashboard') {
            fetchAdminStats();
        } else if (activeView === 'users') {
            fetchUsers();
        } else if (activeView === 'listings') {
            fetchResources();
        } else if (activeView === 'requests') { // NEW: Fetch requests when Requests tab is active
            fetchRequests();
        }
        // No fetch for 'reports' yet
    }, [currentUser, activeView, navigate, logout, fetchAdminStats, fetchUsers, fetchResources, fetchRequests, loadingAuth]); // Added fetchRequests to dependencies


    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <p className="text-xl">Checking administrator privileges...</p>
            </div>
        );
    }

    if (!currentUser || currentUser.role !== 'admin') {
        return null; 
    }


    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans py-16 px-6 md:px-20">
            <div className="max-w-6xl mx-auto bg-black bg-opacity-70 p-10 rounded-lg shadow-2xl border border-pink-700">
                <h2 className="text-3xl font-extrabold text-white text-center mb-8">
                    ADMIN DASHBOARD
                </h2>

                {/* Top Navigation Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10"> {/* Changed to 5 columns */}
                    <button
                        onClick={() => setActiveView('dashboard')}
                        className={`py-3 px-6 rounded-md font-semibold text-lg transition-colors shadow-md ${activeView === 'dashboard' ? 'bg-pink-600 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                    >
                        DASHBOARD
                    </button>
                    <button
                        onClick={() => setActiveView('users')}
                        className={`py-3 px-6 rounded-md font-semibold text-lg transition-colors shadow-md ${activeView === 'users' ? 'bg-pink-600 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                    >
                        USER MANAGEMENT
                    </button>
                    <button
                        onClick={() => setActiveView('listings')}
                        className={`py-3 px-6 rounded-md font-semibold text-lg transition-colors shadow-md ${activeView === 'listings' ? 'bg-pink-600 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                    >
                        LISTING MANAGEMENT
                    </button>
                    <button // NEW: Requests Tab Button
                        onClick={() => setActiveView('requests')}
                        className={`py-3 px-6 rounded-md font-semibold text-lg transition-colors shadow-md ${activeView === 'requests' ? 'bg-pink-600 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                    >
                        REQUESTS
                    </button>
                    <button
                        onClick={() => setActiveView('reports')}
                        className={`py-3 px-6 rounded-md font-semibold text-lg transition-colors shadow-md ${activeView === 'reports' ? 'bg-pink-600 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                    >
                        REPORTS
                    </button>
                </div>

                {error && <p className="text-center text-red-400 mb-6">{error}</p>}

                {activeView === 'dashboard' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                                <p className="text-gray-700 text-xl font-semibold">Total Users</p>
                                <p className="text-pink-600 text-4xl font-bold mt-2">{stats.totalUsers}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                                <p className="text-gray-700 text-xl font-semibold">Total Resources Listed</p>
                                <p className="text-pink-600 text-4xl font-bold mt-2">{stats.totalResourcesListed}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                                <p className="text-gray-700 text-xl font-semibold">Pending Borrow Requests</p>
                                <p className="text-pink-600 text-4xl font-bold mt-2">{stats.pendingBorrowRequests}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                                <p className="text-gray-700 text-xl font-semibold">Recent User Activity</p>
                                <p className="text-pink-600 text-2xl font-bold mt-2">{stats.recentUserActivity}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                                <p className="text-gray-700 text-xl font-semibold">Pending User Reports</p> 
                                <p className="text-pink-600 text-4xl font-bold mt-2">{stats.pendingUserReports}</p> 
                            </div>
                        </div>
                    </>
                )}

                {activeView === 'users' && (
                    <div>
                        <h3 className="text-2xl font-semibold text-white mb-6 text-center">All Users</h3>
                        {/* Search Input for Users */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search users by username, email, first name, or last name..."
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                        </div>
                        {loading ? ( 
                            <div className="text-white text-center py-10">
                                <p className="text-xl">Loading users...</p>
                            </div>
                        ) : (
                            filteredUsers.length > 0 ? (
                                <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Username
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Full Name
                                                </th> 
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Role
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Joined
                                                </th>
                                                <th scope="col" className="relative px-6 py-3">
                                                    <span className="sr-only">Actions</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredUsers.map((user) => (
                                                <tr key={user.user_id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {user.username}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {user.first_name} {user.last_name} 
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {user.email}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                        {user.role}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(user.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        {/* Prevent editing/deleting own admin account if it's the last admin */}
                                                        {!(user.user_id === currentUser.id && user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) && (
                                                            <button
                                                                onClick={() => handleEditUser(user)}
                                                                className="text-pink-600 hover:text-pink-900 mr-4"
                                                            >
                                                                Edit
                                                            </button>
                                                        )}
                                                        {/* Prevent deleting own admin account */}
                                                        {user.user_id !== currentUser.id && (
                                                            <button
                                                                onClick={() => handleDeleteUser(user.user_id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-white text-center">No users found matching your search.</p>
                            )
                        )}
                    </div>
                )}

                {activeView === 'listings' && (
                    <div>
                        <h3 className="text-2xl font-semibold text-white mb-6 text-center">All Listings</h3>
                        {/* Search Input for Listings */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search listings by name, description, category, or owner..."
                                value={listingSearchQuery}
                                onChange={(e) => setListingSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                        </div>
                        {loading ? ( 
                            <div className="text-white text-center py-10">
                                <p className="text-xl">Loading listings...</p>
                            </div>
                        ) : (
                            filteredResources.length > 0 ? (
                                <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Owner
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Category
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Posted On
                                                </th>
                                                <th scope="col" className="relative px-6 py-3">
                                                    <span className="sr-only">Actions</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredResources.map((resource) => (
                                                <tr key={resource.resource_id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {resource.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {resource.owner_username}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {resource.category}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {resource.availability_status}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(resource.posted_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => handleEditResource(resource)}
                                                            className="text-pink-600 hover:text-pink-900 mr-4"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteResource(resource.resource_id)}
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
                                <p className="text-white text-center">No listings found matching your search.</p>
                            )
                        )}
                    </div>
                )}

                {activeView === 'requests' && ( // NEW: Requests Management Section
                    <div>
                        <h3 className="text-2xl font-semibold text-white mb-6 text-center">All Requests</h3>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search requests by resource name, requester, owner, or status..."
                                value={requestSearchQuery}
                                onChange={(e) => setRequestSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                        </div>
                        {loading ? (
                            <div className="text-white text-center py-10">
                                <p className="text-xl">Loading requests...</p>
                            </div>
                        ) : (
                            filteredRequests.length > 0 ? (
                                <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Resource
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Requester
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Owner
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Pickup Date
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Return Date
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Created At
                                                </th>
                                                <th scope="col" className="relative px-6 py-3">
                                                    <span className="sr-only">Actions</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredRequests.map((request) => (
                                                <tr key={request.request_id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {request.resource_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {request.requester_username}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {request.owner_username}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(request.pickup_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(request.return_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                        {request.status}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(request.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => handleEditRequestStatus(request)}
                                                            className="text-pink-600 hover:text-pink-900 mr-4"
                                                        >
                                                            Update Status
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRequest(request.request_id)}
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
                                <p className="text-white text-center">No requests found matching your search criteria.</p>
                            )
                        )}
                    </div>
                )}

                {activeView === 'reports' && (
                    <div className="text-white text-center py-10">
                        <h3 className="text-2xl font-semibold mb-4">Reports Section (Under Construction)</h3>
                        <p>Details about reported issues or feedback will appear here.</p>
                    </div>
                )}
            </div>

            {/* User Edit Modal */}
            {isUserModalOpen && editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setIsUserModalOpen(false)}
                    onSave={handleUpdateUser}
                />
            )}

            {/* Resource Edit Modal */}
            {isResourceModalOpen && editingResource && (
                <EditResourceModal
                    resource={editingResource}
                    onClose={() => setIsResourceModalOpen(false)}
                    onSave={handleUpdateResource}
                />
            )}

            {/* NEW: Request Status Edit Modal */}
            {isRequestStatusModalOpen && editingRequest && (
                <EditRequestStatusModal
                    request={editingRequest}
                    onClose={() => setIsRequestStatusModalOpen(false)}
                    onSave={handleUpdateRequestStatus}
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

export default AdminDashboardPage;
