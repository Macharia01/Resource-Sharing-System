// frontend/src/components/profile/ProfileDetails.js
import React from 'react';

const defaultProfilePic = "https://placehold.co/150x150/e0e0e0/555555?text=User";

function ProfileDetails({
    currentUser,
    firstName,
    lastName,
    email,
    phoneNumber,
    username,
    address,
    isEditing,
    setIsEditing,
    handleProfileUpdate,
    handleLogout,
    setFirstName,
    setLastName,
    setEmail,
    setPhoneNumber,
    setUsername,
    setAddress
}) {
    return (
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
    );
}

export default ProfileDetails;
