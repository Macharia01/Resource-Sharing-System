// backend/routes/notificationRoutes.js

const express = require('express');
const protect = require('../middleware/auth'); // Import authentication middleware

// This function will be called from server.js and receive the pool
module.exports = (pool) => {
    const router = express.Router();

    // @route   GET /api/notifications
    // @desc    Get all notifications for the authenticated user
    // @access  Private
    router.get('/notifications', protect, async (req, res) => {
        const userId = req.user.user_id; // Access user_id (snake_case)
        try {
            const notifications = await pool.query(
                `SELECT notification_id, user_id, related_request_id, message, type, is_read, created_at, updated_at
                 FROM Notifications
                 WHERE user_id = $1
                 ORDER BY created_at DESC`,
                [userId]
            );
            res.json(notifications.rows);
        } catch (err) {
            console.error('Get Notifications Error:', err.message);
            res.status(500).json({ msg: 'Server Error fetching notifications', error: err.message });
        }
    });

    // @route   PUT /api/notifications/:id/read
    // @desc    Mark a specific notification as read
    // @access  Private (owner of notification)
    router.put('/notifications/:id/read', protect, async (req, res) => {
        const notificationId = req.params.id;
        const userId = req.user.user_id; // Access user_id (snake_case)

        try {
            const result = await pool.query(
                `UPDATE Notifications SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
                 WHERE notification_id = $1 AND user_id = $2
                 RETURNING notification_id, is_read`,
                [notificationId, userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ msg: 'Notification not found or you are not authorized to mark it as read.' });
            }
            res.json({ msg: 'Notification marked as read.', notification: result.rows[0] });
        } catch (err) {
            console.error('Mark Notification Read Error:', err.message);
            res.status(500).json({ msg: 'Server Error marking notification as read', error: err.message });
        }
    });

    return router;
};
