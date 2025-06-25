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

// --- API Routes (Existing: Signup, Login, Profile, Admin) ---
// (No changes to existing routes unless specifically noted in this update)

// @route   POST /api/signup
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
            { userId: newUser.rows[0].user_id, role: newUser.rows[0].role },
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
            { userId: storedUser.user_id, role: storedUser.role },
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
app.get('/api/resources', async (req, res) => {
    try {
        const resources = await pool.query(
            `SELECT r.resource_id, r.name, r.description, r.category, r.location, r.availability_status, r.posted_at, u.username as owner_username
             FROM Resources r
             JOIN Users u ON r.owner_id = u.user_id
             WHERE r.availability_status = 'Available' OR r.availability_status = 'Reserved'
             ORDER BY r.posted_at DESC`
        );
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
    console.log('--- Received POST /api/requests request ---');
    console.log('Request Body:', req.body);
    console.log('Authenticated User ID (req.user.userId):', req.user.userId);

    const { resourceId, pickupDate, returnDate, pickupMethod, messageToOwner, borrowLocation } = req.body;
    const requesterId = req.user.userId;

    // Validate incoming data
    if (!resourceId || !pickupDate || !returnDate || !pickupMethod || !borrowLocation) {
        console.error('Validation Error: Missing required fields for borrow request.');
        return res.status(400).json({ msg: 'Please provide all required fields for the borrow request.' });
    }

    try {
        // First, get the owner_id of the requested resource
        console.log(`Attempting to find owner_id for resource_id: ${resourceId}`);
        const resourceResult = await pool.query(
            'SELECT owner_id FROM Resources WHERE resource_id = $1',
            [resourceId]
        );

        if (resourceResult.rows.length === 0) {
            console.error(`Error: Resource with ID ${resourceId} not found.`);
            return res.status(404).json({ msg: 'Resource not found.' });
        }

        const ownerId = resourceResult.rows[0].owner_id;
        console.log(`Found owner_id: ${ownerId} for resource_id: ${resourceId}`);

        // Prevent a user from requesting their own item
        if (requesterId === ownerId) {
            console.error('Error: User attempting to request their own item.');
            return res.status(400).json({ msg: 'You cannot request your own item.' });
        }

        // Validate date formats for PostgreSQL's DATE type
        // Ensure pickupDate and returnDate are valid date strings (YYYY-MM-DD)
        const parsedPickupDate = new Date(pickupDate);
        const parsedReturnDate = new Date(returnDate);

        if (isNaN(parsedPickupDate.getTime()) || isNaN(parsedReturnDate.getTime())) {
            console.error('Validation Error: Invalid date format for pickup or return date.');
            return res.status(400).json({ msg: 'Invalid date format. Please use YYYY-MM-DD.' });
        }

        // Simple check to ensure returnDate is after pickupDate (optional but good practice)
        if (parsedReturnDate < parsedPickupDate) {
            console.error('Validation Error: Return date cannot be before pickup date.');
            return res.status(400).json({ msg: 'Return date cannot be before pickup date.' });
        }


        // Insert the new request into the Requests table
        console.log('Attempting to insert request into Requests table with values:', {
            resourceId, requesterId, ownerId, pickupDate, returnDate, pickupMethod, messageToOwner, borrowLocation
        });

        const newRequest = await pool.query(
            `INSERT INTO Requests (
                resource_id, requester_id, owner_id, pickup_date, return_date,
                pickup_method, message_to_owner, borrow_location, status
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending')
             RETURNING *`,
            [resourceId, requesterId, ownerId, pickupDate, returnDate, pickupMethod, messageToOwner, borrowLocation]
        );

        console.log('Successfully inserted new request:', newRequest.rows[0]);
        res.status(201).json({
            msg: 'Borrow request submitted successfully!',
            request: newRequest.rows[0]
        });

    } catch (err) {
        console.error('Detailed Submit Request Error:', err.message);
        // If it's a UUID format error, it might originate from PostgreSQL
        if (err.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ msg: 'Invalid ID format for resource or user. Please ensure IDs are valid UUIDs.' });
        }
        res.status(500).json({ msg: 'Server Error submitting borrow request', error: err.message });
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
// (No changes to these sections)

// @route   GET /api/admin/dashboard-stats
app.get('/api/admin/dashboard-stats', protect, authorizeAdmin, async (req, res) => {
    try {
        const totalUsers = await pool.query('SELECT COUNT(*) FROM Users');
        const totalResources = await pool.query('SELECT COUNT(*) FROM Resources');
        const pendingRequests = await pool.query('SELECT COUNT(*) FROM Requests WHERE status = $1', ['Pending']);
        const reportsCount = await pool.query('SELECT COUNT(*) FROM Feedback WHERE rating < 3');

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