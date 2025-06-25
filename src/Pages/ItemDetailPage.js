import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function ItemDetailPage() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, logout } = useAuth(); // Get currentUser to check if logged in
  const navigate = useNavigate();

  const [showBorrowForm, setShowBorrowForm] = useState(false);

  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [pickupMethod, setPickupMethod] = useState('');
  const [messageToOwner, setMessageToOwner] = useState('');
  const [borrowLocation, setBorrowLocation] = useState(''); // Will be set from fetched resource.location
  const [requestSending, setRequestSending] = useState(false); // New state for request sending loading

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
            alert('Session expired or unauthorized. Please log in again.');
            logout();
            navigate('/login');
          } else {
            setError(`Failed to fetch resource details: ${errData.msg || 'Unknown error'}`);
          }
          setLoading(false);
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
  }, [id, logout, navigate]);

  useEffect(() => {
    if (showBorrowForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showBorrowForm]);


  const handleSubmitBorrowRequest = async (e) => {
    e.preventDefault();

    if (!currentUser) {
        alert("You must be logged in to submit a borrow request.");
        navigate('/login');
        return;
    }

    if (currentUser.id === resource.owner_id) {
        alert("You cannot borrow your own item.");
        setShowBorrowForm(false); // Close the form if they try to borrow their own item
        return;
    }

    setRequestSending(true); // Start request sending loading
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
        alert("Authentication token missing. Please log in.");
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
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token, // Authenticate the request
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.msg); // "Borrow request submitted successfully!"
        setShowBorrowForm(false);
        // Reset form fields
        setPickupDate('');
        setReturnDate('');
        setPickupMethod('');
        setMessageToOwner('');
        setBorrowLocation(resource.location); // Reset to item's default location
      } else {
        alert(`Failed to submit request: ${data.msg || 'Unknown error'}`);
        console.error("Borrow request submission error:", data);
      }
    } catch (err) {
      console.error("Network or fetch error during borrow request:", err);
      alert('An error occurred while submitting your request. Please try again.');
    } finally {
      setRequestSending(false); // End request sending loading
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
        {/* Disable button if user is owner of the item */}
        <button
          onClick={() => setShowBorrowForm(true)}
          className={`w-full py-3 px-6 rounded-md font-semibold text-xl transition-colors duration-200 ${
            currentUser && currentUser.id === resource.owner_id
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-pink-600 hover:bg-pink-700'
          }`}
          disabled={currentUser && currentUser.id === resource.owner_id}
          title={currentUser && currentUser.id === resource.owner_id ? "You cannot borrow your own item" : "Request to Borrow"}
        >
          {currentUser && currentUser.id === resource.owner_id ? "OWN ITEM" : "BORROW NOW"}
        </button>
      </div>

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
                disabled={requestSending} // Disable while sending
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
    </div>
  );
}

export default ItemDetailPage;