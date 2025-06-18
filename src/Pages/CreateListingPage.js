import React from 'react';
// Assuming you'll have a general layout (like header/footer) that wraps all pages
// For simplicity, this example will just have the form content.

function CreateListingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans py-16 px-6 md:px-20">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-xl text-gray-900">
        <h2 className="text-3xl font-bold text-pink-700 mb-8 text-center">Create New Listing</h2>

        <form className="space-y-6">
          {/* Resource Name */}
          <div>
            <label htmlFor="resourceName" className="block text-lg font-medium text-gray-700 mb-2">
              Resource Name
            </label>
            <input
              type="text"
              id="resourceName"
              name="resourceName"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-base text-gray-900 bg-gray-50"
              placeholder="e.g., Cordless Drill, Fantasy Novel"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-lg font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-base text-gray-900 bg-gray-50"
              placeholder="Provide a detailed description of your resource, its condition, and any specifics."
              required
            ></textarea>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-lg font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-base text-gray-900 bg-gray-50"
              required
            >
              <option value="">Select a category</option>
              <option value="tools">Tools & Equipment</option>
              <option value="books">Books & Stationery</option>
              <option value="kitchen">Kitchen Items</option>
              <option value="sports">Sports & Outdoor</option>
              <option value="electronics">Electronics</option>
              <option value="services">Services</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-lg font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-base text-gray-900 bg-gray-50"
              placeholder="e.g., Nairobi, Kenya"
              required
            />
          </div>

          {/* Upload Image */}
          <div>
            <label htmlFor="image" className="block text-lg font-medium text-gray-700 mb-2">
              Upload Image
            </label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              className="mt-1 block w-full text-sm text-gray-900
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-pink-50 file:text-pink-700
                hover:file:bg-pink-100"
            />
          </div>

          {/* Availability Status */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Availability Status
            </label>
            <div className="mt-1 flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="availabilityStatus"
                  value="available"
                  className="form-radio text-pink-600"
                  defaultChecked
                />
                <span className="ml-2 text-gray-800">Available</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="availabilityStatus"
                  value="reserved"
                  className="form-radio text-pink-600"
                />
                <span className="ml-2 text-gray-800">Reserved</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="availabilityStatus"
                  value="donated"
                  className="form-radio text-pink-600"
                />
                <span className="ml-2 text-gray-800">Donated</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-pink-600 text-white py-3 px-4 rounded-md font-semibold text-lg hover:bg-pink-700 transition-colors duration-200"
          >
            Submit Listing
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateListingPage;