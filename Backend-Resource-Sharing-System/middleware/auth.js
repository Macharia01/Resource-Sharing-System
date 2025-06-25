const jwt = require('jsonwebtoken');

function protect(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user from token payload to the request object
        req.user = decoded; 
        next(); // Proceed to the next middleware/route handler
    } catch (err) {
        // --- CHANGE: Handle token expiration or invalid token explicitly ---
        console.error('Token verification failed:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expired' });
        }
        res.status(401).json({ msg: 'Token is not valid' });
    }
}

module.exports = protect;
