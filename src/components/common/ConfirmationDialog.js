// frontend/src/components/common/ConfirmationDialog.js
import React from 'react';

// Custom Confirmation Modal Component
const ConfirmationDialog = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101]">
            <div className="bg-white p-8 rounded-lg shadow-2xl text-gray-900 text-center max-w-sm mx-auto relative">
                <p className="text-lg font-semibold mb-6">{message}</p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog;
