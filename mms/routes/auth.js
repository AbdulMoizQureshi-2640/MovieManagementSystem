// /routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const router = express.Router();


// User Registration endpoint
router.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    // Validate required fields 
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password all are required' });
    }

    //validate email
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }
    // Password strength validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters long, contain at least one letter and one number'
        });
    }
    // Validate role (only 'user' or 'admin' allowed)
    const validRoles = ['user', 'admin'];
    if ((role && !validRoles.includes(role)) || !role) {
        return res.status(400).json({ message: `Role must be either "user" or "admin"` });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'OOPS! User already exists' });
    }

    // Create a new user
    const newUser = new User({
        username,
        email,
        password,
        role,
    });

    try {
        await newUser.save();//save user to db
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error registering user', error: err.message });
    }
});

// User Login Endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }); //checking  by email

        if (!user) return res.status(400).json({ message: 'OOPS! Invalid email or password' });//if user not exist

        const match = await bcrypt.compare(password, user.password); //dehashing password using bcrypt
        if (!match) return res.status(400).json({ message: 'OOPS! Invalid email or password' });// if password doesnt match

        const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' }); // token generated
        res.json({ token });

    } catch (err) {
        res.status(500).json({ message: 'Error logging in', errer: err.message });
    }
});

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Endpoints for user login and Register.
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the user.
 *                 example: Abdul Moiz
 *               email:
 *                 type: string
 *                 description: The email of the user.
 *                 example: moizqureshi@example.com
 *               password:
 *                 type: string
 *                 description: The password of the user. Must be at least 8 characters, contain at least one letter and one number.
 *                 example: password123
 *               role:
 *                 type: string
 *                 description: The role of the user. Must be either 'user' or 'admin'.
 *                 example: user 
 *     responses:
 *       201:
 *         description: User registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *       400:
 *         description: Validation errors or user already exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OOPS! User already exists
 *       500:
 *         description: Server error.
 */


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user and return a JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user.
 *                 example: moizqureshi@example.com
 *               password:
 *                 type: string
 *                 description: The password of the user.
 *                 example: password123
 *     responses:
 *       200:
 *         description: Successful login. Returns the JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid email or password.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OOPS! Invalid email or password
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error logging in
 */



module.exports = router;


