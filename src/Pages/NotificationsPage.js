import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext'; 
import { useNavigate } from 'react-router-dom';
import MessageBox from '../components/common/MessageBox'; // Import from common components

function NotificationsPage() {
    // Destructure `refreshUnreadNotificationsCount` from useAuth
    const { currentUser, logout, refreshUnreadNotificationsCount } = useAuth();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [messageBox, setMessageBox] = useState({ show: false, message: '', type: '' });

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        };
    }, []);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (!currentUser) {
            setMessageBox({ show: true, message: "You must be logged in to view notifications.", type: 'error' });
            logout();
            navigate('/login');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/notifications', {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                const errData = await response.json();
                if (response.status === 401 || response.status === 403) {
                    setMessageBox({ show: true, message: 'Session expired or unauthorized. Please log in again.', type: 'error' });
                    logout();
                    navigate('/login');
                } else {
                    setError(`Failed to fetch notifications: ${errData.msg || 'Unknown error'}`);
                }
                return;
            }

            const data = await response.json();
            setNotifications(data);
        } catch (err) {
            console.error("Error fetching notifications:", err);
            setError(err.message || 'An error occurred while fetching notifications.');
        } finally {
            setLoading(false);
        }
    }, [currentUser, logout, navigate, getAuthHeaders]);

    useEffect(() => {
        fetchNotifications();
        // Disable body scroll when messageBox is open
        if (messageBox.show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [fetchNotifications, messageBox.show]);

    const handleMarkAsRead = useCallback(async (notificationId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: getAuthHeaders(),
            });

            const data = await response.json();
            if (response.ok) {
                // Update the specific notification's is_read status in the local state
                setNotifications(prevNotifications =>
                    prevNotifications.map(notification =>
                        notification.notification_id === notificationId
                            ? { ...notification, is_read: true }
                            : notification
                    )
                );
                // CRITICAL: Call the function from AuthContext to refresh the global unread count
                // No longer pass currentUser as it's now handled by AuthContext internally
                if (refreshUnreadNotificationsCount) {
                    refreshUnreadNotificationsCount(); 
                }
            } else {
                setMessageBox({ show: true, message: `Failed to mark notification as read: ${data.msg || 'Unknown error'}`, type: 'error' });
            }
        } catch (err) {
            console.error("Error marking notification as read:", err);
            setMessageBox({ show: true, message: 'An error occurred while marking notification as read.', type: 'error' });
        }
    }, [getAuthHeaders, refreshUnreadNotificationsCount]); 

    const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <p className="text-xl">Loading notifications...</p>
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

    if (!currentUser) {
        return null; // Will be redirected by useEffect if not logged in
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans py-16 px-6 md:px-20">
            <div className="max-w-4xl mx-auto bg-black bg-opacity-70 p-10 rounded-lg shadow-2xl border border-pink-700">
                <h2 className="text-3xl font-extrabold text-white text-center mb-8">
                    Your Notifications ({unreadNotificationsCount} Unread)
                </h2>

                {notifications.length === 0 ? (
                    <p className="text-center text-lg text-gray-300">You have no notifications at the moment.</p>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <div
                                key={notification.notification_id}
                                className={`p-4 rounded-lg shadow-md flex items-center justify-between ${
                                    notification.is_read ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-900 border border-pink-600'
                                }`}
                            >
                                <div>
                                    <p className="font-semibold">{notification.message}</p>
                                    <p className="text-xs mt-1">
                                        {new Date(notification.created_at).toLocaleString()}
                                    </p>
                                </div>
                                {!notification.is_read && (
                                    <button
                                        onClick={() => handleMarkAsRead(notification.notification_id)}
                                        className="ml-4 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors text-sm font-semibold flex-shrink-0"
                                    >
                                        Mark as Read
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

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

export default NotificationsPage;
