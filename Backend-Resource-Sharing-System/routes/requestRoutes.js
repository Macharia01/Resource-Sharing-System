// backend/routes/requestRoutes.js

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const protect = require('../middleware/auth'); // Import authentication middleware

// This function will be called from server.js and receive the pool
module.exports = (pool) => {
    const router = express.Router();

    // @route   POST /api/requests
    // @desc    Submit a new borrow request
    // @access  Private (requires authentication)
    router.post('/requests', protect, async (req, res) => {
        const { resourceId, pickupDate, returnDate, pickupMethod, messageToOwner, borrowLocation } = req.body;
        const requesterId = req.user.user_id; // Access user_id (snake_case)
        const requesterUsername = req.user.username; // This is fine as it's from decoded JWT

        if (!resourceId || !pickupDate || !returnDate || !pickupMethod || !borrowLocation) {
            return res.status(400).json({ msg: 'Please provide all required fields for the borrow request.' });
        }

        let client;
        try {
            client = await pool.connect();
            await client.query('BEGIN');

            const resourceResult = await client.query(
                'SELECT owner_id, name, availability_status FROM Resources WHERE resource_id = $1',
                [resourceId]
            );

            if (resourceResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ msg: 'Resource not found.' });
            }

            const { owner_id, name: resourceName, availability_status: currentResourceStatus } = resourceResult.rows[0];

            if (requesterId === owner_id) {
                await client.query('ROLLBACK');
                return res.status(400).json({ msg: 'You cannot request your own item.' });
            }

            if (currentResourceStatus !== 'Available') {
                await client.query('ROLLBACK');
                return res.status(400).json({ msg: `This item is currently ${currentResourceStatus.toLowerCase()} and cannot be requested.` });
            }

            const parsedPickupDate = new Date(pickupDate);
            const parsedReturnDate = new Date(returnDate);

            if (isNaN(parsedPickupDate.getTime()) || isNaN(parsedReturnDate.getTime())) {
                await client.query('ROLLBACK');
                return res.status(400).json({ msg: 'Invalid date format. Please use ISO-MM-DD.' });
            }

            if (parsedReturnDate < parsedPickupDate) {
                await client.query('ROLLBACK');
                return res.status(400).json({ msg: 'Return date cannot be before pickup date.' });
            }

            // Generate request_id as UUID for new request
            const request_id = uuidv4();

            const newRequest = await client.query(
                `INSERT INTO Requests (
                    request_id, resource_id, requester_id, owner_id, pickup_date, return_date,
                    pickup_method, message_to_owner, borrow_location, status, requested_at
                   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending', CURRENT_TIMESTAMP)
                   RETURNING *`,
                [request_id, resourceId, requesterId, owner_id, pickupDate, returnDate, pickupMethod, messageToOwner, borrowLocation]
            );

            await client.query(
                `UPDATE Resources SET availability_status = 'Reserved', updated_at = CURRENT_TIMESTAMP
                 WHERE resource_id = $1`,
                [resourceId]
            );

            await client.query(
                `INSERT INTO Notifications (notification_id, user_id, related_request_id, message, type, created_at)
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`, 
                [uuidv4(), owner_id, newRequest.rows[0].request_id, `${requesterUsername} has requested to borrow your item: "${resourceName}"`, 'new_request']
            );

            await client.query('COMMIT');
            res.status(201).json({
                msg: 'Borrow request submitted successfully! Item status updated to Reserved.',
                request: newRequest.rows[0]
            });

        } catch (err) {
            if (client) await client.query('ROLLBACK');
            console.error('Detailed Submit Request Error:', err.message);
            if (err.message.includes('invalid input syntax for type uuid')) {
                return res.status(400).json({ msg: 'Invalid ID format for resource or user. Please ensure IDs are valid UUIDs.' });
            }
            res.status(500).json({ msg: 'Server Error submitting borrow request', error: err.message });
        } finally {
            if (client) client.release();
        }
    });


    // @route   GET /api/requests/received
    // @desc    Get all borrow requests received by the authenticated user (for their items)
    // @access  Private (owner of items)
    router.get('/requests/received', protect, async (req, res) => {
        const ownerId = req.user.user_id; // Access user_id (snake_case)
        try {
            const receivedRequests = await pool.query(
                `SELECT
                    r.request_id,
                    r.resource_id,
                    res.name as resource_name,
                    res.description as resource_description,
                    res.category as resource_category,
                    res.location as resource_location,
                    res.availability_status as current_resource_status,
                    r.requester_id,
                    u.username as requester_username,
                    u.email as requester_email,
                    u.phone_number as requester_phone_number,
                    u.address as requester_address,
                    r.pickup_date,
                    r.return_date,
                    r.pickup_method,
                    r.message_to_owner,
                    r.borrow_location,
                    r.status,
                    r.requested_at,
                    t.transaction_id -- Include transaction_id to check if review is possible
                   FROM Requests r
                   JOIN Resources res ON r.resource_id = res.resource_id
                   JOIN Users u ON r.requester_id = u.user_id
                   LEFT JOIN Transactions t ON r.request_id = t.request_id
                   WHERE r.owner_id = $1
                   ORDER BY r.requested_at DESC`,
                [ownerId]
            );
            res.json(receivedRequests.rows);
        } catch (err) {
            console.error('Get Received Requests Error:', err.message);
            res.status(500).json({ msg: 'Server Error fetching received requests', error: err.message });
        }
    });

    // @route   GET /api/requests/sent
    // @desc    Get all borrow requests sent by the authenticated user
    // @access  Private (requester)
    router.get('/requests/sent', protect, async (req, res) => {
        const requesterId = req.user.user_id; // Access user_id (snake_case)
        try {
            const sentRequests = await pool.query(
                `SELECT
                    r.request_id,
                    r.resource_id,
                    res.name as resource_name,
                    res.description as resource_description,
                    res.category as resource_category,
                    res.location as resource_location,
                    res.availability_status as current_resource_status,
                    r.owner_id,
                    u.username as owner_username,
                    u.email as owner_email,
                    u.phone_number as owner_phone_number,
                    u.address as owner_address,
                    r.pickup_date,
                    r.return_date,
                    r.pickup_method,
                    r.message_to_owner,
                    r.borrow_location,
                    r.status,
                    r.requested_at,
                    t.transaction_id -- Include transaction_id
                   FROM Requests r
                   JOIN Resources res ON r.resource_id = res.resource_id
                   JOIN Users u ON r.owner_id = u.user_id
                   LEFT JOIN Transactions t ON r.request_id = t.request_id
                   WHERE r.requester_id = $1
                   ORDER BY r.requested_at DESC`,
                [requesterId]
            );
            res.json(sentRequests.rows);
        } catch (err) {
            console.error('Get Sent Requests Error:', err.message);
            res.status(500).json({ msg: 'Server Error fetching sent requests', error: err.message });
        }
    });

    // @route   PUT /api/requests/:id/status
    // @desc    Update the status of a borrow request (Accept, Reject, Cancel, Complete)
    // @access  Private (owner for Accept/Reject/Complete, requester for Cancel)
    router.put('/requests/:id/status', protect, async (req, res) => {
        const requestId = req.params.id;
        const { status } = req.body; // New status: 'Accepted', 'Rejected', 'Cancelled', 'Completed'
        const userId = req.user.user_id; // Access user_id (snake_case)
        const userRole = req.user.role;
        const username = req.user.username;

        if (!status || !['Accepted', 'Rejected', 'Cancelled', 'Completed'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid status provided.' });
        }

        let client;
        try {
            client = await pool.connect();
            await client.query('BEGIN'); // Start transaction

            // Get request details to verify ownership/requester status
            const requestDetails = await client.query(
                `SELECT r.owner_id, r.requester_id, r.resource_id, r.status as current_status, res.name as resource_name,
                        r.pickup_date, r.return_date, r.pickup_method
                 FROM Requests r
                 JOIN Resources res ON r.resource_id = res.resource_id
                 WHERE r.request_id = $1 FOR UPDATE`, // FOR UPDATE to lock row during transaction
                [requestId]
            );

            if (requestDetails.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ msg: 'Borrow request not found.' });
            }

            const { owner_id, requester_id, resource_id, current_status, resource_name,
                    pickup_date, return_date, pickup_method } = requestDetails.rows[0];

            // Authorization logic based on desired status change
            let notificationMessage = '';
            let notificationType = '';
            let recipientId;
            let updatePermitted = false;
            let newResourceStatus = null; // To update resource's availability_status

            // Prevent status changes if request is already completed/rejected/cancelled
            if (current_status === 'Completed' || current_status === 'Rejected' || current_status === 'Cancelled') {
                await client.query('ROLLBACK');
                return res.status(400).json({ msg: `Cannot change status of a request that is already ${current_status}.` });
            }

            if (status === 'Accepted') {
                if (userId !== owner_id && userRole !== 'admin') {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ msg: 'Forbidden: Only the owner or an admin can accept this request.' });
                }
                if (current_status !== 'Pending') {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ msg: 'Only pending requests can be accepted.' });
                }
                updatePermitted = true;
                newResourceStatus = 'Reserved'; 
                notificationMessage = `${username} has accepted your request for "${resource_name}"!`;
                notificationType = 'request_accepted';
                recipientId = requester_id;

                // NEW: Create a transaction entry when request is accepted
                const transaction_id = uuidv4();
                await client.query(
                    `INSERT INTO Transactions (transaction_id, request_id, borrower_id, lender_id, resource_id,
                                            borrow_date, return_date_agreed, status, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active', CURRENT_TIMESTAMP)`,
                    [transaction_id, requestId, requester_id, owner_id, resource_id, pickup_date, return_date]
                );

                // Immediately reject all other pending requests for this resource
                const otherPendingRequests = await client.query(
                    `SELECT requester_id, request_id FROM Requests
                     WHERE resource_id = $1 AND request_id != $2 AND status = 'Pending'`,
                    [resource_id, requestId]
                );

                await client.query(
                    `UPDATE Requests SET status = 'Rejected', updated_at = CURRENT_TIMESTAMP
                     WHERE resource_id = $1 AND request_id != $2 AND status = 'Pending'`,
                    [resource_id, requestId]
                );
                
                // Notify other requesters about rejection
                for (const req of otherPendingRequests.rows) {
                    await client.query(
                        `INSERT INTO Notifications (notification_id, user_id, related_request_id, message, type, created_at)
                         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`, 
                        [uuidv4(), req.requester_id, req.request_id, `Your request for "${resource_name}" has been rejected because another request for it was accepted.`, 'request_rejected']
                    );
                }

            } else if (status === 'Rejected') {
                if (userId !== owner_id && userRole !== 'admin') {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ msg: 'Forbidden: Only the owner or an admin can reject this request.' });
                }
                if (current_status !== 'Pending') {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ msg: 'Only pending requests can be rejected.' });
                }
                updatePermitted = true;
                newResourceStatus = 'Available'; // Item becomes available again
                notificationMessage = `${username} has rejected your request for "${resource_name}".`;
                notificationType = 'request_rejected';
                recipientId = requester_id;

            } else if (status === 'Cancelled') {
                // Requester, owner, or admin can cancel
                if (userId !== requester_id && userId !== owner_id && userRole !== 'admin') {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ msg: 'Forbidden: You do not have permission to cancel this request.' });
                }
                if (current_status === 'Completed' || current_status === 'Rejected') {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ msg: `Cannot cancel a request that is already ${current_status}.` });
                }
                updatePermitted = true;
                newResourceStatus = 'Available'; // Item becomes available again

                // If a transaction exists, update its status to 'Canceled'
                await client.query(
                    `UPDATE Transactions SET status = 'Canceled', updated_at = CURRENT_TIMESTAMP
                     WHERE request_id = $1`,
                    [requestId]
                );

                if (userId === requester_id) { // Requester cancelled
                    notificationMessage = `${username} cancelled their request for your item: "${resource_name}".`;
                    notificationType = 'request_cancelled';
                    recipientId = owner_id;
                } else { // Owner or Admin cancelled
                    notificationMessage = `${username} cancelled your request for "${resource_name}".`;
                    notificationType = 'request_cancelled';
                    recipientId = requester_id;
                }

            } else if (status === 'Completed') {
                if (userId !== owner_id && userRole !== 'admin') {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ msg: 'Forbidden: Only the owner or an admin can mark this request as completed.' });
                }
                if (current_status !== 'Accepted') { // Only accepted requests can be completed
                    await client.query('ROLLBACK');
                    return res.status(400).json({ msg: 'Only accepted requests can be marked as completed.' });
                }
                updatePermitted = true;
                newResourceStatus = 'Available'; // Item is available again after completion

                // NEW: Update transaction status to 'Completed' and set actual_return_date
                const transactionUpdate = await client.query(
                    `UPDATE Transactions SET status = 'Completed', actual_return_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                     WHERE request_id = $1
                     RETURNING *`,
                    [requestId]
                );
                
                if (transactionUpdate.rows.length === 0) {
                     await client.query('ROLLBACK');
                     return res.status(404).json({ msg: 'Corresponding transaction not found for completion.' });
                }

                notificationMessage = `${username} has marked your borrow of "${resource_name}" as completed.`;
                notificationType = 'borrow_completed';
                recipientId = requester_id;
                
                // Also notify the owner that the request was completed
                await client.query(
                    `INSERT INTO Notifications (notification_id, user_id, related_request_id, message, type, created_at)
                     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
                    [uuidv4(), owner_id, requestId, `Request for your resource '${resource_name}' by ${req.user.username} has been marked as completed.`, 'resource_completed']
                );
            }

            if (!updatePermitted) {
                await client.query('ROLLBACK');
                return res.status(400).json({ msg: 'Invalid status transition or insufficient permissions.' });
            }

            // Update request status
            const updatedRequest = await client.query(
                `UPDATE Requests SET status = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE request_id = $2
                 RETURNING *`, 
                [status, requestId]
            );

            if (updatedRequest.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ msg: 'Request not found.' }); 
            }

            // Update resource availability status if applicable
            if (newResourceStatus) {
                await client.query(
                    `UPDATE Resources SET availability_status = $1, updated_at = CURRENT_TIMESTAMP
                     WHERE resource_id = $2`,
                    [newResourceStatus, resource_id]
                );
            }

            // Insert notification
            if (notificationMessage && recipientId) {
                await client.query(
                    `INSERT INTO Notifications (notification_id, user_id, related_request_id, message, type, created_at)
                     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`, 
                    [uuidv4(), recipientId, requestId, notificationMessage, notificationType]
                );
            }

            await client.query('COMMIT'); // Commit transaction
            res.json({ msg: `Request status updated to ${status} successfully!`, request: updatedRequest.rows[0] });

        } catch (err) {
            if (client) await client.query('ROLLBACK');
            console.error('Update Request Status Error:', err.message);
            if (err.message.includes('invalid input syntax for type uuid')) {
                return res.status(400).json({ msg: 'Invalid ID format for resource or user. Please ensure IDs are valid UUIDs.' });
            }
            res.status(500).json({ msg: 'Server Error updating request status', error: err.message });
        } finally {
            if (client) client.release();
        }
    });

    // Removed review routes that are now in reviewRoutes.js

    return router;
};
