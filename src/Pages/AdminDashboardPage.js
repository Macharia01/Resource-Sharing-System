// frontend/src/pages/AdminDashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

// Import refactored components
import MessageBox from '../components/common/MessageBox';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import EditUserModal from '../components/admin/EditUserModal';
import EditResourceModal from '../components/admin/EditResourceModal';
import EditRequestStatusModal from '../components/admin/EditRequestStatusModal';
import ReportDetailsModal from '../components/admin/ReportDetailsModal';


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
    const [requests, setRequests] = useState([]); 
    const [reports, setReports] = useState([]); 
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState('dashboard');

    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState(null);

    const [isRequestStatusModalOpen, setIsRequestStatusModalOpen] = useState(false); 
    const [editingRequest, setEditingRequest] = useState(null); 

    const [isReportDetailsModalOpen, setIsReportDetailsModalOpen] = useState(false); 
    const [viewingReport, setViewingReport] = useState(null); 

    // State for search queries
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [listingSearchQuery, setListingSearchQuery] = useState('');
    const [requestSearchQuery, setRequestSearchQuery] = useState(''); 
    const [reportSearchQuery, setReportSearchQuery] = useState(''); 

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

    // Unified message box handler for convenience
    const showMessageBox = useCallback((message, type) => {
        setMessageBox({ show: true, message, type });
    }, []);


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

    // Function to fetch all requests
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

    // Function to fetch all reports
    const fetchReports = useCallback(async () => {
        if (activeView === 'reports') setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/reports', { 
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (!response.ok) {
                handleApiError(response.status, data.msg);
                return;
            }
            setReports(data);
        } catch (err) {
            console.error("AdminDashboardPage: Error fetching reports:", err);
            setError('An error occurred while fetching report data. Please try again.');
        } finally {
            if (activeView === 'reports') setLoading(false);
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
                    showMessageBox(data.msg, 'success');
                    setUsers(prevUsers => prevUsers.filter(user => user.user_id !== userId));
                    fetchAdminStats(); // Refresh stats after deletion
                } catch (err) {
                    console.error("Error deleting user:", err);
                    showMessageBox('An error occurred while deleting the user.', 'error');
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
                    showMessageBox(data.msg, 'success');
                    setResources(prevResources => prevResources.filter(resource => resource.resource_id !== resourceId));
                    fetchAdminStats(); // Refresh stats after deletion
                } catch (err) {
                    console.error("Error deleting resource:", err);
                    showMessageBox('An error occurred while deleting the listing.', 'error');
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
            showMessageBox(data.msg, 'success');
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
            showMessageBox('An error occurred while updating the user.', 'error');
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
            showMessageBox(data.msg, 'success');
            setResources(prevResources => prevResources.map(resource =>
                resource.resource_id === resourceId ? { ...resource, ...data.resource } : resource
            ));
            setIsResourceModalOpen(false);
            setEditingResource(null);
        } catch (err) {
            console.error("Error updating resource:", err);
            showMessageBox('An error occurred while updating the resource.', 'error');
        }
    };

    // Handlers for Request Management
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
            showMessageBox(data.msg, 'success');
            // Update the local requests state
            setRequests(prevRequests => prevRequests.map(req =>
                req.request_id === requestId ? { ...req, status: newStatus, updated_at: new Date().toISOString() } : req
            ));
            setIsRequestStatusModalOpen(false);
            setEditingRequest(null);
            fetchAdminStats(); // Refresh dashboard stats to update pending request count
        } catch (err) {
            console.error("Error updating request status:", err);
            showMessageBox('An error occurred while updating the request status.', 'error');
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
                    showMessageBox(data.msg, 'success');
                    setRequests(prevRequests => prevRequests.filter(req => req.request_id !== requestId));
                    fetchAdminStats(); // Refresh stats after deletion
                } catch (err) {
                    console.error("Error deleting request:", err);
                    showMessageBox('An error occurred while deleting the request.', 'error');
                }
            },
            onCancel: () => setConfirmDialog({ show: false, message: '', onConfirm: null })
        });
    };

    // Handlers for Report Management
    const handleViewReport = (report) => {
        setViewingReport(report);
        setIsReportDetailsModalOpen(true);
    };

    const handleUpdateReportStatus = async (reportId, newStatus) => {
        setError(null);
        try {
            const response = await fetch(`http://localhost:5000/api/reports/${reportId}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await response.json();
            if (!response.ok) {
                handleApiError(response.status, data.msg);
                return;
            }
            showMessageBox(data.msg, 'success');
            setReports(prevReports => prevReports.map(report =>
                report.report_id === reportId ? { 
                    ...report, 
                    status: newStatus,
                    resolved_at: newStatus !== 'Pending' ? new Date().toISOString() : null, 
                    resolved_by_username: currentUser.username // Assume current admin resolved it
                } : report
            ));
            fetchAdminStats(); // Update pending reports count
        } catch (err) {
            console.error("Error updating report status:", err);
            showMessageBox('An error occurred while updating the report status.', 'error');
        }
    };

    const handleBanUserFromReport = (userId, username) => {
        setConfirmDialog({
            show: true,
            message: `Are you sure you want to ban ${username}? This will restrict their access to the platform.`,
            onConfirm: async () => {
                setConfirmDialog({ show: false, message: '', onConfirm: null });
                setError(null);
                try {
                    const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/ban`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                    });
                    const data = await response.json();
                    if (!response.ok) {
                        handleApiError(response.status, data.msg);
                        return;
                    }
                    showMessageBox(data.msg, 'success');
                    fetchUsers(); // Refresh users list to reflect banned status immediately
                    setIsReportDetailsModalOpen(false); // Close report modal after banning
                    setViewingReport(null);
                } catch (err) {
                    console.error("Error banning user:", err);
                    showMessageBox('An error occurred while banning the user.', 'error');
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

    const filteredRequests = requests.filter(request => 
        request.resource_name.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
        request.requester_username.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
        request.owner_username.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
        request.status.toLowerCase().includes(requestSearchQuery.toLowerCase())
    );

    const filteredReports = reports.filter(report => 
        report.report_type.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
        report.reporter_username.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
        report.reported_username.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
        report.status.toLowerCase().includes(reportSearchQuery.toLowerCase())
    );


    useEffect(() => {
        if (loadingAuth) {
            return;
        }

        if (!currentUser || !localStorage.getItem('token')) {
            showMessageBox("You must be logged in to access the Admin Dashboard.", 'error');
            logout();
            navigate('/login');
            return;
        }

        if (currentUser.role !== 'admin') {
            showMessageBox('Access Denied: You do not have administrator privileges. Redirecting to home.', 'error');
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
        } else if (activeView === 'requests') { 
            fetchRequests();
        } else if (activeView === 'reports') { 
            fetchReports();
        }
    }, [currentUser, activeView, navigate, logout, fetchAdminStats, fetchUsers, fetchResources, fetchRequests, fetchReports, loadingAuth, showMessageBox]);


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
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
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
                    <button
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

                {activeView === 'requests' && ( 
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
                    <div>
                        <h3 className="text-2xl font-semibold text-white mb-6 text-center">All User Reports</h3>
                        {/* Search Input for Reports */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search reports by type, description, reporter, reported user, or status..."
                                value={reportSearchQuery}
                                onChange={(e) => setReportSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                        </div>
                        {loading ? ( 
                            <div className="text-white text-center py-10">
                                <p className="text-xl">Loading reports...</p>
                            </div>
                        ) : (
                            filteredReports.length > 0 ? (
                                <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Report Type
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Reported By
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Reported User
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Resource
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Reported At
                                                </th>
                                                <th scope="col" className="relative px-6 py-3">
                                                    <span className="sr-only">Actions</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredReports.map((report) => (
                                                <tr key={report.report_id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {report.report_type}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {report.reporter_username}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {report.reported_username}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {report.resource_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                        {report.status}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(report.reported_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => handleViewReport(report)}
                                                            className="text-pink-600 hover:text-pink-900 mr-4"
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-white text-center">No reports found matching your search criteria.</p>
                            )
                        )}
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

            {/* Request Status Edit Modal */}
            {isRequestStatusModalOpen && editingRequest && (
                <EditRequestStatusModal
                    request={editingRequest}
                    onClose={() => setIsRequestStatusModalOpen(false)}
                    onSave={handleUpdateRequestStatus}
                />
            )}

            {/* Report Details Modal */}
            {isReportDetailsModalOpen && viewingReport && (
                <ReportDetailsModal
                    report={viewingReport}
                    onClose={() => setIsReportDetailsModalOpen(false)}
                    onUpdateReportStatus={handleUpdateReportStatus}
                    onBanUser={handleBanUserFromReport}
                    onShowMessage={showMessageBox}
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
