// backend/routes/reportRoutes.js - FINAL UPDATED CONTENT: Removed ::text casting for UUIDs

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const protect = require('../middleware/auth'); 
const authorizeAdmin = require('../middleware/admin');

module.exports = (pool) => {
    const router = express.Router();

    // @route   POST /api/reports
    // @desc    Submit a new report against a borrower by an item owner for a completed request
    // @access  Private (Owner of the item involved in a completed request)
    router.post('/reports', protect, async (req, res) => {
        const { requestId, reportType, description } = req.body;
        const reporterId = req.user.user_id; 
        const reporterUsername = req.user.username; 

        console.log('Backend DEBUG: Received report submission for requestId:', requestId);
        console.log('Backend DEBUG: reporterId:', reporterId, 'reportType:', reportType, 'description:', description);

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

            console.log('Backend DEBUG: Checking request details for requestId:', requestId);
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
                console.log('Backend DEBUG: Request not found for ID:', requestId);
                return res.status(404).json({ msg: 'Associated borrow request not found.' });
            }

            const { owner_id, requester_id, resource_id, status: requestStatus } = requestDetails.rows[0];
            console.log('Backend DEBUG: Request details fetched:', { owner_id, requester_id, resource_id, requestStatus });

            // Ensure IDs are treated as strings for comparison
            if (String(reporterId).trim() !== String(owner_id).trim()) {
                await client.query('ROLLBACK');
                console.log('Backend DEBUG: Forbidden: Reporter is not the item owner. Reporter ID:', reporterId, 'Owner ID:', owner_id);
                return res.status(403).json({ msg: 'Forbidden: Only the item owner can submit a report for this request.' });
            }

            if (requestStatus !== 'Completed') {
                await client.query('ROLLBACK');
                console.log('Backend DEBUG: Request status is not Completed. Current status:', requestStatus);
                return res.status(400).json({ msg: 'A report can only be submitted for a completed borrow request.' });
            }

            const reportedUserId = requester_id;
            console.log('Backend DEBUG: Reported user ID:', reportedUserId);

            console.log('Backend DEBUG: Checking for existing report for requestId:', requestId);
            const existingReport = await client.query(
                'SELECT report_id FROM Reports WHERE related_request_id = $1',
                [requestId]
            );
            if (existingReport.rows.length > 0) {
                await client.query('ROLLBACK');
                console.log('Backend DEBUG: Existing report found. Sending 409 Conflict.');
                return res.status(409).json({ msg: 'A report for this completed request already exists.' });
            }

            const report_id = uuidv4();
            console.log('Backend DEBUG: Generated new report_id:', report_id);

            console.log('Backend DEBUG: Attempting to insert new report into DB.');
            // CRITICAL FIX: Removed ::text casting from UUID parameters
            const newReport = await client.query( 
                `INSERT INTO Reports (report_id, reporter_id, reported_user_id, resource_id, related_request_id, report_type, description, status, reported_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending', CURRENT_TIMESTAMP)
                 RETURNING *`,
                [report_id, reporterId, reportedUserId, resource_id, requestId, reportType, description]
            );
            console.log('Backend DEBUG: Report inserted into DB successfully.');

            // --- Start of Notification Sending (common point of failure) ---
            try {
                console.log('Backend DEBUG: Fetching admin users for notification...');
                const admins = await client.query('SELECT user_id FROM Users WHERE role = $1', ['admin']);
                console.log('Backend DEBUG: Found admins:', admins.rows.map(a => a.user_id));

                if (admins.rows.length === 0) {
                    console.warn('Backend DEBUG: No admin users found to send report notification.');
                }

                for (const admin of admins.rows) {
                    const notification_id = uuidv4();
                    const message = `New report from ${reporterUsername} against ${reportedUserId.substring(0, 8)}... (${reportType}).`;
                    console.log(`Backend DEBUG: Inserting notification for admin ${admin.user_id}: ${message}`);
                    // Removed ::text casting from UUID parameters
                    await client.query( 
                        `INSERT INTO Notifications (notification_id, user_id, related_report_id, message, type, created_at)
                         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
                        [notification_id, admin.user_id, report_id, message, 'new_report']
                    );
                    console.log(`Backend DEBUG: Notification inserted for admin ${admin.user_id}.`);
                }
            } catch (notificationErr) {
                console.error('Backend ERROR: Failed to send admin notifications for new report:', notificationErr.message, notificationErr.stack);
            }
            // --- End of Notification Sending ---


            await client.query('COMMIT'); 
            console.log('Backend DEBUG: Transaction committed successfully.');
            res.status(201).json({ msg: 'Report submitted successfully. An administrator will review it.', report: newReport.rows[0] });

        } catch (err) {
            if (client) {
                await client.query('ROLLBACK');
                console.error('Backend ERROR: Transaction rolled back due to error (Main Catch Block):', err.message, err.stack);
            }
            console.error('Backend ERROR: Submit Report Error (Unhandled in Route):', err.message, err.stack);
            res.status(500).json({ msg: 'Server Error submitting report', error: err.message });
        } finally {
            if (client) {
                client.release();
                console.log('Backend DEBUG: Database client released.');
            }
        }
    });

    // @route   GET /api/reports
    // @desc    Get all reports (for admin dashboard)
    // @access  Private (Admin only)
    // Uses authorizeAdmin middleware
    router.get('/reports', protect, authorizeAdmin, async (req, res) => {
        try {
            const reports = await pool.query( 
                `SELECT
                    r.report_id,
                    r.reporter_id,
                    rep_u.username AS reporter_username,
                    rep_u.email AS reporter_email,
                    r.reported_user_id,
                    rpt_u.username AS reported_username,
                    rpt_u.email AS reported_user_email,
                    r.related_request_id,
                    res.resource_id,
                    res.name AS resource_name,
                    req.status AS request_status,
                    r.report_type,
                    r.description,
                    r.status,
                    r.reported_at,
                    r.resolved_at,
                    r.resolved_by,
                    res_u.username AS resolved_by_username
                   FROM Reports r
                   JOIN Users rep_u ON r.reporter_id = rep_u.user_id
                   JOIN Users rpt_u ON r.reported_user_id = rpt_u.user_id
                   LEFT JOIN Requests req ON r.related_request_id = req.request_id
                   LEFT JOIN Resources res ON r.resource_id = res.resource_id
                   LEFT JOIN Users res_u ON r.resolved_by = res_u.user_id
                   ORDER BY r.reported_at DESC`
            );
            res.json(reports.rows);
        } catch (err) {
            console.error('Get Reports Error:', err.message);
            res.status(500).json({ msg: 'Server Error fetching reports', error: err.message });
        }
    });

    // @route   GET /api/reports/:id
    // @desc    Get a single report by ID (for admin detail view)
    // @access  Private (Admin only)
    // Uses authorizeAdmin middleware
    router.get('/reports/:id', protect, authorizeAdmin, async (req, res) => {
        const reportId = req.params.id;
        try {
            const report = await pool.query( 
                `SELECT
                    r.report_id,
                    r.reporter_id,
                    rep_u.username AS reporter_username,
                    rep_u.email AS reporter_email,
                    r.reported_user_id,
                    rpt_u.username AS reported_username,
                    rpt_u.email AS reported_user_email,
                    r.related_request_id,
                    res.resource_id,
                    res.name AS resource_name,
                    req.status AS request_status,
                    r.report_type,
                    r.description,
                    r.status,
                    r.reported_at,
                    r.resolved_at,
                    r.resolved_by,
                    res_u.username AS resolved_by_username
                   FROM Reports r
                   JOIN Users rep_u ON r.reporter_id = rep_u.user_id
                   JOIN Users rpt_u ON r.reported_user_id = rpt_u.user_id
                   LEFT JOIN Requests req ON r.related_request_id = req.request_id
                   LEFT JOIN Resources res ON r.resource_id = res.resource_id
                   LEFT JOIN Users res_u ON r.resolved_by = res_u.user_id
                   WHERE r.report_id = $1`,
                [reportId]
            );
            if (report.rows.length === 0) {
                return res.status(404).json({ msg: 'Report not found.' });
            }
            res.json(report.rows[0]);
        } catch (err) {
            console.error('Get Single Report Error:', err.message);
            res.status(500).json({ msg: 'Server Error fetching report', error: err.message });
        }
    });

    // @route   PUT /api/reports/:id/status
    // @desc    Update report status (for admin)
    // @access  Private (Admin only)
    // Uses authorizeAdmin middleware
    router.put('/reports/:id/status', protect, authorizeAdmin, async (req, res) => {
        const reportId = req.params.id;
        const { status } = req.body;
        const adminId = req.user.user_id;

        if (!status || !['Pending', 'Reviewed', 'Dismissed', 'Action Taken'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid report status provided.' });
        }

        let client;
        try {
            client = await pool.connect();
            await client.query('BEGIN');

            const currentReport = await client.query('SELECT status FROM Reports WHERE report_id = $1', [reportId]);
            if (currentReport.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ msg: 'Report not found.' });
            }

            const currentStatus = currentReport.rows[0].status;
            let updateQuery = `UPDATE Reports SET status = $1`;
            const queryParams = [status, reportId];
            let paramIndex = 3; 

            if (currentStatus === 'Pending' && status !== 'Pending') {
                updateQuery += `, resolved_at = CURRENT_TIMESTAMP, resolved_by = $${paramIndex}`; // Removed ::text
                queryParams.push(adminId);
                paramIndex++;
            }
            
            updateQuery += ` WHERE report_id = $2 RETURNING *`; // Removed ::text

            const updatedReport = await client.query(updateQuery, queryParams);

            if (updatedReport.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ msg: 'Report not found or not updated.' });
            }

            const { reporter_id, reported_user_id, report_type } = updatedReport.rows[0];

            // Notify the original reporter about the status change
            await client.query( 
                `INSERT INTO Notifications (notification_id, user_id, related_report_id, message, type, created_at)
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`, // Removed ::text
                [uuidv4(), reporter_id, reportId, `Your report (${report_type}) has been updated to: ${status}.`, 'report_status_update']
            );

            if (status === 'Action Taken' || status === 'Dismissed') {
                const reportedUserMessage = status === 'Action Taken'
                    ? `Action has been taken regarding a report against your account (${report_type}).`
                    : `A report against your account (${report_type}) has been dismissed.`;
                await client.query(
                    `INSERT INTO Notifications (notification_id, user_id, related_report_id, message, type, created_at)
                     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`, // Removed ::text
                    [uuidv4(), reported_user_id, reportId, reportedUserMessage, `report_against_you_${status.toLowerCase().replace(' ', '_')}`]
                );
            }

            await client.query('COMMIT');
            res.json({ msg: `Report status updated to ${status}.`, report: updatedReport.rows[0] });

        } catch (err) {
            if (client) await client.query('ROLLBACK');
            console.error('Update Report Status Error:', err.message, err.stack);
            res.status(500).json({ msg: 'Server Error updating report status', error: err.message });
        } finally {
            if (client) client.release();
        }
    });

    return router;
};
