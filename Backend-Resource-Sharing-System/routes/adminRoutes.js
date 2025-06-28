// backend/routes/adminRoutes.js - FINAL UPDATED CONTENT

const express = require('express');
const protect = require('../middleware/auth'); // Import authentication middleware
const authorizeAdmin = require('../middleware/admin'); // Import admin authorization middleware
const { v4: uuidv4 } = require('uuid'); // Import uuid for notification IDs in admin updates

// This function will be called from server.js and receive the pool
module.exports = (pool) => {
    const router = express.Router();

    // All routes in this file will be prefixed with /api/admin in server.js
    // and will use protect and authorizeAdmin middleware.

    // @route   GET /api/admin/dashboard-stats
    // @desc    Get dashboard statistics for admin
    // @access  Private (Admin only)
    router.get('/dashboard-stats', protect, authorizeAdmin, async (req, res) => {
        try {
            const totalUsers = await pool.query('SELECT COUNT(*) FROM Users');
            const totalResources = await pool.query('SELECT COUNT(*) FROM Resources');
            const pendingRequests = await pool.query('SELECT COUNT(*) FROM Requests WHERE status = $1', ['Pending']);
            const pendingReports = await pool.query('SELECT COUNT(*) FROM Reports WHERE status = $1', ['Pending']);
            const bannedUsers = await pool.query('SELECT COUNT(*) FROM Users WHERE is_banned = TRUE'); // NEW: Count banned users

            res.json({
                totalUsers: parseInt(totalUsers.rows[0].count),
                totalResourcesListed: parseInt(totalResources.rows[0].count),
                pendingBorrowRequests: parseInt(pendingRequests.rows[0].count),
                pendingUserReports: parseInt(pendingReports.rows[0].count),
                bannedUsersCount: parseInt(bannedUsers.rows[0].count), // NEW: Add banned users count
                recentUserActivity: "Coming soon: detailed activity logs"
            });

        } catch (err) {
            console.error('Admin Dashboard Stats Error:', err.message);
            res.status(500).send('Server Error fetching admin dashboard stats');
        }
    });

    // @route   GET /api/admin/reports
    // @desc    Get all reports (for admin review)
    // @access  Private (Admin only)
    router.get('/reports', protect, authorizeAdmin, async (req, res) => {
        try {
            const reports = await pool.query(
                `SELECT
                    r.report_id,
                    r.reporter_id,
                    rep_user.username as reporter_username,
                    rep_user.email as reporter_email,
                    r.reported_user_id,
                    reported_user.username as reported_username,
                    reported_user.email as reported_user_email,
                    r.resource_id,
                    res.name as resource_name,
                    r.report_type,
                    r.description,
                    r.status,
                    r.reported_at,
                    r.resolved_at,
                    r.resolved_by,
                    res_admin.username as resolved_by_username,
                    req.request_id,
                    req.pickup_date,
                    req.return_date,
                    req.status as request_status
                   FROM Reports r
                   JOIN Users rep_user ON r.reporter_id = rep_user.user_id
                   JOIN Users reported_user ON r.reported_user_id = reported_user.user_id
                   LEFT JOIN Resources res ON r.resource_id = res.resource_id
                   LEFT JOIN Users res_admin ON r.resolved_by = res_admin.user_id
                   LEFT JOIN Requests req ON r.related_request_id = req.request_id -- Using related_request_id for reports table
                   ORDER BY r.created_at DESC`
            );
            res.json(reports.rows);
        } catch (err) {
            console.error('Get Admin Reports Error:', err.message);
            res.status(500).json({ msg: 'Server Error fetching admin reports', error: err.message });
        }
    });

    // @route   PUT /api/admin/reports/:id/status
    // @desc    Update report status (for admin)
    // @access  Private (Admin only)
    router.put('/reports/:id/status', protect, authorizeAdmin, async (req, res) => {
        const reportId = req.params.id;
        const { status } = req.body; // 'Pending', 'Reviewed', 'Dismissed', 'Action Taken'
        const adminId = req.user.user_id;

        if (!status || !['Pending', 'Reviewed', 'Dismissed', 'Action Taken'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid report status provided.' });
        }

        let client;
        try {
            client = await pool.connect();
            await client.query('BEGIN'); // Start transaction

            const currentReport = await pool.query('SELECT status FROM Reports WHERE report_id = $1', [reportId]);
            if (currentReport.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ msg: 'Report not found.' });
            }

            const currentStatus = currentReport.rows[0].status;
            let updateQuery = `UPDATE Reports SET status = $1`;
            const queryParams = [status, reportId];
            let paramIndex = 3; 

            if (currentStatus === 'Pending' && status !== 'Pending') {
                updateQuery += `, resolved_at = CURRENT_TIMESTAMP, resolved_by = $${paramIndex}`;
                queryParams.push(adminId);
                paramIndex++;
            }
            
            updateQuery += ` WHERE report_id = $2 RETURNING *`;

            const updatedReport = await client.query(updateQuery, queryParams);

            if (updatedReport.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ msg: 'Report not found or not updated.' });
            }

            const { reporter_id, reported_user_id, report_type } = updatedReport.rows[0];

            // Notify the original reporter about the status change
            await client.query(
                `INSERT INTO Notifications (notification_id, user_id, related_report_id, message, type, created_at)
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
                [uuidv4(), reporter_id, reportId, `Your report (${report_type}) has been updated to: ${status}.`, 'report_status_update']
            );

            if (status === 'Action Taken' || status === 'Dismissed') {
                const reportedUserMessage = status === 'Action Taken'
                    ? `Action has been taken regarding a report against your account (${report_type}).`
                    : `The report against your account (${report_type}) has been dismissed.`;
                await client.query(
                    `INSERT INTO Notifications (notification_id, user_id, related_report_id, message, type, created_at)
                     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
                    [uuidv4(), reported_user_id, reportId, reportedUserMessage, `report_against_you_${status.toLowerCase().replace(' ', '_')}`]
                );
            }

            await client.query('COMMIT');
            res.json({ msg: `Report status updated to ${status}.`, report: updatedReport.rows[0] });

        } catch (err) {
            if (client) await client.query('ROLLBACK');
            console.error('Update Report Status Error:', err.message);
            res.status(500).json({ msg: 'Server Error updating report status', error: err.message });
        } finally {
            if (client) client.release();
        }
    });

    // @route   GET /api/admin/users
    // @desc    Get all users (for admin user management)
    // @access  Private (Admin only)
    router.get('/users', protect, authorizeAdmin, async (req, res) => { // NOTE: This path is /api/admin/users
        try {
            const users = await pool.query(
                `SELECT user_id, first_name, last_name, username, email, phone_number, role, address, is_banned, created_at
                 FROM Users ORDER BY created_at DESC` // NEW: Select is_banned
            );
            res.json(users.rows);
        } catch (err) {
            console.error('Admin Get Users Error:', err.message);
            res.status(500).send('Server Error fetching users');
        }
    });

    // @route   PUT /api/admin/users/:id
    // @desc    Update user details (for admin)
    // @access  Private (Admin only)
    router.put('/users/:id', protect, authorizeAdmin, async (req, res) => {
        const userIdToUpdate = req.params.id;
        const { firstName, lastName, email, phoneNumber, username, address, role, isBanned } = req.body; // NEW: Include isBanned

        if (typeof isBanned !== 'boolean') { // NEW: Validate isBanned
            return res.status(400).json({ msg: 'The isBanned field must be a boolean.' });
        }

        try {
            if (!firstName || !lastName || !email || !username || !role) { // isBanned is now validated separately
                return res.status(400).json({ msg: 'First name, last name, email, username, and role are required' });
            }

            const emailCheck = await pool.query('SELECT user_id FROM Users WHERE email = $1 AND user_id != $2', [email, userIdToUpdate]);
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ msg: 'Email already in use by another account.' });
            }
            const usernameCheck = await pool.query('SELECT user_id FROM Users WHERE username = $1 AND user_id != $2', [username, userIdToUpdate]);
            if (usernameCheck.rows.length > 0) {
                return res.status(400).json({ msg: 'Username already taken by another account.' });
            }

            if (!['member', 'admin'].includes(role)) {
                return res.status(400).json({ msg: 'Invalid role specified. Must be "member" or "admin".' });
            }

            let client;
            try {
                client = await pool.connect();
                await client.query('BEGIN');

                // Fetch old user details to check for changes in is_banned status
                const oldUserResult = await client.query('SELECT is_banned FROM Users WHERE user_id = $1', [userIdToUpdate]);
                const oldIsBanned = oldUserResult.rows[0]?.is_banned;

                const updatedUser = await client.query(
                    `UPDATE Users SET
                        first_name = $1,
                        last_name = $2,
                        email = $3,
                        phone_number = $4,
                        username = $5,
                        address = $6,
                        role = $7,
                        is_banned = $8, -- NEW: Update is_banned
                        updated_at = CURRENT_TIMESTAMP
                       WHERE user_id = $9
                       RETURNING user_id, first_name, last_name, email, phone_number, username, role, address, is_banned`,
                    [firstName, lastName, email, phoneNumber, username, address, role, isBanned, userIdToUpdate]
                );

                if (updatedUser.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ msg: 'User not found' });
                }

                // Notify the user if their ban status changed
                if (oldIsBanned !== isBanned) {
                    const notificationMessage = isBanned 
                        ? `Your account has been banned by an administrator due to policy violations. Please contact support if you believe this is an error.`
                        : `Your account has been unbanned by an administrator and access restored.`;
                    const notificationType = isBanned ? 'account_banned' : 'account_unbanned';

                    await client.query(
                        `INSERT INTO Notifications (notification_id, user_id, message, type, created_at)
                         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
                        [uuidv4(), userIdToUpdate, notificationMessage, notificationType]
                    );
                }

                await client.query('COMMIT');
                res.json({
                    msg: 'User updated successfully',
                    user: {
                        id: updatedUser.rows[0].user_id,
                        firstName: updatedUser.rows[0].first_name,
                        lastName: updatedUser.rows[0].last_name,
                        email: updatedUser.rows[0].email,
                        phoneNumber: updatedUser.rows[0].phone_number,
                        username: updatedUser.rows[0].username,
                        role: updatedUser.rows[0].role,
                        address: updatedUser.rows[0].address,
                        is_banned: updatedUser.rows[0].is_banned
                    }
                });
            } catch (err) {
                if (client) await client.query('ROLLBACK');
                console.error('Admin Update User Error:', err.message);
                res.status(500).send('Server Error updating user');
            } finally {
                if (client) client.release();
            }
        } catch (err) {
            console.error('Admin Update User (Outer) Error:', err.message);
            res.status(500).send('Server Error updating user (outer)');
        }
    });

    // @route   PUT /api/admin/users/:id/ban
    // @desc    Ban or unban a user (Admin only, direct toggle)
    // @access  Private (Admin only)
    // This route is specifically for banning/unbanning without full profile edit
    router.put('/users/:id/ban', protect, authorizeAdmin, async (req, res) => {
        const userIdToBan = req.params.id;
        const { isBanned } = req.body; // boolean: true to ban, false to unban

        if (typeof isBanned !== 'boolean') {
            return res.status(400).json({ msg: 'Please provide a boolean value for isBanned.' });
        }

        let client;
        try {
            client = await pool.connect();
            await client.query('BEGIN');

            if (req.user.user_id === userIdToBan) {
                await client.query('ROLLBACK');
                return res.status(400).json({ msg: 'Admins cannot ban or unban their own account.' });
            }
            
            // Fetch old state to decide notification message
            const oldUserResult = await client.query('SELECT is_banned FROM Users WHERE user_id = $1', [userIdToBan]);
            if (oldUserResult.rows.length === 0) {
                 await client.query('ROLLBACK');
                 return res.status(404).json({ msg: 'User not found.' });
            }
            const oldIsBanned = oldUserResult.rows[0].is_banned;


            const result = await client.query(
                `UPDATE Users SET is_banned = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING user_id, username, is_banned`,
                [isBanned, userIdToBan]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ msg: 'User not found.' });
            }

            const updatedUser = result.rows[0];

            // Only notify if the status actually changed
            if (oldIsBanned !== isBanned) {
                const notificationMessage = isBanned 
                    ? `Your account has been banned due to policy violations. Please contact support if you believe this is an error.`
                    : `Your account has been unbanned and access restored.`;
                const notificationType = isBanned ? 'account_banned' : 'account_unbanned';

                await client.query(
                    `INSERT INTO Notifications (notification_id, user_id, message, type, created_at)
                     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
                    [uuidv4(), userIdToBan, notificationMessage, notificationType]
                );
            }

            await client.query('COMMIT');
            res.json({
                msg: `User ${updatedUser.username} has been ${isBanned ? 'banned' : 'unbanned'}.`,
                user: updatedUser
            });

        } catch (err) {
            if (client) await client.query('ROLLBACK');
            console.error('Ban/Unban User Error:', err.message);
            res.status(500).json({ msg: 'Server Error banning/unbanning user', error: err.message });
        } finally {
            if (client) client.release();
        }
    });

    router.delete('/users/:id', protect, authorizeAdmin, async (req, res) => {
        const userIdToDelete = req.params.id;
        const adminUserId = req.user.user_id;

        try {
            if (userIdToDelete === adminUserId) {
                return res.status(400).json({ msg: 'Admins cannot delete their own account via this panel.' });
            }

            const adminCountResult = await pool.query("SELECT COUNT(*) FROM Users WHERE role = 'admin'");
            const adminCount = parseInt(adminCountResult.rows[0].count);
            const targetUserRoleResult = await pool.query("SELECT role FROM Users WHERE user_id = $1", [userIdToDelete]);
            const targetUserRole = targetUserRoleResult.rows[0]?.role;

            if (targetUserRole === 'admin' && adminCount <= 1) {
                return res.status(400).json({ msg: 'Cannot delete the last remaining admin account.' });
            }

            let client;
            try {
                client = await pool.connect();
                await client.query('BEGIN');

                // Delete associated notifications and reviews related to this user (as reporter, reported, or owner of resource)
                // Reports related to this user (as reporter, reported, or resolved_by)
                await client.query('DELETE FROM Reports WHERE reporter_id = $1 OR reported_user_id = $1 OR resolved_by = $1', [userIdToDelete]);
                // Requests made by or for resources owned by this user
                await client.query('DELETE FROM Requests WHERE requester_id = $1 OR owner_id = $1', [userIdToDelete]);
                // Transactions where this user is borrower or lender
                await client.query('DELETE FROM Transactions WHERE borrower_id = $1 OR lender_id = $1', [userIdToDelete]);
                // Reviews by this user or for resources owned by this user
                await client.query('DELETE FROM Reviews WHERE reviewer_id = $1 OR resource_id IN (SELECT resource_id FROM Resources WHERE owner_id = $1)', [userIdToDelete]);
                // Notifications for this user or related to reports/requests/resources involving this user
                await client.query('DELETE FROM Notifications WHERE user_id = $1 OR related_report_id IN (SELECT report_id FROM Reports WHERE reported_user_id = $1 OR reporter_id = $1 OR resolved_by = $1) OR related_request_id IN (SELECT request_id FROM Requests WHERE requester_id = $1 OR owner_id = $1) OR related_resource_id IN (SELECT resource_id FROM Resources WHERE owner_id = $1)', [userIdToDelete]);
                // Resources owned by this user
                await client.query('DELETE FROM Resources WHERE owner_id = $1', [userIdToDelete]);

                const deleteResult = await client.query('DELETE FROM Users WHERE user_id = $1 RETURNING user_id', [userIdToDelete]);

                if (deleteResult.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ msg: 'User not found' });
                }

                await client.query('COMMIT');
                res.json({ msg: 'User deleted successfully', userId: userIdToDelete });

            } catch (err) {
                if (client) await client.query('ROLLBACK');
                console.error('Admin Delete User Transaction Error:', err.message);
                res.status(500).send('Server Error deleting user');
            } finally {
                if (client) client.release();
            }

        } catch (err) {
            console.error('Admin Delete User Error:', err.message);
            res.status(500).send('Server Error deleting user (outer catch)');
        }
    });

    router.get('/resources', protect, authorizeAdmin, async (req, res) => {
        try {
            const resources = await pool.query(
                `SELECT r.resource_id, r.name, r.description, r.category, r.location, r.availability_status, r.posted_at, r.image_url, u.username as owner_username
                   FROM Resources r
                   JOIN Users u ON r.owner_id = u.user_id
                   ORDER BY r.posted_at DESC`
            );
            res.json(resources.rows); // Returns data in snake_case directly from DB
        } catch (err) {
            console.error('Admin Get Resources Error:', err.message);
            res.status(500).send('Server Error fetching resources');
        }
    });

    router.put('/resources/:id', protect, authorizeAdmin, async (req, res) => {
        const resourceIdToUpdate = req.params.id;
        const { name, description, category, location, availability_status, image_url } = req.body;

        try {
            if (!name || !description || !category || !location || !availability_status) {
                return res.status(400).json({ msg: 'All resource fields are required' });
            }

            if (!['Available', 'Reserved', 'Borrowed', 'Donated'].includes(availability_status)) {
                return res.status(400).json({ msg: 'Invalid availability status.' });
            }

            let client;
            try {
                client = await pool.connect();
                await client.query('BEGIN');

                const updatedResource = await client.query(
                    `UPDATE Resources SET
                        name = $1,
                        description = $2,
                        category = $3,
                        location = $4,
                        availability_status = $5,
                        image_url = $6,
                        updated_at = CURRENT_TIMESTAMP
                       WHERE resource_id = $7
                       RETURNING resource_id, name, description, category, location, availability_status, posted_at, image_url`,
                    [name, description, category, location, availability_status, image_url, resourceIdToUpdate]
                );

                if (updatedResource.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ msg: 'Resource not found' });
                }

                await client.query('COMMIT');
                res.json({ msg: 'Resource updated successfully', resource: updatedResource.rows[0] });

            } catch (err) {
                if (client) await client.query('ROLLBACK');
                console.error('Admin Update Resource Error:', err.message);
                res.status(500).send('Server Error updating resource');
            } finally {
                if (client) client.release();
            }

        } catch (err) {
            console.error('Admin Update Resource (Outer) Error:', err.message);
            res.status(500).send('Server Error updating resource (outer)');
        }
    });

    router.delete('/resources/:id', protect, authorizeAdmin, async (req, res) => {
        const resourceIdToDelete = req.params.id;

        try {
            let client;
            try {
                client = await pool.connect();
                await client.query('BEGIN');

                await client.query('DELETE FROM Notifications WHERE related_resource_id = $1', [resourceIdToDelete]);
                await client.query('DELETE FROM Reviews WHERE resource_id = $1', [resourceIdToDelete]);
                await client.query('UPDATE Requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE resource_id = $2 AND status IN ($3, $4)',
                    ['Cancelled', resourceIdToDelete, 'Pending', 'Accepted']);

                const deleteResult = await pool.query('DELETE FROM Resources WHERE resource_id = $1 RETURNING resource_id', [resourceIdToDelete]);

                if (deleteResult.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ msg: 'Resource not found' });
                }

                await client.query('COMMIT');
                res.json({ msg: 'Resource deleted successfully', resourceId: resourceIdToDelete });

            } catch (err) {
                if (client) await client.query('ROLLBACK');
                console.error('Admin Delete Resource Transaction Error:', err.message);
                res.status(500).send('Server Error deleting resource');
            } finally {
                if (client) client.release();
            }

        } catch (err) {
            console.error('Admin Delete Resource Error:', err.message);
            res.status(500).send('Server Error deleting resource (outer catch)');
        }
    });

    // NEW: Request Management Routes
    // This route already exists in your provided adminRoutes.js, just making sure.
    // It's good as is.
    router.get('/requests', protect, authorizeAdmin, async (req, res) => {
        try {
            const requests = await pool.query(
                `SELECT
                    req.request_id,
                    req.requester_id,
                    req_user.username AS requester_username,
                    req.resource_id,
                    res.name AS resource_name,
                    res.owner_id,
                    owner_user.username AS owner_username,
                    req.pickup_date,
                    req.return_date,
                    req.status,
                    req.requested_at,
                    req.updated_at
                FROM Requests req
                JOIN Users req_user ON req.requester_id = req_user.user_id
                JOIN Resources res ON req.resource_id = res.resource_id
                JOIN Users owner_user ON res.owner_id = owner_user.user_id
                ORDER BY req.requested_at DESC`
            );
            res.json(requests.rows);
        } catch (err) {
            console.error('Admin Get Requests Error:', err.message);
            res.status(500).json({ msg: 'Server Error fetching requests', error: err.message });
        }
    });

    // @route   PUT /api/admin/requests/:id/status
    // @desc    Update the status of a request (approve/reject/complete)
    // @access  Private (Admin only)
    // This route already exists and seems fine.
    router.put('/requests/:id/status', protect, authorizeAdmin, async (req, res) => {
        const requestId = req.params.id;
        const { status } = req.body; 

        if (!status || !['Approved', 'Rejected', 'Completed'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid request status provided. Must be Approved, Rejected, or Completed.' });
        }

        let client;
        try {
            client = await pool.connect();
            await client.query('BEGIN');

            const requestCheck = await client.query('SELECT status, resource_id, requester_id, owner_id FROM Requests WHERE request_id = $1 FOR UPDATE', [requestId]);
            if (requestCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ msg: 'Request not found.' });
            }

            const currentRequest = requestCheck.rows[0];
            const resourceId = currentRequest.resource_id;
            const requesterId = currentRequest.requester_id;
            const resourceOwnerId = currentRequest.owner_id;

            const updatedRequest = await client.query(
                `UPDATE Requests SET status = $1, updated_at = CURRENT_TIMESTAMP
                WHERE request_id = $2
                RETURNING *`,
                [status, requestId]
            );

            if (updatedRequest.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ msg: 'Request not found or not updated.' });
            }

            if (status === 'Approved') {
                await client.query(
                    `UPDATE Resources SET availability_status = 'Reserved', updated_at = CURRENT_TIMESTAMP
                    WHERE resource_id = $1 AND availability_status = 'Available'`,
                    [resourceId]
                );
                
                const resourceNameResult = await client.query('SELECT name FROM Resources WHERE resource_id = $1', [resourceId]);
                const resourceName = resourceNameResult.rows[0]?.name || 'a resource';

                await client.query(
                    'INSERT INTO Notifications (notification_id, user_id, message, type, is_read, created_at) VALUES ($1, $2, $3, $4, FALSE, CURRENT_TIMESTAMP)',
                    [uuidv4(), requesterId, `Your request for '${resourceName}' has been approved by admin!`, 'request_approved']
                );
            } else if (status === 'Rejected') {
                const resourceNameResult = await client.query('SELECT name FROM Resources WHERE resource_id = $1', [resourceId]);
                const resourceName = resourceNameResult.rows[0]?.name || 'a resource';

                await client.query(
                    'INSERT INTO Notifications (notification_id, user_id, message, type, is_read, created_at) VALUES ($1, $2, $3, $4, FALSE, CURRENT_TIMESTAMP)',
                    [uuidv4(), requesterId, `Your request for '${resourceName}' has been rejected by admin.`, 'request_rejected']
                );
            } else if (status === 'Completed') {
                const resourceNameResult = await client.query('SELECT name FROM Resources WHERE resource_id = $1', [resourceId]);
                const resourceName = resourceNameResult.rows[0]?.name || 'a resource';
                const requesterUsernameResult = await client.query('SELECT username FROM Users WHERE user_id = $1', [requesterId]);
                const requesterUsername = requesterUsernameResult.rows[0]?.username || 'a user';

                await client.query(
                    'INSERT INTO Notifications (notification_id, user_id, message, type, is_read, created_at) VALUES ($1, $2, $3, $4, FALSE, CURRENT_TIMESTAMP)',
                    [uuidv4(), requesterId, `Your request for '${resourceName}' has been marked as completed by admin.`, 'request_completed']
                );
                await client.query(
                    'INSERT INTO Notifications (notification_id, user_id, message, type, is_read, created_at) VALUES ($1, $2, $3, $4, FALSE, CURRENT_TIMESTAMP)',
                    [uuidv4(), resourceOwnerId, `Request for your resource '${resourceName}' by ${requesterUsername} has been marked as completed by admin.`, 'resource_completed']
                );
            }

            await client.query('COMMIT');
            res.json({ msg: `Request status updated to ${status}.`, request: updatedRequest.rows[0] });

        } catch (err) {
            if (client) await client.query('ROLLBACK');
            console.error('Update Request Status Error:', err.message);
            res.status(500).json({ msg: 'Server Error updating request status', error: err.message });
        } finally {
            if (client) client.release();
        }
    });

    // @route   DELETE /api/admin/requests/:id
    // @desc    Delete a request (e.g., if it's fraudulent or an error)
    // @access  Private (Admin only)
    // This route already exists and seems fine.
    router.delete('/requests/:id', protect, authorizeAdmin, async (req, res) => {
        const requestIdToDelete = req.params.id;

        try {
            const deleteResult = await pool.query('DELETE FROM Requests WHERE request_id = $1 RETURNING request_id', [requestIdToDelete]);

            if (deleteResult.rows.length === 0) {
                return res.status(404).json({ msg: 'Request not found' });
            }

            res.json({ msg: 'Request deleted successfully', requestId: requestIdToDelete });

        } catch (err) {
            console.error('Admin Delete Request Error:', err.message);
            res.status(500).send('Server Error deleting request');
        }
    });

    return router;
};
