// frontend/src/components/admin/EditRequestStatusModal.js
import React, { useState } from 'react';

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

export default EditRequestStatusModal;
