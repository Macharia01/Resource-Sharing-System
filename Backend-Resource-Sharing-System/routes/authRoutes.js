// backend/routes/authRoutes.js - FINAL UPDATED CONTENT

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// This function will be called from server.js and receive the pool
module.exports = (pool) => {
    const router = express.Router();

    // @route   POST /api/signup
    // @desc    Register a new user
    // @access  Public
    router.post('/signup', async (req, res) => {
        const { firstName, lastName, email, phoneNumber, password, username, address } = req.body;

        if (!firstName || !lastName || !email || !password || !username) {
            return res.status(400).json({ msg: 'Please enter all required fields: First Name, Last Name, Email, Username, Password' });
        }

        try {
            const emailExists = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
            if (emailExists.rows.length > 0) {
                return res.status(400).json({ msg: 'User with this email already exists' });
            }

            const usernameExists = await pool.query('SELECT * FROM Users WHERE username = $1', [username]);
            if (usernameExists.rows.length > 0) {
                return res.status(400).json({ msg: 'This username is already taken' });
            }

            let role = 'member'; // Consistent with your existing code

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt); // Use passwordHash

            const user_id = uuidv4();

            const newUser = await pool.query(
                `INSERT INTO Users (user_id, first_name, last_name, email, phone_number, password_hash, username, address, role, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP) 
                 RETURNING user_id, first_name, last_name, email, phone_number, username, address, role, is_banned`, // NEW: Return is_banned
                [user_id, firstName, lastName, email, phoneNumber, passwordHash, username, address, role]
            );

            const token = jwt.sign(
                { user_id: newUser.rows[0].user_id, role: newUser.rows[0].role, username: newUser.rows[0].username },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.status(201).json({
                msg: 'User registered successfully',
                token,
                user: {
                    id: newUser.rows[0].user_id, // Frontend likely expects 'id' for user object
                    firstName: newUser.rows[0].first_name,
                    lastName: newUser.rows[0].last_name,
                    email: newUser.rows[0].email,
                    phoneNumber: newUser.rows[0].phone_number,
                    username: newUser.rows[0].username,
                    address: newUser.rows[0].address,
                    role: newUser.rows[0].role,
                    is_banned: newUser.rows[0].is_banned // NEW: Include in response
                }
            });

        } catch (err) {
            console.error('Signup Error:', err.message);
            res.status(500).send('Server Error during signup');
        }
    });

    // @route   POST /api/login
    // @desc    Authenticate user and get token
    // @access  Public
    router.post('/login', async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        try {
            // Include is_banned in the SELECT statement
            const user = await pool.query(
                'SELECT user_id, first_name, last_name, email, phone_number, password_hash, username, role, address, is_banned FROM Users WHERE email = $1', // NEW: Select is_banned
                [email]
            );
            if (user.rows.length === 0) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            const storedUser = user.rows[0];

            // Check if user is banned before password validation
            if (storedUser.is_banned) {
                return res.status(403).json({ msg: 'Your account has been banned. Please contact support.' });
            }

            const isMatch = await bcrypt.compare(password, storedUser.password_hash); // Use password_hash
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            const payload = {
                user_id: storedUser.user_id,
                username: storedUser.username,
                email: storedUser.email,
                role: storedUser.role
            };

            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
                if (err) throw err;
                res.json({
                    msg: 'Logged in successfully',
                    token,
                    user: {
                        id: storedUser.user_id,
                        firstName: storedUser.first_name,
                        lastName: storedUser.last_name,
                        email: storedUser.email,
                        phoneNumber: storedUser.phone_number,
                        username: storedUser.username,
                        role: storedUser.role,
                        address: storedUser.address,
                        is_banned: storedUser.is_banned // NEW: Include in response
                    }
                });
            });

        } catch (err) {
            console.error('Login Error:', err.message);
            res.status(500).send('Server Error during login');
        }
    });

    return router;
};
