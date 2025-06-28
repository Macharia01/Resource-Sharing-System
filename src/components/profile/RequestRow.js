// frontend/src/components/profile/RequestRow.js
import React from 'react';
import { Link } from 'react-router-dom';

function RequestRow({ request, isSent, onUpdateRequestStatus, currentUser }) {
    const otherParty = isSent ? request.owner_username : request.requester_username;
    const otherPartyEmail = isSent ? request.owner_email : request.requester_email;
    const otherPartyPhone = isSent ? request.owner_phone_number : request.requester_phone_number;
    const otherPartyAddress = isSent ? request.owner_address : request.requester_address;

    return (
        <tr className="border-b border-gray-200 hover:bg-gray-50">
            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                <Link to={`/item-details/${request.resource_id}`} className="text-pink-600 hover:underline">
                    {request.resource_name}
                </Link>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{otherParty}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{request.status}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{new Date(request.pickup_date).toLocaleDateString()}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{new Date(request.return_date).toLocaleDateString()}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                <div className="flex flex-col">
                    <span>{request.pickup_method}</span>
                    <span className="text-gray-500 text-xs">{request.borrow_location}</span>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-700 max-w-xs overflow-hidden text-ellipsis">{request.message_to_owner || 'N/A'}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                <div className="flex flex-col">
                    <span>{otherPartyEmail}</span>
                    <span>{otherPartyPhone || 'N/A'}</span>
                    <span>{otherPartyAddress || 'N/A'}</span>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                {/* Owner Actions */}
                {!isSent && request.status === 'Pending' && (
                    <div className="flex flex-col space-y-2">
                        <button
                            onClick={() => onUpdateRequestStatus(request.request_id, 'Accepted')}
                            className="px-3 py-1 bg-green-500 text-white rounded-md text-xs hover:bg-green-600 transition-colors"
                        >
                            Accept
                        </button>
                        <button
                            onClick={() => onUpdateRequestStatus(request.request_id, 'Rejected')}
                            className="px-3 py-1 bg-red-500 text-white rounded-md text-xs hover:bg-red-600 transition-colors"
                        >
                            Reject
                        </button>
                    </div>
                )}
                {!isSent && request.status === 'Accepted' && (
                        <button
                            onClick={() => onUpdateRequestStatus(request.request_id, 'Completed')}
                            className="px-3 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600 transition-colors"
                        >
                            Mark Completed
                        </button>
                )}

                {/* Requester Actions & General Cancel */}
                {(isSent || (currentUser && currentUser.role === 'admin')) && 
                    (request.status === 'Pending' || request.status === 'Accepted') && (
                        <button
                            onClick={() => onUpdateRequestStatus(request.request_id, 'Cancelled')}
                            className={`px-3 py-1 rounded-md text-xs transition-colors mt-2 ${isSent ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
                        >
                            Cancel
                        </button>
                )}
            </td>
        </tr>
    );
}

export default RequestRow;
