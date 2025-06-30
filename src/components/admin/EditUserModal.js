// frontend/src/components/admin/EditUserModal.js
import React, { useState } from 'react';

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
        // CRITICAL FIX: Ensure is_banned is always sent as a boolean
        isBanned: typeof user.is_banned === 'boolean' ? user.is_banned : false, 
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        // For checkboxes or specific boolean inputs, you might handle differently.
        // For text inputs like these, direct value is fine.
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Special handler for isBanned checkbox (if you add one later)
    // For now, we are just passing the existing boolean status.
    // If you want to make it editable, you'd add a checkbox and this logic:
    // const handleBannedChange = (e) => {
    //     setFormData(prev => ({ ...prev, isBanned: e.target.checked }));
    // };

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
                    {/* Add a hidden input or checkbox for isBanned if you want to explicitly control it in the UI */}
                    {/* For now, it will just pass the initial state derived from user.is_banned */}
                    {/* You could add a visible checkbox like this: */}
                    {/* <div className="flex items-center">
                        <input 
                            type="checkbox" 
                            id="editUserIsBanned" 
                            name="isBanned" 
                            checked={formData.isBanned} 
                            onChange={handleBannedChange} 
                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                        />
                        <label htmlFor="editUserIsBanned" className="ml-2 block text-sm text-gray-900">
                            Is Banned
                        </label>
                    </div>
                    */}
                    <div className="flex justify-end space-x-4 mt-6">
                        <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditUserModal;
