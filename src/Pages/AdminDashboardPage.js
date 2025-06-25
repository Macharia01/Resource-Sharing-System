import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

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


function AdminDashboardPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalResourcesListed: 0,
    pendingBorrowRequests: 0,
    reportsCount: 0,
    recentUserActivity: "Loading..."
  });
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  // State for search queries
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [listingSearchQuery, setListingSearchQuery] = useState('');


  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    };
  }, []);

  const handleApiError = useCallback((status, msg) => {
    if (status === 401 || status === 403) {
      setError('Session expired or unauthorized. Please log in again.');
      logout();
      navigate('/login');
    } else {
      setError(`Operation failed: ${msg || 'Unknown error'}`);
    }
  }, [logout, navigate]);

  const fetchAdminStats = useCallback(async () => {
    setLoading(true);
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
      console.error("Error fetching admin dashboard data:", err);
      setError('An error occurred while fetching admin data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, handleApiError]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
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
      console.error("Error fetching users:", err);
      setError('An error occurred while fetching user data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, handleApiError]);

  const fetchResources = useCallback(async () => {
    setLoading(true);
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
      console.error("Error fetching resources:", err);
      setError('An error occurred while fetching resource data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, handleApiError]);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
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
      alert(data.msg);
      setUsers(prevUsers => prevUsers.filter(user => user.user_id !== userId));
      fetchAdminStats();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError('An error occurred while deleting the user.');
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }
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
      alert(data.msg);
      setResources(prevResources => prevResources.filter(resource => resource.resource_id !== resourceId));
      fetchAdminStats();
    } catch (err) {
      console.error("Error deleting resource:", err);
      setError('An error occurred while deleting the listing.');
    }
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
      alert(data.msg);
      setUsers(prevUsers => prevUsers.map(user =>
        user.user_id === userId ? { ...user, ...data.user, first_name: data.user.first_name, last_name: data.user.last_name } : user
      ));
      setIsUserModalOpen(false);
      setEditingUser(null);
    } catch (err) {
      console.error("Error updating user:", err);
      setError('An error occurred while updating the user.');
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
      alert(data.msg);
      setResources(prevResources => prevResources.map(resource =>
        resource.resource_id === resourceId ? { ...resource, ...data.resource } : resource
      ));
      setIsResourceModalOpen(false);
      setEditingResource(null);
    } catch (err) {
      console.error("Error updating resource:", err);
      setError('An error occurred while updating the resource.');
    }
  };

  // Filtered data based on search queries
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const filteredResources = resources.filter(resource =>
    resource.name.toLowerCase().includes(listingSearchQuery.toLowerCase()) ||
    resource.description.toLowerCase().includes(listingSearchQuery.toLowerCase()) ||
    resource.category.toLowerCase().includes(listingSearchQuery.toLowerCase()) ||
    resource.owner_username.toLowerCase().includes(listingSearchQuery.toLowerCase())
  );


  useEffect(() => {
    if (!currentUser || !localStorage.getItem('token')) {
      navigate('/login');
      logout();
      return;
    }

    if (currentUser.role !== 'admin') {
      setError('Access Denied: You do not have administrator privileges.');
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
    }
  }, [currentUser, activeView, navigate, logout, fetchAdminStats, fetchUsers, fetchResources]);

  if (loading && activeView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <p className="text-xl">Loading Admin Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <p className="text-xl text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans py-16 px-6 md:px-20">
      <div className="max-w-6xl mx-auto bg-black bg-opacity-70 p-10 rounded-lg shadow-2xl border border-pink-700">
        <h2 className="text-3xl font-extrabold text-white text-center mb-8">
          ADMIN DASHBOARD
        </h2>

        {/* Top Navigation Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
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
            onClick={() => setActiveView('reports')}
            className={`py-3 px-6 rounded-md font-semibold text-lg transition-colors shadow-md ${activeView === 'reports' ? 'bg-pink-600 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
          >
            REPORTS
          </button>
        </div>

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
                <p className="text-gray-700 text-xl font-semibold">Reports Count</p>
                <p className="text-pink-600 text-4xl font-bold mt-2">{stats.reportsCount}</p>
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
                placeholder="Search users by username or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            {/* Corrected ternary structure */}
            {loading ? (
                 <div className="text-white text-center py-10">
                    <p className="text-xl">Loading users...</p>
                 </div>
            ) : ( // <-- Added this opening parenthesis for the 'false' branch of the 'loading' ternary
                filteredUsers.length > 0 ? (
                    <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Username
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
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                            {user.role}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEditUser(user)}
                                                className="text-pink-600 hover:text-pink-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.user_id)}
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
                    <p className="text-white text-center">No users found matching your search.</p>
                )
            )} {/* <-- Added this closing parenthesis for the 'false' branch of the 'loading' ternary */}
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
            {/* Corrected ternary structure */}
            {loading ? (
                <div className="text-white text-center py-10">
                    <p className="text-xl">Loading listings...</p>
                </div>
            ) : ( // <-- Added this opening parenthesis for the 'false' branch of the 'loading' ternary
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
            )} {/* <-- Added this closing parenthesis for the 'false' branch of the 'loading' ternary */}
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
    </div>
  );
}

export default AdminDashboardPage;