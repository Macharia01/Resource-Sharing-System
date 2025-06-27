// backend/routes/userRoutes.js

const express = require('express');
const protect = require('../middleware/auth'); // Import authentication middleware

// This function will be called from server.js and receive the pool
module.exports = (pool) => {
    const router = express.Router();

    // @route   GET /api/user/profile
    // @desc    Get authenticated user's profile
    // @access  Private
    router.get('/user/profile', protect, async (req, res) => {
        try {
            // Access user_id from req.user.user_id as set by middleware/auth.js
            const user = await pool.query(
                'SELECT user_id, first_name, last_name, email, phone_number, username, role, address FROM Users WHERE user_id = $1',
                [req.user.user_id] // Access user_id (snake_case)
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
    router.put('/user/profile', protect, async (req, res) => {
        const { firstName, lastName, email, phoneNumber, username, address } = req.body;
        const userId = req.user.user_id; // Access user_id (snake_case)

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

    // @route   GET /api/user/listings
    router.get('/user/listings', protect, async (req, res) => {
        const userId = req.user.user_id; // Access user_id (snake_case)
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
    router.put('/user/resources/:id', protect, async (req, res) => {
        const resourceIdToUpdate = req.params.id;
        const ownerId = req.user.user_id; // Access user_id (snake_case)
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
    router.delete('/user/resources/:id', protect, async (req, res) => {
        const resourceIdToDelete = req.params.id;
        const ownerId = req.user.user_id; // Access user_id (snake_case)

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

    return router;
};
