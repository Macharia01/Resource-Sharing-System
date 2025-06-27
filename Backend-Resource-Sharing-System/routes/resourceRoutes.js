// backend/routes/resourceRoutes.js

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const protect = require('../middleware/auth'); // Import authentication middleware

// This function will be called from server.js and receive the pool
module.exports = (pool) => {
    const router = express.Router();

    // @route   GET /api/resources
    // @desc    Get all resources, with optional search and category filtering
    // @access  Public
    router.get('/resources', async (req, res) => {
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
    router.get('/resources/:id', async (req, res) => {
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
    router.post('/resources', protect, async (req, res) => {
        const { name, description, category, location, availability_status } = req.body;
        const ownerId = req.user.user_id; // Access user_id (snake_case)

        if (!name || !description || !category || !location || !availability_status) {
            return res.status(400).json({ msg: 'Please enter all required resource fields.' });
        }

        if (!['Available', 'Reserved', 'Borrowed', 'Donated'].includes(availability_status)) {
            return res.status(400).json({ msg: 'Invalid availability status provided.' });
        }

        try {
            // Generate resource_id as UUID
            const resource_id = uuidv4();

            const newResource = await pool.query(
                `INSERT INTO Resources (resource_id, owner_id, name, description, category, location, availability_status, posted_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                 RETURNING resource_id, owner_id, name, description, category, location, availability_status, posted_at`,
                [resource_id, ownerId, name, description, category, location, availability_status]
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

    return router;
};
