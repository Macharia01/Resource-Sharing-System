import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext'; 

// Custom Message Box Component (re-used for consistency)
const MessageBox = ({ message, type, onClose }) => {
    let bgColor = '';
    let textColor = '';
    switch (type) {
        case 'success':
            bgColor = 'bg-green-500';
            textColor = 'text-white';
            break;
        case 'error':
            bgColor = 'bg-red-500';
            textColor = 'text-white';
            break;
        case 'info':
            bgColor = 'bg-blue-500';
            textColor = 'text-white';
            break;
        default:
            bgColor = 'bg-gray-700';
            textColor = 'text-white';
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100]">
            <div className={`p-6 rounded-lg shadow-2xl ${bgColor} ${textColor} text-center max-w-sm mx-auto relative`}>
                <p className="text-lg font-semibold mb-4">{message}</p>
                <button
                    onClick={onClose}
                    className="mt-3 px-6 py-2 bg-white text-gray-800 rounded-md hover:bg-gray-100 transition-colors duration-200"
                >
                    OK
                </button>
            </div>
        </div>
    );
};

// Review Submission Modal
const ReviewModal = ({ resource, onSaveReview, onClose, hasExistingReview, relatedCompletedRequestId }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert('Please select a rating!'); 
            return;
        }
        onSaveReview({ relatedRequestId: relatedCompletedRequestId, rating, comment });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full relative my-8 text-gray-900">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-3xl font-bold p-1 rounded-full hover:bg-gray-200 transition-colors leading-none"
                    aria-label="Close modal"
                >
                    &times;
                </button>
                <h3 className="text-2xl font-bold text-pink-700 mb-6 text-center">Leave a Review for {resource.name}</h3>
                {hasExistingReview ? (
                    <p className="text-center text-red-600 mb-4">You have already submitted a review for this completed transaction.</p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Rating:</label>
                            <div className="flex justify-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={`w-8 h-8 cursor-pointer ${
                                            star <= rating ? 'text-yellow-500' : 'text-gray-300'
                                        }`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.683-1.532 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.777.565-1.832-.197-1.532-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
                                    </svg>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="comment" className="block text-gray-700 text-sm font-medium mb-1">Comment (Optional):</label>
                            <textarea
                                id="comment"
                                name="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows="4"
                                className="block w-full" // Minimal styling
                                placeholder="Share your experience..."
                            ></textarea>
                        </div>
                        <div className="flex justify-end space-x-4 mt-6">
                            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700">Submit Review</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};


// Borrow Request Modal
const BorrowRequestModal = ({ resource, onClose, onSubmitRequest }) => {
    const [pickupDate, setPickupDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [pickupMethod, setPickupMethod] = useState('Meetup'); // Default value
    const [messageToOwner, setMessageToOwner] = useState('');
    const [borrowLocation, setBorrowLocation] = useState(resource.location || ''); // Pre-fill with resource location

    const handleSubmit = (e) => {
        e.preventDefault();
        // Basic validation
        if (!pickupDate || !returnDate || !pickupMethod || !borrowLocation) {
            alert('Please fill in all required fields for the borrow request.');
            return;
        }
        if (new Date(pickupDate) > new Date(returnDate)) {
            alert('Return date cannot be before pickup date.');
            return;
        }

        onSubmitRequest({
            resourceId: resource.resource_id,
            pickupDate,
            returnDate,
            pickupMethod,
            messageToOwner,
            borrowLocation,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full relative my-8 text-gray-900">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-3xl font-bold p-1 rounded-full hover:bg-gray-200 transition-colors leading-none"
                    aria-label="Close modal"
                >
                    &times;
                </button>
                <h3 className="text-2xl font-bold text-pink-700 mb-6 text-center">Request to Borrow: {resource.name}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="pickupDate" className="block text-gray-700 text-sm font-medium mb-1">Pickup Date:</label>
                        <input type="date" id="pickupDate" name="pickupDate" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} required
                            className="block w-full" /> 
                    </div>
                    <div>
                        <label htmlFor="returnDate" className="block text-gray-700 text-sm font-medium mb-1">Return Date:</label>
                        <input type="date" id="returnDate" name="returnDate" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required
                            className="block w-full" /> 
                    </div>
                    <div>
                        <label htmlFor="pickupMethod" className="block text-gray-700 text-sm font-medium mb-1">Pickup Method:</label>
                        <select id="pickupMethod" name="pickupMethod" value={pickupMethod} onChange={(e) => setPickupMethod(e.target.value)} required
                            className="block w-full bg-white" > 
                            <option value="Meetup">Meetup</option>
                            <option value="Delivery">Delivery</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="borrowLocation" className="block text-gray-700 text-sm font-medium mb-1">Borrow Location:</label>
                        <input type="text" id="borrowLocation" name="borrowLocation" value={borrowLocation} onChange={(e) => setBorrowLocation(e.target.value)} required
                            className="block w-full" 
                            placeholder="e.g., Nairobi CBD, Owner's Address" /> 
                    </div>
                    <div>
                        <label htmlFor="messageToOwner" className="block text-gray-700 text-sm font-medium mb-1">Message to Owner (Optional):</label>
                        <textarea id="messageToOwner" name="messageToOwner" value={messageToOwner} onChange={(e) => setMessageToOwner(e.target.value)}
                            rows="3" className="block w-full"
                            placeholder="Any specific instructions or questions?"></textarea> 
                    </div>
                    <div className="flex justify-end space-x-4 mt-6">
                        <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700">Submit Request</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


function ItemDetailPage() {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const { currentUser, isLoggedIn, loadingAuth } = useAuth(); 
    
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [messageBox, setMessageBox] = useState({ show: false, message: '', type: '' });

    const [reviews, setReviews] = useState([]); 
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false); 
    const [canReview, setCanReview] = useState(false); 
    const [relatedCompletedRequestId, setRelatedCompletedRequestId] = useState(null); 
    const [hasExistingReview, setHasExistingReview] = useState(false); 

    const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        };
    }, []);

    const fetchItemDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:5000/api/resources/${id}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.msg || 'Failed to fetch item details.');
            }
            setItem(data);
        } catch (err) {
            console.error("Error fetching item details:", err);
            setError('Could not load item details. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchReviews = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/resources/${id}/reviews`);
            const data = await response.json();
            if (!response.ok) {
                if (response.status !== 404) { 
                    console.error("Failed to fetch reviews:", data.msg);
                }
                setReviews([]); 
                return;
            }
            setReviews(data);
        } catch (err) {
            console.error("Error fetching reviews:", err);
            setReviews([]); 
        }
    }, [id]);

    const checkReviewEligibility = useCallback(async () => {
        if (loadingAuth || !isLoggedIn || !currentUser || !id) { 
            console.log("DEBUG_REVIEW: Skipping eligibility check. Auth not ready or not logged in.");
            setCanReview(false);
            setHasExistingReview(false);
            setRelatedCompletedRequestId(null);
            return;
        }
        console.log("DEBUG_REVIEW: Starting eligibility check for user:", currentUser.id, " item:", id);

        try {
            const response = await fetch(`http://localhost:5000/api/requests/sent`, {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            console.log("DEBUG_REVIEW: Response from /api/requests/sent (full data):", data); 

            if (!response.ok) {
                console.error("DEBUG_REVIEW: Failed to fetch sent requests for review eligibility:", data.msg);
                setCanReview(false);
                setHasExistingReview(false);
                setRelatedCompletedRequestId(null);
                return;
            }

            debugger; // <--- Added debugger here for precise inspection
            // Find a completed request for this resource by the current user
            const completedRequest = data.find(
                (req) => {
                    const isResourceMatch = String(req.resource_id).trim() === String(id).trim();
                    const isRequesterMatch = String(req.requester_id).trim() === String(currentUser.id).trim();
                    const isStatusCompleted = req.status === 'Completed';

                    console.log(`DEBUG_FIND: Checking request_id: ${req.request_id}`);
                    console.log(`DEBUG_FIND:   Resource ID Match: ${isResourceMatch} (Req: '${String(req.resource_id).trim()}' vs Item: '${String(id).trim()}')`);
                    console.log(`DEBUG_FIND:   Requester ID Match: ${isRequesterMatch} (Req: '${String(req.requester_id).trim()}' vs CurrentUser: '${String(currentUser.id).trim()}')`);
                    console.log(`DEBUG_FIND:   Status Completed: ${isStatusCompleted} (Req: '${req.status}')`);
                    console.log(`DEBUG_FIND:   Overall Match: ${isResourceMatch && isRequesterMatch && isStatusCompleted}`);
                    
                    return isResourceMatch && isRequesterMatch && isStatusCompleted;
                }
            );
            console.log("DEBUG_REVIEW: Found completed request (after filter):", completedRequest);


            if (completedRequest) {
                // Check if a review already exists for this specific completed transaction
                const existingReviewCheck = await fetch(`http://localhost:5000/api/reviews/check-existing/${completedRequest.request_id}`, {
                    headers: getAuthHeaders(),
                });
                const existingReviewData = await existingReviewCheck.json();
                console.log("DEBUG_REVIEW: Existing review check response:", existingReviewData);

                if (existingReviewCheck.ok && existingReviewData.hasReview) {
                    console.log("DEBUG_REVIEW: User has existing review for this completed request.");
                    setCanReview(false);
                    setHasExistingReview(true); 
                    setRelatedCompletedRequestId(completedRequest.request_id);
                } else {
                    console.log("DEBUG_REVIEW: User is eligible to review.");
                    setCanReview(true);
                    setHasExistingReview(false);
                    setRelatedCompletedRequestId(completedRequest.request_id);
                }
            } else {
                console.log("DEBUG_REVIEW: No completed request found for this item by this user.");
                setCanReview(false);
                setHasExistingReview(false);
                setRelatedCompletedRequestId(null);
            }
        } catch (err) {
            console.error("DEBUG_REVIEW: Error checking review eligibility:", err);
            setCanReview(false);
            setHasExistingReview(false);
            setRelatedCompletedRequestId(null);
        }
    }, [isLoggedIn, currentUser, id, getAuthHeaders, loadingAuth]);


    const handleSaveReview = async ({ relatedRequestId, rating, comment }) => {
        try {
            const response = await fetch('http://localhost:5000/api/reviews', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ relatedRequestId, rating, comment }),
            });
            const data = await response.json();

            if (!response.ok) {
                setMessageBox({ show: true, message: data.msg || 'Failed to submit review.', type: 'error' });
                return;
            }

            setMessageBox({ show: true, message: 'Review submitted successfully!', type: 'success' });
            setIsReviewModalOpen(false); 
            fetchReviews(); 
            checkReviewEligibility(); 
        } catch (err) {
            console.error("Error submitting review:", err);
            setMessageBox({ show: true, message: 'An error occurred while submitting your review.', type: 'error' });
        }
    };

    const handleBorrowRequestSubmit = async (requestData) => {
        try {
            const response = await fetch('http://localhost:5000/api/requests', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(requestData),
            });
            const data = await response.json();

            if (!response.ok) {
                setMessageBox({ show: true, message: data.msg || 'Failed to submit borrow request.', type: 'error' });
                return;
            }

            setMessageBox({ show: true, message: data.msg, type: 'success' });
            setIsBorrowModalOpen(false); 
            fetchItemDetails(); 
        } catch (err) {
            console.error("Error submitting borrow request:", err);
            setMessageBox({ show: true, message: 'An error occurred while submitting your borrow request.', type: 'error' });
        }
    };


    useEffect(() => {
        fetchItemDetails();
        fetchReviews();
    }, [fetchItemDetails, fetchReviews]);

    useEffect(() => {
        if (!loadingAuth && item) { 
            checkReviewEligibility();
        }
    }, [loadingAuth, item, checkReviewEligibility]);

    
    if (loading || loadingAuth) { 
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <p className="text-xl">Loading item details and user session...</p>
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

    if (!item) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <p className="text-xl">Item not found.</p>
            </div>
        );
    }

    const isOwner = currentUser && item.owner_id && currentUser.id === item.owner_id;

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans py-16 px-6 md:px-20">
            <div className="max-w-4xl mx-auto bg-black bg-opacity-70 p-10 rounded-lg shadow-2xl border border-pink-700">
                <h2 className="text-3xl font-extrabold text-white text-center mb-8">
                    {item.name}
                </h2>

                <div className="flex flex-col md:flex-row gap-8 mb-8">
                    <div className="md:w-1/2">
                        {item.image_url ? (
                            <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-auto object-cover rounded-lg shadow-md"
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x300/4F46E5/FFFFFF?text=No+Image"; }} 
                            />
                        ) : (
                            <div className="w-full h-64 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 text-lg">
                                No Image Available
                            </div>
                        )}
                    </div>
                    <div className="md:w-1/2 space-y-4">
                        <p className="text-lg">
                            <strong className="text-pink-300">Category:</strong> {item.category}
                        </p>
                        <p className="text-lg">
                            <strong className="text-pink-300">Description:</strong> {item.description}
                        </p>
                        <p className="text-lg">
                            <strong className="text-pink-300">Location:</strong> {item.location}
                        </p>
                        <p className="text-lg">
                            <strong className="text-pink-300">Availability:</strong>{' '}
                            <span className={`font-semibold ${
                                item.availability_status?.toLowerCase() === 'available' ? 'text-green-400' : 
                                item.availability_status?.toLowerCase() === 'reserved' ? 'text-yellow-400' :
                                item.availability_status?.toLowerCase() === 'borrowed' ? 'text-blue-400' :
                                'text-gray-400'
                            }`}>
                                {item.availability_status || 'Unknown Status'} 
                            </span>
                        </p>
                        <p className="text-lg">
                            <strong className="text-pink-300">Posted by:</strong> {item.owner_username}
                        </p>
                        <p className="text-lg">
                            <strong className="text-pink-300">Posted on:</strong> {new Date(item.posted_at).toLocaleDateString()}
                        </p>

                        {/* Conditional "Request to Borrow" button */}
                        {isLoggedIn && !isOwner && item.availability_status === 'Available' && (
                            <button
                                onClick={() => setIsBorrowModalOpen(true)}
                                className="w-full py-3 px-6 bg-pink-600 text-white rounded-md font-semibold text-lg hover:bg-pink-700 transition-colors shadow-md"
                            >
                                Request to Borrow
                            </button>
                        )}
                        {/* Conditional "Leave a Review" button */}
                        {isLoggedIn && !isOwner && (canReview || hasExistingReview) && ( 
                            <button
                                onClick={() => setIsReviewModalOpen(true)}
                                className="w-full mt-4 py-3 px-6 bg-blue-600 text-white rounded-md font-semibold text-lg hover:bg-blue-700 transition-colors shadow-md"
                                disabled={hasExistingReview} 
                            >
                                {hasExistingReview ? 'Review Already Submitted' : 'Leave a Review'}
                            </button>
                        )}
                         {/* Message if not eligible to review */}
                         {isLoggedIn && !isOwner && !canReview && !hasExistingReview && (
                            <p className="text-center text-gray-400 mt-4 text-sm">
                                You can leave a review after successfully completing a borrow for this item.
                            </p>
                         )}
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="mt-12">
                    <h3 className="text-2xl font-bold text-white mb-6 text-center">Reviews</h3>
                    {reviews.length === 0 ? (
                        <p className="text-gray-400 text-center">No reviews yet for this item.</p>
                    ) : (
                        <div className="space-y-6">
                            {reviews.map((review) => (
                                <div key={review.review_id} className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                                    <div className="flex items-center mb-2">
                                        <div className="text-yellow-400 flex items-center">
                                            {[...Array(review.rating)].map((_, i) => (
                                                <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.683-1.532 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.777.565-1.832-.197-1.532-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
                                                </svg>
                                            ))}
                                            {[...Array(5 - review.rating)].map((_, i) => (
                                                <svg key={i + review.rating} className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.683-1.532 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.777.565-1.832-.197-1.532-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
                                                </svg>
                                            ))}
                                        </div>
                                        <p className="ml-3 text-gray-300 font-semibold">{review.reviewer_username || 'Anonymous User'}</p>
                                    </div>
                                    <p className="text-gray-200 text-base mb-2">{review.comment}</p>
                                    <p className="text-gray-500 text-sm">
                                        Reviewed on: {new Date(review.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            {isReviewModalOpen && item && currentUser && (
                <ReviewModal
                    resource={item}
                    onSaveReview={handleSaveReview}
                    onClose={() => setIsReviewModalOpen(false)}
                    hasExistingReview={hasExistingReview}
                    relatedCompletedRequestId={relatedCompletedRequestId}
                />
            )}

            {/* Borrow Request Modal */}
            {isBorrowModalOpen && item && currentUser && (
                <BorrowRequestModal
                    resource={item}
                    onClose={() => setIsBorrowModalOpen(false)}
                    onSubmitRequest={handleBorrowRequestSubmit}
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
        </div>
    );
}

export default ItemDetailPage;
