// frontend/src/components/admin/EditResourceModal.js
import React, { useState } from 'react';

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

export default EditResourceModal;
