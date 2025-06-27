// backend/routes/reportRoutes.js

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const protect = require('../middleware/auth'); // Import authentication middleware

// This function will be called from server.js and receive the pool
module.exports = (pool) => {
    const router = express.Router();

    // @route   POST /api/reports
    // @desc    Submit a new report against a borrower by an item owner for a completed request
    // @access  Private (Owner of the item involved in a completed request)
    router.post('/reports', protect, async (req, res) => {
        // For reporting, we expect the context of a completed request
        const { requestId, reportType, description } = req.body;
        const reporterId = req.user.user_id; // Access user_id (snake_case)

        if (!requestId || !reportType || !description) {
            return res.status(400).json({ msg: 'Request ID, report type, and description are required.' });
        }

        const allowedReportTypes = ['Item Damaged', 'Late Return', 'Did Not Return Item', 'Misconduct', 'Other'];
        if (!allowedReportTypes.includes(reportType)) {
            return res.status(400).json({ msg: 'Invalid report type provided.' });
        }

        let client;
        try {
            client = await pool.connect();
            await client.query('BEGIN'); // Start transaction

            // Fetch request details to validate reporter and reported user, and resource_id
            const requestDetails = await client.query(
                `SELECT
                    r.owner_id,
                    r.requester_id,
                    r.resource_id,
                    r.status
                 FROM Requests r
                 WHERE r.request_id = $1`,
                [requestId]
            );

            if (requestDetails.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ msg: 'Associated borrow request not found.' });
            }

            const { owner_id, requester_id, resource_id, status: requestStatus } = requestDetails.rows[0];

            // Validate that the current user (reporter) is the owner of the item in the request
            if (reporterId !== owner_id) {
                await client.query('ROLLBACK');
                return res.status(403).json({ msg: 'Forbidden: Only the item owner can submit a report for this request.' });
            }

            // Validate that the request status is 'Completed'
            if (requestStatus !== 'Completed') {
                await client.query('ROLLBACK');
                return res.status(400).json({ msg: 'A report can only be submitted for a completed borrow request.' });
            }

            // The reported user is the requester of the completed borrow request
            const reportedUserId = requester_id;

            // Check if a report for this request already exists to prevent duplicates
            const existingReport = await client.query(
                'SELECT report_id FROM Reports WHERE request_id = $1', // Use request_id for reports table
                [requestId]
            );
            if (existingReport.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ msg: 'A report for this completed request already exists.' });
            }

            // Generate report_id as UUID
            const report_id = uuidv4();

            const newReport = await pool.query(
                `INSERT INTO Reports (report_id, reporter_id, reported_user_id, resource_id, request_id, report_type, description, status, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending', CURRENT_TIMESTAMP)
                 RETURNING *`,
                [report_id, reporterId, reportedUserId, resource_id, requestId, reportType, description]
            );

            await client.query('COMMIT'); // Commit transaction
            res.status(201).json({ msg: 'Report submitted successfully.', report: newReport.rows[0] });

        } catch (err) {
            if (client) await client.query('ROLLBACK');
            console.error('Submit Report Error:', err.message);
            res.status(500).json({ msg: 'Server Error submitting report', error: err.message });
        } finally {
            if (client) client.release();
        }
    });

    return router;
};
