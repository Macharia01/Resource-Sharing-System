// backend/middleware/auth.js

const jwt = require('jsonwebtoken'); // Ensure jsonwebtoken is imported
require('dotenv').config(); // Load environment variables for JWT_SECRET

function protect(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // Verify token
        // The JWT payload will have 'user_id' (snake_case) as set in server.js
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach decoded payload to req.user.
        // req.user will now directly be the 'decoded' object, which has 'user_id'
        req.user = decoded; 
        
        // Debugging logs - you can remove these once everything works
        console.log('Decoded JWT Payload (req.user):', req.user);
        // Correctly access 'user_id' (snake_case) from the decoded payload
        console.log('User ID from Token (req.user.user_id):', req.user.user_id); 
        
        next(); // Proceed to the next middleware/route handler
    } catch (err) {
        console.error('Token verification failed:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expired' });
        }
        res.status(401).json({ msg: 'Token is not valid' });
    }
}

module.exports = protect;
