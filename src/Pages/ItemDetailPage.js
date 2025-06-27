import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext'; // Assuming AuthContext provides `currentUser`

// Custom Message Box Component
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

// Star Rating Component (reusable)
const StarRating = ({ rating, setRating, editable = false }) => {
    return (
        <div className="flex justify-center items-center my-2">
            {[...Array(5)].map((star, index) => {
                index += 1;
                return (
                    <button
                        type="button"
                        key={index}
                        className={`text-3xl ${index <= rating ? "text-yellow-400" : "text-gray-300"} ${editable ? "cursor-pointer" : "cursor-default"}`}
                        onClick={() => editable && setRating(index)}
                        onMouseEnter={() => {}}
                        onMouseLeave={() => {}}
                    >
                        &#9733; {/* Unicode star character */}
                    </button>
                );
            })}
        </div>
    );
};


function ItemDetailPage() {
    const { id } = useParams();
    const [resource, setResource] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { currentUser, logout } = useAuth(); // `currentUser` might be null initially
    const navigate = useNavigate();

    // State to explicitly track if the current user is the owner
    const [isCurrentUserOwner, setIsCurrentUserOwner] = useState(false);

    // Borrow Request States
    const [showBorrowForm, setShowBorrowForm] = useState(false);
    const [pickupDate, setPickupDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [pickupMethod, setPickupMethod] = useState('');
    const [messageToOwner, setMessageToOwner] = useState('');
    const [borrowLocation, setBorrowLocation] = useState('');
    const [requestSending, setRequestSending] = useState(false);

    // Reviews States
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewsError, setReviewsError] = useState(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(0); // 1-5 stars
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    // Stores the specific completed request that is eligible for review by this user
    const [eligibleRequestForReview, setEligibleRequestForReview] = useState(null); 

    // Message Box State
    const [messageBox, setMessageBox] = useState({ show: false, message: '', type: '' });

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        };
    }, []);

    // Effect to fetch resource details
    useEffect(() => {
        const fetchResourceDetails = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`http://localhost:5000/api/resources/${id}`);

                if (!response.ok) {
                    const errData = await response.json();
                    if (response.status === 404) {
                        setError(`Resource not found: ${errData.msg}`);
                    } else if (response.status === 401 || response.status === 403) {
                        setMessageBox({ show: true, message: 'Session expired or unauthorized. Please log in again.', type: 'error' });
                        logout();
                        navigate('/login');
                    } else {
                        setError(`Failed to fetch resource details: ${errData.msg || 'Unknown error'}`);
                    }
                    return;
                }

                const data = await response.json();
                setResource(data);
                setBorrowLocation(data.location); // Set initial borrow location from item data
            } catch (err) {
                console.error("Error fetching item details:", err);
                setError(err.message || 'An error occurred while fetching item details.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchResourceDetails();
        } else {
            setError('No resource ID provided.');
            setLoading(false);
        }
    }, [id, logout, navigate, getAuthHeaders]);


    // NEW/IMPROVED EFFECT: Determine if currentUser is the owner, ensuring both are loaded
    useEffect(() => {
        // Ensure both currentUser and resource are loaded and have their respective ID properties
        if (currentUser && currentUser.id && resource && resource.owner_id) {
            // Convert both IDs to lowercase for case-insensitive comparison (UUIDs are case-insensitive)
            const isOwner = currentUser.id.toLowerCase() === resource.owner_id.toLowerCase();
            setIsCurrentUserOwner(isOwner);

            // Debugging logs for this specific issue
            console.log('--- isCurrentUserOwner Debug ---');
            console.log('currentUser.id:', currentUser.id);
            console.log('resource.owner_id:', resource.owner_id);
            console.log('isOwner (calculated in useEffect):', isOwner);
            console.log('--- End isCurrentUserOwner Debug ---');

        } else {
            // If either is not fully loaded or doesn't have an ID, assume not owner (or still loading)
            setIsCurrentUserOwner(false);
        }
    }, [currentUser, resource]); // Re-run when currentUser or resource changes


    // Effect to fetch reviews for the resource
    const fetchReviews = useCallback(async () => {
        setReviewsLoading(true);
        setReviewsError(null);
        try {
            const response = await fetch(`http://localhost:5000/api/resources/${id}/reviews`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to fetch reviews: ${errorData.msg || response.statusText}`);
            }
            const data = await response.json();
            setReviews(data);
        } catch (err) {
            console.error("Error fetching reviews:", err);
            setReviewsError('Failed to load reviews.');
        } finally {
            setReviewsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchReviews();
        }
    }, [id, fetchReviews]);


    // Effect to determine if the current user can submit a review
    useEffect(() => {
        const checkReviewEligibility = async () => {
            // First, ensure all necessary data is loaded, user is logged in, and user is NOT the owner
            if (!currentUser || !resource || reviewsLoading || isCurrentUserOwner) { // Use new state variable here
                setEligibleRequestForReview(null); 
                return; 
            }

            try {
                // Fetch requests sent by the current user
                const response = await fetch('http://localhost:5000/api/requests/sent', {
                    headers: getAuthHeaders()
                });
                if (!response.ok) {
                    console.error('Failed to fetch sent requests to check review eligibility.');
                    setEligibleRequestForReview(null);
                    return;
                }
                const requests = await response.json();

                // Find a completed request by the current user (requester_id) for THIS specific resource
                const completedReq = requests.find(req => 
                    req.resource_id === id && 
                    req.status === 'Completed' &&
                    req.requester_id === currentUser.id // Explicitly ensure current user is the requester
                );

                if (completedReq) {
                    // Check if a review for this specific completed request already exists
                    const existingReview = reviews.find(review => 
                        review.related_request_id === completedReq.request_id &&
                        review.reviewer_id === currentUser.id // Explicitly ensure the existing review is by the current user
                    );

                    if (!existingReview) {
                        setEligibleRequestForReview(completedReq); 
                    } else {
                        setEligibleRequestForReview(null); 
                    }
                } else {
                    setEligibleRequestForReview(null); 
                }

            } catch (err) {
                console.error("Error checking review eligibility:", err);
                setEligibleRequestForReview(null);
            }
        };

        if (currentUser && resource && id && !reviewsLoading) { // Only run if reviews are done loading too
            checkReviewEligibility();
        }
    }, [currentUser, resource, id, reviews, reviewsLoading, isCurrentUserOwner, getAuthHeaders]); // Add isCurrentUserOwner to deps


    // Effect to control body overflow when modals are open
    useEffect(() => {
        if (showBorrowForm || showReviewForm || messageBox.show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showBorrowForm, showReviewForm, messageBox.show]);


    // Handler for submitting borrow request
    const handleSubmitBorrowRequest = async (e) => {
        e.preventDefault();

        // This check ensures the form cannot be submitted by an owner, even if the button somehow appeared enabled.
        if (isCurrentUserOwner) { // Use the dedicated state variable
            setMessageBox({ show: true, message: "You cannot borrow your own item.", type: 'info' });
            setShowBorrowForm(false); 
            return;
        }

        if (!currentUser) {
            setMessageBox({ show: true, message: "You must be logged in to submit a borrow request.", type: 'error' });
            navigate('/login');
            return;
        }

        setRequestSending(true);
        setError(null); 

        const token = localStorage.getItem('token');
        if (!token) {
            setMessageBox({ show: true, message: "Authentication token missing. Please log in.", type: 'error' });
            setRequestSending(false);
            logout();
            navigate('/login');
            return;
        }

        const requestData = {
            resourceId: resource.resource_id,
            pickupDate,
            returnDate,
            pickupMethod,
            messageToOwner,
            borrowLocation
        };

        try {
            const response = await fetch('http://localhost:5000/api/requests', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(requestData),
            });

            const data = await response.json();

            if (response.ok) {
                setMessageBox({ show: true, message: data.msg, type: 'success' });
                setShowBorrowForm(false);
                setPickupDate('');
                setReturnDate('');
                setPickupMethod('');
                setMessageToOwner('');
                setBorrowLocation(resource.location); 
                // Re-fetch resource details to update its availability status on the page
                const updatedResourceResponse = await fetch(`http://localhost:5000/api/resources/${id}`);
                const updatedResourceData = await updatedResourceResponse.json();
                setResource(updatedResourceData);
            } else {
                setMessageBox({ show: true, message: `Failed to submit request: ${data.msg || 'Unknown error'}`, type: 'error' });
                console.error("Borrow request submission error:", data);
            }
        } catch (err) {
            console.error("Network or fetch error during borrow request:", err);
            setMessageBox({ show: true, message: 'An error occurred while submitting your request. Please try again.', type: 'error' });
        } finally {
            setRequestSending(false);
        }
    };


    // Handler for submitting review
    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (!eligibleRequestForReview) {
            setMessageBox({ show: true, message: "No eligible completed request found to review this item.", type: 'error' });
            return;
        }
        if (reviewRating === 0) {
            setMessageBox({ show: true, message: "Please select a star rating (1-5).", type: 'error' });
            return;
        }

        setReviewSubmitting(true);

        const reviewData = {
            requestId: eligibleRequestForReview.request_id, 
            rating: reviewRating,
            comment: reviewComment
        };

        try {
            const response = await fetch('http://localhost:5000/api/reviews', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(reviewData)
            });

            const data = await response.json();

            if (response.ok) {
                setMessageBox({ show: true, message: "Review submitted successfully!", type: 'success' });
                setShowReviewForm(false);
                setReviewRating(0);
                setReviewComment('');
                setEligibleRequestForReview(null); 
                fetchReviews(); 
            } else {
                setMessageBox({ show: true, message: `Failed to submit review: ${data.msg || 'Unknown error'}`, type: 'error' });
                console.error("Review submission error:", data);
            }
        } catch (err) {
            console.error("Network or fetch error during review submission:", err);
            setMessageBox({ show: true, message: 'An error occurred while submitting your review. Please try again.', type: 'error' });
        } finally {
            setReviewSubmitting(false);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <p className="text-xl">Loading item details...</p>
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

    if (!resource) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <p className="text-xl">Resource not found or loading...</p>
            </div>
        );
    }

    // Determine if item is available for borrowing
    const isAvailableForBorrow = resource.availability_status === 'Available';

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans py-16 px-6 md:px-20">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-xl text-gray-900">
                <h2 className="text-3xl font-bold text-pink-700 mb-8 text-center">{resource.name}</h2>

                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    <div className="md:w-1/2 flex-shrink-0">
                        <img
                            src={`https://placehold.co/500x350/e0e0e0/555555?text=${resource.name}`}
                            alt={resource.name}
                            className="w-full h-auto rounded-lg shadow-lg object-cover max-h-96"
                        />
                    </div>

                    <div className="md:w-1/2 flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Description:</h3>
                            <p className="text-lg text-gray-700 mb-4 leading-relaxed">{resource.description}</p>
                            
                            <div className="space-y-3 mb-6">
                                <p className="text-gray-800 text-lg">
                                    <strong className="text-pink-600">Available from:</strong> {resource.owner_username}
                                </p>
                                <p className="text-gray-800 text-lg">
                                    <strong className="text-pink-600">Category:</strong> {resource.category}
                                </p>
                                <p className="text-gray-800 text-lg">
                                    <strong className="text-pink-600">Location:</strong> {resource.location}
                                </p>
                                <p className="text-gray-800 text-lg">
                                    <strong className="text-pink-600">Status:</strong> {resource.availability_status}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Posted On:</strong> {new Date(resource.posted_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto mt-8">
                {/* Borrow Button */}
                <button
                    onClick={() => {
                        // Prevent any action if it's the owner or not available
                        if (isCurrentUserOwner) { // Use the dedicated state variable
                            setMessageBox({ show: true, message: "You cannot borrow your own item.", type: 'info' });
                            return; 
                        }
                        if (!currentUser) {
                            setMessageBox({ show: true, message: "Please log in to borrow this item.", type: 'info' });
                            return;
                        }
                        if (!isAvailableForBorrow) {
                            setMessageBox({ show: true, message: `This item is currently ${resource.availability_status.toLowerCase()} and cannot be borrowed.`, type: 'info' });
                            return;
                        }
                        // If all checks pass, show the form
                        setShowBorrowForm(true);
                    }}
                    // Disable if user is owner OR if item is not available for borrow
                    disabled={isCurrentUserOwner || !isAvailableForBorrow} // Use the dedicated state variable
                    className={`w-full py-3 px-6 rounded-md font-semibold text-xl transition-colors duration-200 ${
                        isCurrentUserOwner || !isAvailableForBorrow // Use the dedicated state variable
                            ? 'bg-gray-500 cursor-not-allowed'
                            : 'bg-pink-600 hover:bg-pink-700 text-white'
                    }`}
                    title={isCurrentUserOwner ? "You cannot borrow your own item" : !isAvailableForBorrow ? `Item is ${resource.availability_status.toLowerCase()}` : "Request to Borrow"} // Use the dedicated state variable
                >
                    {isCurrentUserOwner ? "OWN ITEM" : !isAvailableForBorrow ? `STATUS: ${resource.availability_status.toUpperCase()}` : "BORROW NOW"} {/* Use the dedicated state variable */}
                </button>
            </div>

            {/* Borrow Request Form Modal */}
            {showBorrowForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-5 rounded-lg shadow-xl relative w-[450px] max-h-[90vh] overflow-y-auto text-gray-900">
                        <button
                            onClick={() => setShowBorrowForm(false)}
                            className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold"
                            aria-label="Close form"
                        >
                            &times;
                        </button>

                        <form onSubmit={handleSubmitBorrowRequest} className="mt-4 space-y-4">
                            <h4 className="text-xl font-bold text-gray-800 mb-4 text-center">Borrowing Request for {resource.name}</h4>

                            <div>
                                <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-700 mb-1">
                                    Pickup Date:
                                </label>
                                <input
                                    type="date"
                                    id="pickupDate"
                                    name="pickupDate"
                                    value={pickupDate}
                                    onChange={(e) => setPickupDate(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm text-gray-900 bg-white"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 mb-1">
                                    Return Date:
                                </label>
                                <input
                                    type="date"
                                    id="returnDate"
                                    name="returnDate"
                                    value={returnDate}
                                    onChange={(e) => setReturnDate(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm text-gray-900 bg-white"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="pickupMethod" className="block text-sm font-medium text-gray-700 mb-1">
                                    Pickup Method:
                                </label>
                                <select
                                    id="pickupMethod"
                                    name="pickupMethod"
                                    value={pickupMethod}
                                    onChange={(e) => setPickupMethod(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm text-gray-900 bg-white"
                                    required
                                >
                                    <option value="">Select method</option>
                                    <option value="pickup">Owner Pickup</option>
                                    <option value="dropoff">Drop-off by Owner</option>
                                    <option value="public_meetup">Public Meetup</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="messageToOwner" className="block text-sm font-medium text-gray-700 mb-1">
                                    Message to Owner:
                                </label>
                                <textarea
                                    id="messageToOwner"
                                    name="messageToOwner"
                                    rows="3"
                                    value={messageToOwner}
                                    onChange={(e) => setMessageToOwner(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm text-gray-900 bg-white"
                                    placeholder="e.g., When would be a good time to pick up? I need it for a project next weekend."
                                ></textarea>
                            </div>

                            <div>
                                <label htmlFor="borrowLocation" className="block text-sm font-medium text-gray-700 mb-1">
                                    Desired Pickup Location:
                                </label>
                                <input
                                    type="text"
                                    id="borrowLocation"
                                    name="borrowLocation"
                                    value={borrowLocation}
                                    onChange={(e) => setBorrowLocation(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm text-gray-900 bg-white"
                                    placeholder="e.g., Near ABC Supermarket"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={requestSending}
                                className="w-full bg-pink-600 text-white py-3 px-6 rounded-md font-semibold text-lg hover:bg-pink-700 transition-colors duration-200"
                            >
                                {requestSending ? 'Sending Request...' : 'Submit Borrow Request'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowBorrowForm(false)}
                                className="w-full bg-gray-400 text-white py-2 px-4 rounded-md font-semibold text-md hover:bg-gray-500 transition-colors duration-200 mt-2"
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Reviews Section */}
            <div className="max-w-4xl mx-auto mt-12 bg-white p-8 rounded-lg shadow-xl text-gray-900">
                <h3 className="text-2xl font-bold text-pink-700 mb-6 border-b pb-3">Reviews</h3>

                {reviewsLoading && <p className="text-center text-gray-700">Loading reviews...</p>}
                {reviewsError && <p className="text-center text-red-500">Error loading reviews: {reviewsError}</p>}

                {reviews.length === 0 && !reviewsLoading && (
                    <p className="text-center text-gray-600">No reviews yet for this item.</p>
                )}

                {/* Review Submission Button (Conditionally Rendered) */}
                {/* Show if user is logged in, NOT the owner, AND eligible to review a completed request */}
                {currentUser && !isCurrentUserOwner && eligibleRequestForReview && ( // Use isCurrentUserOwner here
                    <div className="my-6 text-center">
                        <button
                            onClick={() => setShowReviewForm(true)}
                            className="bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200"
                        >
                            Write a Review
                        </button>
                    </div>
                )}

                {/* Review List */}
                {reviews.length > 0 && (
                    <div className="space-y-6 mt-6">
                        {reviews.map((review) => (
                            <div key={review.review_id} className="border-b pb-4 last:border-b-0">
                                <div className="flex items-center mb-2">
                                    <StarRating rating={review.rating} editable={false} />
                                    <span className="ml-3 text-lg font-semibold text-gray-800">{review.reviewer_username}</span>
                                </div>
                                <p className="text-gray-700 leading-relaxed mb-2">{review.comment}</p>
                                <p className="text-sm text-gray-500">
                                    Reviewed on: {new Date(review.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Review Submission Form Modal */}
            {showReviewForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-5 rounded-lg shadow-xl relative w-[450px] max-h-[90vh] overflow-y-auto text-gray-900">
                        <button
                            onClick={() => setShowReviewForm(false)}
                            className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold"
                            aria-label="Close review form"
                        >
                            &times;
                        </button>

                        <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
                            <h4 className="text-xl font-bold text-gray-800 mb-4 text-center">Submit Your Review for {resource.name}</h4>
                            
                            <div className="text-center">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating:</label>
                                <StarRating rating={reviewRating} setRating={setReviewRating} editable={true} />
                            </div>

                            <div>
                                <label htmlFor="reviewComment" className="block text-sm font-medium text-gray-700 mb-1">
                                    Your Comment:
                                </label>
                                <textarea
                                    id="reviewComment"
                                    name="reviewComment"
                                    rows="4"
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white"
                                    placeholder="Share your experience with this item..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={reviewSubmitting}
                                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-semibold text-lg hover:bg-blue-700 transition-colors duration-200"
                            >
                                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowReviewForm(false)}
                                className="w-full bg-gray-400 text-white py-2 px-4 rounded-md font-semibold text-md hover:bg-gray-500 transition-colors duration-200 mt-2"
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Message Box */}
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
