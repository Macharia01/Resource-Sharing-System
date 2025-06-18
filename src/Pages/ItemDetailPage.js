import React, { useState, useEffect } from 'react';
import headsetImg from '../Assets/Images/headset.jpg'; // Ensure this path and filename are correct

// You would typically fetch this item data from an API based on an item ID
// For now, this is placeholder data to demonstrate the layout.
const mockItemData = {
  name: "PlayStation Pulse Elite Headset",
  description: "High-fidelity audio headset with planar magnetic drivers, designed for the PlayStation 5. Features lossless audio, AI-enhanced noise rejection, and a comfortable design for long gaming sessions.",
  owner: "John Doe",
  category: "Electronics & Gaming",
  location: "Nairobi, Kenya",
  imageUrl: headsetImg
};

function ItemDetailPage() {
  const item = mockItemData;
  const [showBorrowForm, setShowBorrowForm] = useState(false); // State to control modal visibility

  // State for form fields
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [pickupMethod, setPickupMethod] = useState('');
  const [messageToOwner, setMessageToOwner] = useState('');
  const [borrowLocation, setBorrowLocation] = useState(item.location);

  // Effect to manage body scrolling when modal is open/closed
  useEffect(() => {
    if (showBorrowForm) {
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    } else {
      document.body.style.overflow = 'unset'; // Re-enable scrolling
    }
    // Cleanup function to ensure scroll is re-enabled if component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showBorrowForm]); // Run this effect when showBorrowForm changes

  const handleSubmitBorrowRequest = (e) => {
    e.preventDefault();
    // In a real application, you would send this data to your backend API
    console.log("Borrowing Request Submitted:", {
      itemId: item.name,
      pickupDate,
      returnDate,
      pickupMethod,
      messageToOwner,
      borrowLocation
    });
    alert("Borrowing request submitted successfully! Owner will be notified.");
    // Close the modal and reset form fields
    setShowBorrowForm(false);
    setPickupDate('');
    setReturnDate('');
    setPickupMethod('');
    setMessageToOwner('');
    setBorrowLocation(item.location);
  };

  return (
    // Main container for the page
    <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans py-16 px-6 md:px-20">
      {/* Central content card - Item Details */}
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-xl text-gray-900">
        <h2 className="text-3xl font-bold text-pink-700 mb-8 text-center">{item.name}</h2>

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Item Image Section */}
          <div className="md:w-1/2 flex-shrink-0">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-auto rounded-lg shadow-lg object-cover max-h-96"
            />
          </div>

          {/* Item Details Section */}
          <div className="md:w-1/2 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Description:</h3>
              <p className="text-lg text-gray-700 mb-4 leading-relaxed">{item.description}</p>
              
              <div className="space-y-3 mb-6">
                <p className="text-gray-800 text-lg">
                    <strong className="text-pink-600">Available from:</strong> {item.owner}
                </p>
                <p className="text-gray-800 text-lg">
                    <strong className="text-pink-600">Category:</strong> {item.category}
                </p>
                <p className="text-gray-800 text-lg">
                    <strong className="text-pink-600">Location:</strong> {item.location}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Borrow Button - now always visible below the details card */}
      <div className="max-w-4xl mx-auto mt-8">
        <button
          onClick={() => setShowBorrowForm(true)}
          className="w-full bg-pink-600 text-white py-3 px-6 rounded-md font-semibold text-xl hover:bg-pink-700 transition-colors duration-200"
        >
          BORROW NOW
        </button>
      </div>

      {/* Borrowing Form Modal */}
      {showBorrowForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-5 rounded-lg shadow-xl relative w-[450px] max-h-[580px] overflow-y-auto text-gray-900 animate-slide-in-fwd-center">
            {/* Close Button for the modal */}
            <button
              onClick={() => setShowBorrowForm(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold"
              aria-label="Close form"
            >
              &times;
            </button>

            {/* The Borrowing Form itself */}
            <form onSubmit={handleSubmitBorrowRequest} className="mt-4 space-y-4">
              <h4 className="text-xl font-bold text-gray-800 mb-4 text-center">Borrowing Request</h4>

              {/* Pickup Date */}
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

              {/* Return Date */}
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

              {/* Pickup Method */}
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

              {/* Message to Owner */}
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

              {/* Location (can be pre-filled or user-defined for specific pickup) */}
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

              {/* Submit Borrow Request Button */}
              <button
                type="submit"
                className="w-full bg-pink-600 text-white py-3 px-6 rounded-md font-semibold text-lg hover:bg-pink-700 transition-colors duration-200"
              >
                Submit Borrow Request
              </button>

              {/* Cancel Button - now also closes the modal */}
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