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
const ReviewModal = ({ resource, onSaveReview, onClose, hasExistingReview, relatedCompletedRequestId, onShowMessage }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) {
            onShowMessage('Please select a rating!', 'error'); // Using onShowMessage
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
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                                placeholder="Share your experience..."
                            ></textarea>
                        </div>
                        <div className="flex justify-end space-x-4 mt-6">
                            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors duration-200">Submit Review</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};


// Borrow Request Modal
const BorrowRequestModal = ({ resource, onClose, onSubmitRequest, onShowMessage }) => {
    const [pickupDate, setPickupDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [pickupMethod, setPickupMethod] = useState('Meetup'); // Default value
    const [messageToOwner, setMessageToOwner] = useState('');
    const [borrowLocation, setBorrowLocation] = useState(resource.location || ''); // Pre-fill with resource location

    const handleSubmit = (e) => {
        e.preventDefault();
        // Basic validation
        if (!pickupDate || !returnDate || !pickupMethod || !borrowLocation) {
            onShowMessage('Please fill in all required fields for the borrow request.', 'error');
            return;
        }
        if (new Date(pickupDate) > new Date(returnDate)) {
            onShowMessage('Return date cannot be before pickup date.', 'error');
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
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm" /> 
                    </div>
                    <div>
                        <label htmlFor="returnDate" className="block text-gray-700 text-sm font-medium mb-1">Return Date:</label>
                        <input type="date" id="returnDate" name="returnDate" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm" /> 
                    </div>
                    <div>
                        <label htmlFor="pickupMethod" className="block text-gray-700 text-sm font-medium mb-1">Pickup Method:</label>
                        <select id="pickupMethod" name="pickupMethod" value={pickupMethod} onChange={(e) => setPickupMethod(e.target.value)} required
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm bg-white" > 
                            <option value="Meetup">Meetup</option>
                            <option value="Delivery">Delivery</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="borrowLocation" className="block text-gray-700 text-sm font-medium mb-1">Borrow Location:</label>
                        <input type="text" id="borrowLocation" name="borrowLocation" value={borrowLocation} onChange={(e) => setBorrowLocation(e.target.value)} required
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm" 
                            placeholder="e.g., Nairobi CBD, Owner's Address" /> 
                    </div>
                    <div>
                        <label htmlFor="messageToOwner" className="block text-gray-700 text-sm font-medium mb-1">Message to Owner (Optional):</label>
                        <textarea id="messageToOwner" name="messageToOwner" value={messageToOwner} onChange={(e) => setMessageToOwner(e.target.value)}
                            rows="3" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                            placeholder="Any specific instructions or questions?"></textarea> 
                    </div>
                    <div className="flex justify-end space-x-4 mt-6">
                        <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors duration-200">Submit Request</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Report User Modal Component
const ReportUserModal = ({ resource, reportedUser, relatedRequestId, onClose, onSubmitReport, onShowMessage }) => {
    const [reportType, setReportType] = useState('');
    const [description, setDescription] = useState('');

    const allowedReportTypes = ['Item Damaged', 'Late Return', 'Did Not Return Item', 'Misconduct', 'Other'];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reportType || !description) {
            onShowMessage('Please select a report type and provide a description.', 'error');
            return;
        }
        onSubmitReport({ requestId: relatedRequestId, reportedUserId: reportedUser.user_id, reportType, description });
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
                <h3 className="text-2xl font-bold text-red-700 mb-6 text-center">Report User: {reportedUser.username}</h3>
                <p className="text-gray-700 mb-4 text-center">
                    Reporting regarding the completed borrow request for "{resource.name}".
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="reportType" className="block text-gray-700 text-sm font-medium mb-1">Report Type:</label>
                        <select
                            id="reportType"
                            name="reportType"
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white"
                            required
                        >
                            <option value="">-- Select Report Type --</option>
                            {allowedReportTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-gray-700 text-sm font-medium mb-1">Description:</label>
                        <textarea
                            id="description"
                            name="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="5"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                            placeholder="Provide a detailed description of the issue..."
                            required
                        ></textarea>
                    </div>
                    <div className="flex justify-end space-x-4 mt-6">
                        <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200">Submit Report</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


function ItemDetailPage() {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const { currentUser, isLoggedIn, loadingAuth } = useAuth(); // Removed getAuthHeaders from destructuring
    
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [messageBox, setMessageBox] = useState({ show: false, message: '', type: '' });

    const [reviews, setReviews] = useState([]); 
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false); 
    const [canReview, setCanReview] = useState(false); 
    const [relatedCompletedRequestIdForReview, setRelatedCompletedRequestIdForReview] = useState(null); 
    const [hasExistingReview, setHasExistingReview] = useState(false); 

    const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);

    // State for Report User functionality
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [canReportUser, setCanReportUser] = useState(false);
    const [reportedBorrowerDetails, setReportedBorrowerDetails] = useState(null);
    const [relatedCompletedRequestIdForReport, setRelatedCompletedRequestIdForReport] = useState(null); 

    // Re-added getAuthHeaders as a useCallback within the component
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
            setCanReview(false);
            setHasExistingReview(false);
            setRelatedCompletedRequestIdForReview(null);
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/requests/sent`, {
                headers: getAuthHeaders(),
            });
            const data = await response.json();

            if (!response.ok) {
                console.error("Failed to fetch sent requests for review eligibility:", data.msg);
                setCanReview(false);
                setHasExistingReview(false);
                setRelatedCompletedRequestIdForReview(null);
                return;
            }

            const completedRequest = data.find(
                (req) => 
                    String(req.resource_id).trim() === String(id).trim() && 
                    String(req.requester_id).trim() === String(currentUser.id).trim() && 
                    req.status === 'Completed'
            );
            
            if (completedRequest) {
                const existingReviewCheck = await fetch(`http://localhost:5000/api/reviews/check-existing/${completedRequest.request_id}`, {
                    headers: getAuthHeaders(),
                });
                const existingReviewData = await existingReviewCheck.json();

                if (existingReviewCheck.ok && existingReviewData.hasReview) {
                    setCanReview(false);
                    setHasExistingReview(true); 
                    setRelatedCompletedRequestIdForReview(completedRequest.request_id);
                } else {
                    setCanReview(true);
                    setHasExistingReview(false);
                    setRelatedCompletedRequestIdForReview(completedRequest.request_id);
                }
            } else {
                setCanReview(false);
                setHasExistingReview(false);
                setRelatedCompletedRequestIdForReview(null);
            }
        } catch (err) {
            console.error("Error checking review eligibility:", err);
            setCanReview(false);
            setHasExistingReview(false);
            setRelatedCompletedRequestIdForReview(null);
        }
    }, [isLoggedIn, currentUser, id, getAuthHeaders, loadingAuth]);


    // Check Report Eligibility
    const checkReportEligibility = useCallback(async () => {
        if (loadingAuth || !isLoggedIn || !currentUser || !id) {
            setCanReportUser(false);
            setReportedBorrowerDetails(null);
            setRelatedCompletedRequestIdForReport(null);
            return;
        }

        if (!item) return; // Wait for item to be loaded

        // Only owner can report on their items
        if (String(item.owner_id).trim() !== String(currentUser.id).trim()) {
            setCanReportUser(false);
            setReportedBorrowerDetails(null);
            setRelatedCompletedRequestIdForReport(null);
            return;
        }

        try {
            // Fetch requests received by this owner for THIS resource
            const response = await fetch(`http://localhost:5000/api/requests/received`, { // Changed to /received endpoint
                headers: getAuthHeaders(),
            });
            const data = await response.json();

            if (!response.ok) {
                console.error("Failed to fetch received requests for report eligibility:", data.msg);
                setCanReportUser(false);
                setReportedBorrowerDetails(null);
                setRelatedCompletedRequestIdForReport(null);
                return;
            }

            // Find a completed request where current user is owner for this resource and there's a borrower
            const completedRequestAsOwner = data.find(
                (req) => 
                    String(req.resource_id).trim() === String(id).trim() && 
                    req.status === 'Completed' &&
                    String(req.requester_id).trim() !== String(currentUser.id).trim() // Ensure it's not a self-request from admin panel for example
            );

            if (completedRequestAsOwner) {
                // Fetch details of the borrower (requester)
                const borrowerResponse = await fetch(`http://localhost:5000/api/user/profile/${completedRequestAsOwner.requester_id}`, {
                    headers: getAuthHeaders(),
                });
                const borrowerData = await borrowerResponse.json();

                if (borrowerResponse.ok) {
                    // Check if a report for this specific request already exists
                    const existingReportsResponse = await fetch(`http://localhost:5000/api/reports`, { // Fetch all reports
                        headers: getAuthHeaders(),
                    });
                    const existingReports = await existingReportsResponse.json();
                    
                    const hasExistingReportForThisRequest = existingReports.some(report => 
                        String(report.related_request_id).trim() === String(completedRequestAsOwner.request_id).trim()
                    );

                    if (hasExistingReportForThisRequest) {
                        setCanReportUser(false);
                        setReportedBorrowerDetails(null); 
                        setRelatedCompletedRequestIdForReport(null);
                    } else {
                        setCanReportUser(true);
                        setReportedBorrowerDetails({
                            user_id: completedRequestAsOwner.requester_id,
                            username: borrowerData.username // Assuming the API returns username
                        });
                        setRelatedCompletedRequestIdForReport(completedRequestAsOwner.request_id);
                    }
                } else {
                    console.error("Failed to fetch borrower profile for reporting:", borrowerData.msg);
                    setCanReportUser(false);
                    setReportedBorrowerDetails(null);
                    setRelatedCompletedRequestIdForReport(null);
                }
            } else {
                setCanReportUser(false);
                setReportedBorrowerDetails(null);
                setRelatedCompletedRequestIdForReport(null);
            }
        } catch (err) {
            console.error("Error checking report eligibility:", err);
            setCanReportUser(false);
            setReportedBorrowerDetails(null);
            setRelatedCompletedRequestIdForReport(null);
        }
    }, [isLoggedIn, currentUser, id, item, getAuthHeaders, loadingAuth]);


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

    // Handle Report Submission
    const handleReportSubmit = async ({ requestId, reportedUserId, reportType, description }) => {
        console.log('DEBUG_REPORT_SUBMIT: Attempting to submit report with requestId:', requestId);
        try {
            const response = await fetch('http://localhost:5000/api/reports', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ requestId, reportedUserId, reportType, description }),
            });
            const data = await response.json();

            if (!response.ok) {
                setMessageBox({ show: true, message: data.msg || 'Failed to submit report.', type: 'error' });
                return;
            }

            setMessageBox({ show: true, message: 'Report submitted successfully. An administrator will review it.', type: 'success' });
            setIsReportModalOpen(false);
            checkReportEligibility(); // Re-check eligibility to update button state
        } catch (err) {
            console.error("Error submitting report:", err);
            setMessageBox({ show: true, message: 'An error occurred while submitting your report.', type: 'error' });
        }
    };

    useEffect(() => {
        fetchItemDetails();
        fetchReviews();
    }, [fetchItemDetails, fetchReviews]);

    // Combined useEffect for eligibility checks that depend on item and auth
    useEffect(() => {
        if (!loadingAuth && item) { 
            checkReviewEligibility();
            checkReportEligibility();
        }
    }, [loadingAuth, item, checkReviewEligibility, checkReportEligibility]);

    // Use a unified message box handler for convenience
    const showMessageBox = useCallback((message, type) => {
        setMessageBox({ show: true, message, type });
    }, []);

    
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

    const isOwner = currentUser && item.owner_id && String(currentUser.id).trim() === String(item.owner_id).trim();

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

                         {/* NEW: Conditional "Report User" button */}
                        {isLoggedIn && isOwner && canReportUser && reportedBorrowerDetails && relatedCompletedRequestIdForReport && (
                            <button
                                onClick={() => setIsReportModalOpen(true)}
                                className="w-full mt-4 py-3 px-6 bg-red-600 text-white rounded-md font-semibold text-lg hover:bg-red-700 transition-colors shadow-md"
                            >
                                Report Borrower ({reportedBorrowerDetails.username})
                            </button>
                        )}
                        {isLoggedIn && isOwner && !canReportUser && (
                            <p className="text-center text-gray-400 mt-4 text-sm">
                                You can report a borrower after a completed request for this item.
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
                    relatedCompletedRequestId={relatedCompletedRequestIdForReview}
                    onShowMessage={showMessageBox}
                />
            )}

            {/* Borrow Request Modal */}
            {isBorrowModalOpen && item && currentUser && (
                <BorrowRequestModal
                    resource={item}
                    onClose={() => setIsBorrowModalOpen(false)}
                    onSubmitRequest={handleBorrowRequestSubmit}
                    onShowMessage={showMessageBox}
                />
            )}

            {/* Report User Modal */}
            {isReportModalOpen && item && currentUser && reportedBorrowerDetails && relatedCompletedRequestIdForReport && (
                <ReportUserModal
                    resource={item}
                    reportedUser={reportedBorrowerDetails}
                    relatedRequestId={relatedCompletedRequestIdForReport}
                    onClose={() => setIsReportModalOpen(false)}
                    onSubmitReport={handleReportSubmit}
                    onShowMessage={showMessageBox}
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
