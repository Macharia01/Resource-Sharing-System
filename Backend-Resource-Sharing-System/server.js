// backend/server.js

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Centralized PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test DB connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Connected to PostgreSQL database!');
    client.release();
});

// Global middleware
app.use(express.json()); // Body parser for JSON requests
app.use(cors({ // CORS configuration
    origin: 'http://localhost:3000'
}));

// Simple request logger (for debugging)
app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
    next();
});

// Import route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const requestRoutes = require('./routes/requestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Assuming you have admin middleware/routes

// Use imported routes
// Pass the pool and potentially other dependencies (like middleware) to the route files
app.use('/api', authRoutes(pool)); // e.g., /api/signup, /api/login
app.use('/api', userRoutes(pool)); // e.g., /api/user/profile
app.use('/api', resourceRoutes(pool)); // e.g., /api/resources
app.use('/api', requestRoutes(pool)); // e.g., /api/requests
app.use('/api', notificationRoutes(pool)); // e.g., /api/notifications
app.use('/api', reportRoutes(pool)); // e.g., /api/reports
app.use('/api', reviewRoutes(pool)); // e.g., /api/reviews
app.use('/api/admin', adminRoutes(pool)); // e.g., /api/admin/users, /api/admin/reports

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
