// sharenet-backend/middleware/admin.js
function admin(req, res, next) {
    // req.user is set by the 'protect' middleware (which must run before this)
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied: Not an administrator' });
    }
    next(); // If user is admin, proceed
}

module.exports = admin;