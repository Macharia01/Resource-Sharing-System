import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const defaultProfilePic = "https://placehold.co/150x150/e0e0e0/555555?text=User";

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
  const { currentUser, logout, setCurrentUser } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [userListings, setUserListings] = useState([]);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    console.log('ProfilePage: getAuthHeaders - Retrieved token:', token ? 'Exists' : 'Does NOT exist');
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
    setUsername(data.username || '');
    setAddress(data.address || '');
  };

  useEffect(() => {
    let isMounted = true;
    console.log('ProfilePage: useEffect triggered.');

    // --- MOVED TOKEN RETRIEVAL HERE ---
    const token = localStorage.getItem('token');
    console.log('ProfilePage: Token at useEffect start:', token ? 'Exists' : 'Does NOT exist');
    // --- END MOVED TOKEN RETRIEVAL ---


    const fetchData = async () => {
      if (!isMounted) {
        console.log('ProfilePage: fetchData aborted, component unmounted.');
        return;
      }

      console.log('ProfilePage: Starting fetchData...');
      setLoading(true);
      setError(null);

      if (!currentUser && !token) {
        console.log('ProfilePage: No currentUser and no token, redirecting to login.');
        if (isMounted) {
          setLoading(false);
          logout();
          navigate('/login');
        }
        return;
      }
      if (!token) {
        console.log('ProfilePage: Token is missing, redirecting to login.');
        if (isMounted) {
          setError('No authentication token found. Please log in.');
          setLoading(false);
          logout();
          navigate('/login');
        }
        return;
      }
      console.log('ProfilePage: Token found, proceeding with fetch operations.');

      try {
        // --- Fetch User Profile ---
        console.log('ProfilePage: Fetching user profile...');
        const profileResponse = await fetch('http://localhost:5000/api/user/profile', {
          headers: getAuthHeaders(),
        });
        const profileData = await profileResponse.json();
        console.log('ProfilePage: Profile API response status:', profileResponse.status);
        console.log('ProfilePage: Profile API response data:', profileData);

        if (!isMounted) return;
        if (!profileResponse.ok) {
          if (profileResponse.status === 401 || profileResponse.status === 403) {
            setError('Session expired or unauthorized. Please log in again.');
            logout();
            navigate('/login');
          } else {
            setError(`Failed to fetch profile: ${profileData.msg || 'Unknown error'}`);
          }
          setLoading(false);
          return;
        }
        populateFormFields(profileData);
        setCurrentUser(prevUser => {
          if (
            prevUser?.firstName === profileData.first_name &&
            prevUser?.lastName === profileData.last_name &&
            prevUser?.email === profileData.email &&
            prevUser?.phoneNumber === profileData.phone_number &&
            prevUser?.username === profileData.username &&
            prevUser?.address === profileData.address &&
            prevUser?.role === profileData.role
          ) {
            return prevUser;
          }
          return {
            ...prevUser,
            firstName: profileData.first_name,
            lastName: profileData.last_name,
            phoneNumber: profileData.phone_number,
            address: profileData.address,
            username: profileData.username,
            email: profileData.email,
            role: profileData.role
          };
        });


        // --- Fetch User Listings ---
        console.log('ProfilePage: Fetching user listings...');
        const listingsResponse = await fetch('http://localhost:5000/api/user/listings', {
            headers: getAuthHeaders(),
        });
        const listingsData = await listingsResponse.json();
        console.log('ProfilePage: Listings API response status:', listingsResponse.status);
        console.log('ProfilePage: Listings API response data:', listingsData);


        if (!isMounted) return;
        if (!listingsResponse.ok) {
            if (listingsResponse.status === 401 || listingsResponse.status === 403) {
                setError('Session expired for listings. Please log in again.');
                logout();
                navigate('/login');
            } else {
                setError(`Failed to fetch listings: ${listingsData.msg || 'Unknown error'}`);
            }
            setLoading(false);
            return;
        }
        setUserListings(listingsData);

      } catch (err) {
        if (isMounted) {
          console.error("ProfilePage: Caught error during data fetch:", err);
          setError('An error occurred while fetching your data. Check console for details.');
        }
      } finally {
        if (isMounted) {
          console.log('ProfilePage: Setting loading to false.');
          setLoading(false);
        }
      }
    };

    // Now 'token' is defined in this scope
    if (token) {
        fetchData();
    } else {
        // If no token at all, means user isn't logged in, stop loading.
        setLoading(false);
    }
    
    return () => {
      isMounted = false;
      console.log('ProfilePage: useEffect cleanup - component unmounted.');
    };
  }, [currentUser, currentUser?.id, getAuthHeaders, logout, navigate, setCurrentUser]); // Keep currentUser in deps for ESLint

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated. Please log in.');
      logout();
      navigate('/login');
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
          username,
          address,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Profile updated successfully!");
        console.log("Profile update successful:", data);
        setCurrentUser(data.user);
        setIsEditing(false);
      } else {
        setError(`Update failed: ${data.msg || 'Unknown error'}`);
        console.error("Profile update error:", data);
      }
    } catch (err) {
      console.error("Network or fetch error during profile update:", err);
      setError('An error occurred during profile update. Please try again.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- User Listings Management Handlers ---
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
        setError(`Update failed: ${data.msg || 'Unknown error'}`);
        return;
      }
      alert(data.msg);
      setUserListings(prevListings => prevListings.map(item =>
        item.resource_id === resourceId ? { ...item, ...data.resource } : item
      ));
      setIsResourceModalOpen(false);
      setEditingResource(null);
    } catch (err) {
      console.error("Error updating user listing:", err);
      setError('An error occurred while updating your listing.');
    }
  };

  const handleDeleteUserListing = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/user/resources/${resourceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(`Deletion failed: ${data.msg || 'Unknown error'}`);
        return;
      }
      alert(data.msg);
      setUserListings(prevListings => prevListings.filter(item => item.resource_id !== resourceId));
    } catch (err) {
      console.error("Error deleting user listing:", err);
      setError('An error occurred while deleting your listing.');
    }
  };
  // --- End User Listings Management Handlers ---


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <p className="text-xl">Loading profile...</p>
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

  // Only render content if currentUser data is actually available and has a username
  if (!currentUser || !currentUser.username) {
    console.log('ProfilePage: currentUser not fully loaded or missing username, returning null for render.');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white p-10 rounded-lg shadow-2xl text-gray-900">
        <h2 className="text-3xl font-bold text-center text-pink-700 mb-8">
          User Profile
        </h2>

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
              <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* --- My Listings Section --- */}
        <div className="mt-12 p-8 bg-gray-50 rounded-lg shadow-inner">
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
        {/* --- End My Listings Section --- */}
      </div>

      {/* Resource Edit Modal for User Listings */}
      {isResourceModalOpen && editingResource && (
        <EditUserResourceModal
          resource={editingResource}
          onClose={() => setIsResourceModalOpen(false)}
          onSave={handleUpdateUserListing}
        />
      )}
    </div>
  );
}

export default ProfilePage;