const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const protect = require('./middleware/auth');
const authorizeAdmin = require('./middleware/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000'
}));

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Connected to PostgreSQL database!');
    client.release();
});

// --- API Routes ---

// @route   POST /api/signup
// @desc    Register a new user
// @access  Public
app.post('/api/signup', async (req, res) => {
    const { firstName, lastName, email, phoneNumber, password, username, address } = req.body;

    if (!firstName || !lastName || !email || !password || !username) {
        return res.status(400).json({ msg: 'Please enter all required fields: First Name, Last Name, Email, Username, Password' });
    }

    try {
        const emailExists = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (emailExists.rows.length > 0) {
            return res.status(400).json({ msg: 'User with this email already exists' });
        }

        const usernameExists = await pool.query('SELECT * FROM Users WHERE username = $1', [username]);
        if (usernameExists.rows.length > 0) {
            return res.status(400).json({ msg: 'This username is already taken' });
        }

        let role = 'member';

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO Users (first_name, last_name, email, phone_number, password_hash, username, address, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING user_id, first_name, last_name, email, phone_number, username, address, role',
            [firstName, lastName, email, phoneNumber, passwordHash, username, address, role]
        );

        const token = jwt.sign(
            { userId: newUser.rows[0].user_id, role: newUser.rows[0].role, username: newUser.rows[0].username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            msg: 'User registered successfully',
            token,
            user: {
                id: newUser.rows[0].user_id,
                firstName: newUser.rows[0].first_name,
                lastName: newUser.rows[0].last_name,
                email: newUser.rows[0].email,
                phoneNumber: newUser.rows[0].phone_number,
                username: newUser.rows[0].username,
                address: newUser.rows[0].address,
                role: newUser.rows[0].role
            }
        });

    } catch (err) {
        console.error('Signup Error:', err.message);
        res.status(500).send('Server Error during signup');
    }
});

// @route   POST /api/login
// @desc    Authenticate user and get token
// @access  Public
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        const user = await pool.query(
            'SELECT user_id, first_name, last_name, email, phone_number, password_hash, username, role, address FROM Users WHERE email = $1',
            [email]
        );
        if (user.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const storedUser = user.rows[0];

        const isMatch = await bcrypt.compare(password, storedUser.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const token = jwt.sign(
            { userId: storedUser.user_id, role: storedUser.role, username: storedUser.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            msg: 'Logged in successfully',
            token,
            user: {
                id: storedUser.user_id,
                firstName: storedUser.first_name,
                lastName: storedUser.last_name,
                email: storedUser.email,
                phoneNumber: storedUser.phone_number,
                username: storedUser.username,
                role: storedUser.role,
                address: storedUser.address
            }
        });

    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).send('Server Error during login');
    }
});

// @route   GET /api/user/profile
// @desc    Get authenticated user's profile
// @access  Private
app.get('/api/user/profile', protect, async (req, res) => {
    try {
        const user = await pool.query(
            'SELECT user_id, first_name, last_name, email, phone_number, username, role, address FROM Users WHERE user_id = $1',
            [req.user.userId]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user.rows[0]);

    } catch (err) {
        console.error('Get Profile Error:', err.message);
        res.status(500).send('Server Error fetching profile');
    }
});

// @route   PUT /api/user/profile
// @desc    Update authenticated user's profile
// @access  Private
app.put('/api/user/profile', protect, async (req, res) => {
    const { firstName, lastName, email, phoneNumber, username, address } = req.body;
    const userId = req.user.userId;

    try {
        if (!firstName || !lastName || !email || !username) {
            return res.status(400).json({ msg: 'First name, last name, email, and username are required' });
        }

        const emailCheck = await pool.query('SELECT user_id FROM Users WHERE email = $1 AND user_id != $2', [email, userId]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ msg: 'Email already in use by another account.' });
        }
        const usernameCheck = await pool.query('SELECT user_id FROM Users WHERE username = $1 AND user_id != $2', [username, userId]);
        if (usernameCheck.rows.length > 0) {
            return res.status(400).json({ msg: 'Username already taken by another account.' });
        }

        const updatedUser = await pool.query(
            `UPDATE Users SET
                first_name = $1,
                last_name = $2,
                email = $3,
                phone_number = $4,
                username = $5,
                address = $6,
                updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $7
             RETURNING user_id, first_name, last_name, email, phone_number, username, role, address`,
            [firstName, lastName, email, phoneNumber, username, address, userId]
        );

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({
            msg: 'Profile updated successfully',
            user: {
                id: updatedUser.rows[0].user_id,
                firstName: updatedUser.rows[0].first_name,
                lastName: updatedUser.rows[0].last_name,
                email: updatedUser.rows[0].email,
                phoneNumber: updatedUser.rows[0].phone_number,
                username: updatedUser.rows[0].username,
                role: updatedUser.rows[0].role,
                address: updatedUser.rows[0].address
            }
        });

    } catch (err) {
        console.error('Update Profile Error:', err.message);
        res.status(500).send('Server Error updating profile');
    }
});


