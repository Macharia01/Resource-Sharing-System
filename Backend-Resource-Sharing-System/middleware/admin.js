// backend/middleware/admin.js

function authorizeAdmin(req, res, next) {
    // Check if user is authenticated (protect middleware should have run before this)
    if (!req.user || !req.user.user_id) {
        return res.status(401).json({ msg: 'Not authorized, no token or user info' });
    }

    // Check if user has 'admin' role
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Forbidden: Admin access required' });
    }

    next(); // User is an admin, proceed
}

module.exports = authorizeAdmin;
