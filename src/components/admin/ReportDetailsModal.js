// frontend/src/components/admin/ReportDetailsModal.js
import React, { useState } from 'react';

// NEW: Inline Modal Component for Report Details & Status Update
function ReportDetailsModal({ report, onClose, onUpdateReportStatus, onBanUser, onShowMessage }) {
    const [status, setStatus] = useState(report.status);

    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        // Automatically save when status changes
        await onUpdateReportStatus(report.report_id, newStatus);
    };

    const handleBanClick = () => {
        onBanUser(report.reported_user_id, report.reported_username);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full relative my-8 text-gray-900">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-3xl font-bold p-1 rounded-full hover:bg-gray-200 transition-colors leading-none"
                    aria-label="Close modal"
                >
                    &times;
                </button>
                <h3 className="text-2xl font-bold text-pink-700 mb-6 text-center">Report Details: {report.report_type}</h3>
                
                <div className="space-y-4 text-left">
                    <p><strong>Report ID:</strong> {report.report_id}</p>
                    <p><strong>Reported By:</strong> {report.reporter_username} (ID: {report.reporter_id})</p>
                    <p><strong>Reported User:</strong> {report.reported_username} (ID: {report.reported_user_id})</p>
                    <p><strong>Related Request ID:</strong> {report.related_request_id}</p>
                    <p><strong>Resource:</strong> {report.resource_name} (ID: {report.resource_id})</p>
                    <p><strong>Report Type:</strong> {report.report_type}</p>
                    <p><strong>Description:</strong> <span className="block p-2 border rounded-md bg-gray-50 mt-1 whitespace-pre-wrap">{report.description}</span></p>
                    <p><strong>Reported At:</strong> {new Date(report.reported_at).toLocaleString()}</p>
                    
                    <div>
                        <label htmlFor="reportStatus" className="block text-gray-700 text-sm font-medium mb-1">Status:</label>
                        <select
                            id="reportStatus"
                            name="status"
                            value={status}
                            onChange={handleStatusChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white"
                        >
                            <option value="Pending">Pending</option>
                            <option value="Reviewed">Reviewed</option>
                            <option value="Dismissed">Dismissed</option>
                            <option value="Action Taken">Action Taken</option>
                        </select>
                    </div>

                    {report.status !== 'Pending' && (
                        <>
                            <p><strong>Resolved At:</strong> {new Date(report.resolved_at).toLocaleString()}</p>
                            <p><strong>Resolved By:</strong> {report.resolved_by_username || 'N/A'}</p>
                        </>
                    )}
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                    {/* Conditional Ban User Button */}
                    <button
                        onClick={handleBanClick}
                        className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        Ban User
                    </button>
                    <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
}

export default ReportDetailsModal;