// --- PUBLIC RESOURCE ROUTES ---

// @route   GET /api/resources
// @desc    Get all resources, with optional search and category filtering
// @access  Public
app.get('/api/resources', async (req, res) => {
    const { search, category } = req.query;

    let query = `
        SELECT r.resource_id, r.name, r.description, r.category, r.location, r.availability_status, r.posted_at, u.username as owner_username
        FROM Resources r
        JOIN Users u ON r.owner_id = u.user_id
    `;
    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;

    // Add search condition
    if (search) {
        conditions.push(`(r.name ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex} OR r.category ILIKE $${paramIndex})`);
        queryParams.push(`%${search}%`);
        paramIndex++;
    }

    // Add category filter condition
    if (category) {
        conditions.push(`r.category = $${paramIndex}`);
        queryParams.push(category);
        paramIndex++;
    }

    // Combine conditions
    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY r.posted_at DESC`;

    try {
        const resources = await pool.query(query, queryParams);
        res.json(resources.rows);
    }
    catch (err) {
        console.error('Get All Resources Error:', err.message);
        res.status(500).send('Server Error fetching all resources');
    }
});

// @route   GET /api/resources/:id
app.get('/api/resources/:id', async (req, res) => {
    const resourceId = req.params.id;
    try {
        const resource = await pool.query(
            `SELECT r.resource_id, r.name, r.description, r.category, r.location, r.availability_status, r.posted_at, r.owner_id,
                    u.username as owner_username, u.first_name as owner_first_name, u.last_name as owner_last_name
             FROM Resources r
             JOIN Users u ON r.owner_id = u.user_id
             WHERE r.resource_id = $1`,
            [resourceId]
        );

        if (resource.rows.length === 0) {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        res.json(resource.rows[0]);
    }
    catch (err) {
        console.error('Get Single Resource Error:', err.message);
        res.status(500).send('Server Error fetching single resource');
    }
});

// @route   POST /api/resources
app.post('/api/resources', protect, async (req, res) => {
    const { name, description, category, location, availability_status } = req.body;
    const ownerId = req.user.userId;

    if (!name || !description || !category || !location || !availability_status) {
        return res.status(400).json({ msg: 'Please enter all required resource fields.' });
    }

    if (!['Available', 'Reserved', 'Borrowed', 'Donated'].includes(availability_status)) {
        return res.status(400).json({ msg: 'Invalid availability status provided.' });
    }

    try {
        const newResource = await pool.query(
            `INSERT INTO Resources (owner_id, name, description, category, location, availability_status)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING resource_id, owner_id, name, description, category, location, availability_status, posted_at`,
            [ownerId, name, description, category, location, availability_status]
        );

        res.status(201).json({
            msg: 'Resource listing created successfully',
            resource: newResource.rows[0]
        });

    } catch (err) {
        console.error('Create Resource Error:', err.message);
        res.status(500).send('Server Error creating resource listing');
    }
});

// --- Request/Borrow API Routes ---

// @route   POST /api/requests
// @desc    Submit a new borrow request
// @access  Private (requires authentication)
app.post('/api/requests', protect, async (req, res) => {
    const { resourceId, pickupDate, returnDate, pickupMethod, messageToOwner, borrowLocation } = req.body;
    const requesterId = req.user.userId;
    const requesterUsername = req.user.username;

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

        const newRequest = await client.query(
            `INSERT INTO Requests (
                resource_id, requester_id, owner_id, pickup_date, return_date,
                pickup_method, message_to_owner, borrow_location, status
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending')
               RETURNING *`,
            [resourceId, requesterId, owner_id, pickupDate, returnDate, pickupMethod, messageToOwner, borrowLocation]
        );

        await client.query(
            `UPDATE Resources SET availability_status = 'Reserved', updated_at = CURRENT_TIMESTAMP
             WHERE resource_id = $1`,
            [resourceId]
        );

        await client.query(
            `INSERT INTO Notifications (user_id, related_request_id, message, type)
             VALUES ($1, $2, $3, $4)`,
            [owner_id, newRequest.rows[0].request_id, `${requesterUsername} has requested to borrow your item: "${resourceName}"`, 'new_request']
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
app.get('/api/requests/received', protect, async (req, res) => {
    const ownerId = req.user.userId;
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
                r.requested_at
             FROM Requests r
             JOIN Resources res ON r.resource_id = res.resource_id
             JOIN Users u ON r.requester_id = u.user_id
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
app.get('/api/requests/sent', protect, async (req, res) => {
    const requesterId = req.user.userId;
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
                r.requested_at
             FROM Requests r
             JOIN Resources res ON r.resource_id = res.resource_id
             JOIN Users u ON r.owner_id = u.user_id
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
app.put('/api/requests/:id/status', protect, async (req, res) => {
    const requestId = req.params.id;
    const { status } = req.body; // New status: 'Accepted', 'Rejected', 'Cancelled', 'Completed'
    const userId = req.user.userId;
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
            `SELECT r.owner_id, r.requester_id, r.resource_id, r.status as current_status, res.name as resource_name
             FROM Requests r
             JOIN Resources res ON r.resource_id = res.resource_id
             WHERE r.request_id = $1`,
            [requestId]
        );

        if (requestDetails.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ msg: 'Borrow request not found.' });
        }

        const { owner_id, requester_id, resource_id, current_status, resource_name } = requestDetails.rows[0];

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
            newResourceStatus = 'Reserved'; // Item remains Reserved
            notificationMessage = `${username} has accepted your request for "${resource_name}"!`;
            notificationType = 'request_accepted';
            recipientId = requester_id;

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
                    `INSERT INTO Notifications (user_id, related_request_id, message, type)
                     VALUES ($1, $2, $3, $4)`,
                    [req.requester_id, req.request_id, `Your request for "${resource_name}" has been rejected because another request for it was accepted.`, 'request_rejected']
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
            notificationMessage = `${username} has marked your borrow of "${resource_name}" as completed.`;
            notificationType = 'borrow_completed';
            recipientId = requester_id;
        }

        if (!updatePermitted) {
            await client.query('ROLLBACK');
            return res.status(400).json({ msg: 'Invalid status transition or insufficient permissions.' });
        }

        // Update request status
        const updatedRequest = await client.query(
            `UPDATE Requests SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE request_id = $2
             RETURNING *`, // No need for owner_id/requester_id in WHERE clause, already authorized
            [status, requestId]
        );

        if (updatedRequest.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ msg: 'Request not found.' }); // Should not happen if authorization passed
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
                `INSERT INTO Notifications (user_id, related_request_id, message, type)
                 VALUES ($1, $2, $3, $4)`,
                [recipientId, requestId, notificationMessage, notificationType]
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


// --- Notification Routes ---

// @route   GET /api/notifications
// @desc    Get all notifications for the authenticated user
// @access  Private
app.get('/api/notifications', protect, async (req, res) => {
    const userId = req.user.userId;
    try {
        const notifications = await pool.query(
            `SELECT notification_id, user_id, related_request_id, message, type, is_read, created_at
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
app.put('/api/notifications/:id/read', protect, async (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            `UPDATE Notifications SET is_read = TRUE
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


// --- USER-SPECIFIC RESOURCE MANAGEMENT ROUTES ---

// @route   GET /api/user/listings
app.get('/api/user/listings', protect, async (req, res) => {
    const userId = req.user.userId;
    try {
        const userListings = await pool.query(
            `SELECT r.resource_id, r.name, r.description, r.category, r.location, r.availability_status, r.posted_at,
                    u.username as owner_username, u.email as owner_email
             FROM Resources r
             JOIN Users u ON r.owner_id = u.user_id
             WHERE r.owner_id = $1
             ORDER BY r.posted_at DESC`,
            [userId]
        );
        res.json(userListings.rows);
    }
    catch (err) {
        console.error('Get User Listings Error:', err.message);
        res.status(500).send('Server Error fetching user listings');
    }
});

// @route   PUT /api/user/resources/:id
app.put('/api/user/resources/:id', protect, async (req, res) => {
    const resourceIdToUpdate = req.params.id;
    const ownerId = req.user.userId;
    const { name, description, category, location, availability_status } = req.body;

    if (!name || !description || !category || !location || !availability_status) {
        return res.status(400).json({ msg: 'All resource fields are required' });
    }
    if (!['Available', 'Reserved', 'Borrowed', 'Donated'].includes(availability_status)) {
        return res.status(400).json({ msg: 'Invalid availability status.' });
    }

    try {
        const checkOwner = await pool.query('SELECT owner_id FROM Resources WHERE resource_id = $1', [resourceIdToUpdate]);
        if (checkOwner.rows.length === 0) {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        if (checkOwner.rows[0].owner_id !== ownerId) {
            return res.status(403).json({ msg: 'Forbidden: You do not own this resource.' });
        }

        const updatedResource = await pool.query(
            `UPDATE Resources SET
                name = $1,
                description = $2,
                category = $3,
                location = $4,
                availability_status = $5,
                updated_at = CURRENT_TIMESTAMP
             WHERE resource_id = $6
             RETURNING resource_id, name, description, category, location, availability_status, posted_at`,
            [name, description, category, location, availability_status, resourceIdToUpdate]
        );

        res.json({ msg: 'Resource updated successfully', resource: updatedResource.rows[0] });

    } catch (err) {
        console.error('Update User Resource Error:', err.message);
        res.status(500).send('Server Error updating resource');
    }
});

// @route   DELETE /api/user/resources/:id
app.delete('/api/user/resources/:id', protect, async (req, res) => {
    const resourceIdToDelete = req.params.id;
    const ownerId = req.user.userId;

    try {
        const checkOwner = await pool.query('SELECT owner_id FROM Resources WHERE resource_id = $1', [resourceIdToDelete]);
        if (checkOwner.rows.length === 0) {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        if (checkOwner.rows[0].owner_id !== ownerId) {
            return res.status(403).json({ msg: 'Forbidden: You do not own this resource.' });
        }

        const deleteResult = await pool.query('DELETE FROM Resources WHERE resource_id = $1 RETURNING resource_id', [resourceIdToDelete]);

        res.json({ msg: 'Resource deleted successfully', resourceId: resourceIdToDelete });

    } catch (err) {
        console.error('Delete User Resource Error:', err.message);
        res.status(500).send('Server Error deleting resource');
    }
});

// --- ADMIN ROUTES (Existing) ---

// @route   GET /api/admin/dashboard-stats
app.get('/api/admin/dashboard-stats', protect, authorizeAdmin, async (req, res) => {
    try {
        const totalUsers = await pool.query('SELECT COUNT(*) FROM Users');
        const totalResources = await pool.query('SELECT COUNT(*) FROM Resources');
        const pendingRequests = await pool.query('SELECT COUNT(*) FROM Requests WHERE status = $1', ['Pending']);
        const reportsCount = await pool.query('SELECT COUNT(*) FROM Feedback WHERE rating < 3'); // Assuming Feedback table exists

        res.json({
            totalUsers: parseInt(totalUsers.rows[0].count),
            totalResourcesListed: parseInt(totalResources.rows[0].count),
            pendingBorrowRequests: parseInt(pendingRequests.rows[0].count),
            reportsCount: parseInt(reportsCount.rows[0].count),
            recentUserActivity: "Coming soon: detailed activity logs"
        });

    } catch (err) {
        console.error('Admin Dashboard Stats Error:', err.message);
        res.status(500).send('Server Error fetching admin dashboard stats');
    }
});

// @route   GET /api/admin/users
app.get('/api/admin/users', protect, authorizeAdmin, async (req, res) => {
    try {
        const users = await pool.query('SELECT user_id, first_name, last_name, username, email, phone_number, role, address, created_at FROM Users ORDER BY created_at DESC');
        res.json(users.rows);
    } catch (err) {
        console.error('Admin Get Users Error:', err.message);
        res.status(500).send('Server Error fetching users');
    }
});

// @route   PUT /api/admin/users/:id
app.put('/api/admin/users/:id', protect, authorizeAdmin, async (req, res) => {
    const userIdToUpdate = req.params.id;
    const { firstName, lastName, email, phoneNumber, username, address, role } = req.body;

    try {
        if (!firstName || !lastName || !email || !username || !role) {
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

        const updatedUser = await pool.query(
            `UPDATE Users SET
                first_name = $1,
                last_name = $2,
                email = $3,
                phone_number = $4,
                username = $5,
                address = $6,
                role = $7,
                updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $8
             RETURNING user_id, first_name, last_name, email, phone_number, username, role, address`,
            [firstName, lastName, email, phoneNumber, username, address, role, userIdToUpdate]
        );

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ msg: 'User updated successfully', user: updatedUser.rows[0] });

    } catch (err) {
        console.error('Admin Update User Error:', err.message);
        res.status(500).send('Server Error updating user');
    }
});


// @route   DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', protect, authorizeAdmin, async (req, res) => {
    const userIdToDelete = req.params.id;
    const adminUserId = req.user.userId;

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

        const deleteResult = await pool.query('DELETE FROM Users WHERE user_id = $1 RETURNING user_id', [userIdToDelete]);

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ msg: 'User deleted successfully', userId: userIdToDelete });

    } catch (err) {
        console.error('Admin Delete User Error:', err.message);
        res.status(500).send('Server Error deleting user');
    }
});


// @route   GET /api/admin/resources (Admin-specific, fetches all, including non-available)
app.get('/api/admin/resources', protect, authorizeAdmin, async (req, res) => {
    try {
        const resources = await pool.query(
            `SELECT r.resource_id, r.name, r.description, r.category, r.location, r.availability_status, r.posted_at, u.username as owner_username
             FROM Resources r
             JOIN Users u ON r.owner_id = u.user_id
             ORDER BY r.posted_at DESC`
        );
        res.json(resources.rows);
    }
    catch (err) {
        console.error('Admin Get Resources Error:', err.message);
        res.status(500).send('Server Error fetching resources');
    }
});

// @route   PUT /api/admin/resources/:id
app.put('/api/admin/resources/:id', protect, authorizeAdmin, async (req, res) => {
    const resourceIdToUpdate = req.params.id;
    const { name, description, category, location, availability_status } = req.body;

    try {
        if (!name || !description || !category || !location || !availability_status) {
            return res.status(400).json({ msg: 'All resource fields are required' });
        }

        if (!['Available', 'Reserved', 'Borrowed', 'Donated'].includes(availability_status)) {
            return res.status(400).json({ msg: 'Invalid availability status.' });
        }

        const updatedResource = await pool.query(
            `UPDATE Resources SET
                name = $1,
                description = $2,
                category = $3,
                location = $4,
                availability_status = $5,
                updated_at = CURRENT_TIMESTAMP
             WHERE resource_id = $6
             RETURNING resource_id, name, description, category, location, availability_status, posted_at`,
            [name, description, category, location, availability_status, resourceIdToUpdate]
        );

        if (updatedResource.rows.length === 0) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        res.json({ msg: 'Resource updated successfully', resource: updatedResource.rows[0] });

    } catch (err) {
        console.error('Admin Update Resource Error:', err.message);
        res.status(500).send('Server Error updating resource');
    }
});


// @route   DELETE /api/admin/resources/:id
app.delete('/api/admin/resources/:id', protect, authorizeAdmin, async (req, res) => {
    const resourceIdToDelete = req.params.id;

    try {
        const deleteResult = await pool.query('DELETE FROM Resources WHERE resource_id = $1 RETURNING resource_id', [resourceIdToDelete]);

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        res.json({ msg: 'Resource deleted successfully', resourceId: resourceIdToDelete });

    } catch (err) {
        console.error('Admin Delete Resource Error:', err.message);
        res.status(500).send('Server Error deleting resource');
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
