// backend/routes/reviewRoutes.js

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const protect = require('../middleware/auth'); // Import authentication middleware

// This function will be called from server.js and receive the pool
module.exports = (pool) => {
    const router = express.Router();

    // @route   POST /api/reviews
    // @desc    Submit a new review by a borrower for an item and its owner, linked to a completed request
    // @access  Private (Requester of a completed request)
    router.post('/reviews', protect, async (req, res) => {
        const { relatedRequestId, rating, comment } = req.body; // Changed to relatedRequestId for consistency with frontend
        const reviewerId = req.user.user_id; // Access user_id (snake_case)

        if (!relatedRequestId || rating === undefined || rating === null) {
            return res.status(400).json({ msg: 'Request ID and rating are required.' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ msg: 'Rating must be between 1 and 5.' });
        }

        let client;
        try {
            client = await pool.connect();
            await client.query('BEGIN'); // Start transaction

            // Fetch request details to validate reviewer, reviewed user, and resource_id
            // Join with Transactions to ensure it's a completed transaction for eligibility
            const requestDetails = await client.query(
                `SELECT
                    r.owner_id,
                    r.requester_id,
                    r.resource_id,
                    r.status AS request_status,
                    t.status AS transaction_status
                 FROM Requests r
                 JOIN Transactions t ON r.request_id = t.request_id
                 WHERE r.request_id = $1`,
                [relatedRequestId] // Use relatedRequestId
            );

            if (requestDetails.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ msg: 'Associated borrow request or transaction not found.' });
            }

            const { owner_id, requester_id, resource_id, request_status, transaction_status } = requestDetails.rows[0];

            // Validate that the current user (reviewer) is the requester of the item in the request
            if (reviewerId !== requester_id) {
                await client.query('ROLLBACK');
                return res.status(403).json({ msg: 'Forbidden: Only the borrower can submit a review for this request.' });
            }

            // Validate that the request status is 'Completed' AND transaction status is 'Completed'
            if (request_status !== 'Completed' || transaction_status !== 'Completed') {
                await client.query('ROLLBACK');
                return res.status(400).json({ msg: 'A review can only be submitted for a completed borrow request (and its associated transaction).' });
            }

            // The user being reviewed is the owner of the item
            const reviewedUserId = owner_id;

            // Check if a review for this request by this reviewer already exists
            const existingReview = await pool.query(
                'SELECT review_id FROM Reviews WHERE reviewer_id = $1 AND related_request_id = $2', 
                [reviewerId, relatedRequestId] // Use relatedRequestId
            );
            if (existingReview.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ msg: 'You have already submitted a review for this completed request.' });
            }

            // Generate review_id as UUID
            const review_id = uuidv4();

            const newReview = await pool.query(
                `INSERT INTO Reviews (review_id, reviewer_id, reviewed_user_id, resource_id, related_request_id, rating, comment, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                 RETURNING *`,
                [review_id, reviewerId, reviewedUserId, resource_id, relatedRequestId, rating, comment]
            );

            await client.query('COMMIT'); // Commit transaction
            res.status(201).json({ msg: 'Review submitted successfully.', review: newReview.rows[0] });

        } catch (err) {
            if (client) await client.query('ROLLBACK');
            console.error('Submit Review Error:', err.message);
            // Handle unique constraint violation specifically for better error message
            if (err.code === '23505') { 
                return res.status(409).json({ msg: 'You have already submitted a review for this completed request.' });
            }
            res.status(500).json({ msg: 'Server Error submitting review', error: err.message });
        } finally {
            if (client) client.release();
        }
    });

    // @route   GET /api/resources/:id/reviews
    // @desc    Get all reviews for a specific resource
    // @access  Public
    router.get('/resources/:id/reviews', async (req, res) => {
        const resourceId = req.params.id;
        try {
            const reviews = await pool.query(
                `SELECT
                    rv.review_id,
                    rv.reviewer_id,
                    u.username as reviewer_username,
                    u.first_name AS reviewer_first_name, -- Added for consistency
                    u.last_name AS reviewer_last_name,   -- Added for consistency
                    rv.rating,
                    rv.comment,
                    rv.created_at,
                    rv.related_request_id -- Use related_request_id for reviews table
                 FROM Reviews rv
                 JOIN Users u ON rv.reviewer_id = u.user_id
                 WHERE rv.resource_id = $1
                 ORDER BY rv.created_at DESC`,
                [resourceId]
            );
            res.json(reviews.rows);
        } catch (err) {
            console.error('Get Resource Reviews Error:', err.message);
            res.status(500).json({ msg: 'Server Error fetching resource reviews', error: err.message });
        }
    });

    // NEW: Check if an authenticated user has already reviewed a specific completed request
    // @route   GET /api/reviews/check-existing/:relatedRequestId
    // @desc    Check if the authenticated user has already reviewed a specific completed request
    // @access  Private (requester of the transaction)
    router.get('/reviews/check-existing/:relatedRequestId', protect, async (req, res) => {
        const { relatedRequestId } = req.params;
        const reviewerId = req.user.user_id;

        try {
            const result = await pool.query(
                `SELECT COUNT(*) FROM Reviews WHERE reviewer_id = $1 AND related_request_id = $2`,
                [reviewerId, relatedRequestId]
            );
            const hasReview = parseInt(result.rows[0].count) > 0;
            res.json({ hasReview });
        } catch (err) {
            console.error('Check Existing Review Error:', err.message);
            res.status(500).json({ msg: 'Server Error checking existing review', error: err.message });
        }
    });

    return router;
};
