// frontend/src/components/profile/MyListings.js
import React from 'react';
import { Link } from 'react-router-dom';

function MyListings({ userListings, handleCreateNewListing, handleEditUserListing, handleDeleteUserListing }) {
    return (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg shadow-inner">
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
                                    Posted On
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
                                        <Link to={`/item-details/${listing.resource_id}`} className="text-pink-600 hover:underline">
                                            {listing.name}
                                        </Link>
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
    );
}

export default MyListings;
