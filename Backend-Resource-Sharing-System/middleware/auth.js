const jwt = require('jsonwebtoken');

// Middleware function to protect routes
function protect(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token'); // Common header name for JWT

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        // Verify token with your JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user from token to the request object
        // The payload (decoded) from the token should contain userId and role
        req.user = decoded; // Now, req.user will have { userId, role }
        next(); // Proceed to the next middleware/route handler

    } catch (err) {
        // Token is not valid
        res.status(401).json({ msg: 'Token is not valid' });
    }
}

module.exports = protect;