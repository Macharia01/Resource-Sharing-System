// frontend/src/components/profile/RequestsSent.js
import React from 'react';
import RequestRow from './RequestRow'; // Import the reusable RequestRow

function RequestsSent({ sentRequests, onUpdateRequestStatus, currentUser }) {
    return (
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
                            {sentRequests.map(req => (
                                <RequestRow
                                    key={req.request_id}
                                    request={req}
                                    isSent={true} // This is a sent request
                                    onUpdateRequestStatus={onUpdateRequestStatus}
                                    currentUser={currentUser}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-gray-700 text-center">You haven't sent any borrow requests yet.</p>
            )}
        </div>
    );
}

export default RequestsSent;
