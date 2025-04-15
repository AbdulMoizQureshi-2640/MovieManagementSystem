
/**
 * @swagger
 * tags:
 *   name: User Profile Management
 *   description: User profile management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - profile
 *         - role
 *       properties:
 *         username:
 *           type: string
 *           description: Username of the user
 *         email:
 *           type: string
 *           description: Email address of the user
 *         profile:
 *           type: object
 *           properties:
 *             nickName:
 *               type: string
 *               description: Nickname of the user
 *             bio:
 *               type: string
 *               description: Short biography of the user
 *             favoriteGenres:
 *               type: array
 *               items:
 *                 type: string
 *               description: List of user's favorite genres
 *             favoriteActors:
 *               type: array
 *               items:
 *                 type: string
 *               description: List of user's favorite actors
 *         role:
 *           type: string
 *           description: Role of the user (e.g., Admin, User)
 *         remindersForNewReleases:
 *           type: boolean
 *           description: Whether the user wants reminders for new releases
 *         sendNotifications:
 *           type: boolean
 *           description: Whether the user has opted to receive notifications
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the user account was created
 */
const express = require('express');
const User = require('../models/User');
const router = express.Router();
const authenticateUser = require('../middleware/auth');  // Assuming you have authentication middleware



/**
 * @swagger
 * /api/profile/:
 *   get:
 *     summary: Get user profile
 *     tags: [User Profile Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile fetched successfully"
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// Route to view the user profile
router.get('/', authenticateUser, async (req, res) => {
    try {
        // Find the user by the authenticated user's ID
        const user = await User.findById(req.user.userId);

        // If the user is not found, return a 404 error
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return the user profile data
        res.status(200).json({
            message: 'Profile fetched successfully',
            user: {
                username: user.username,
                email: user.email,
                profile: user.profile,
                role: user.role,
                remindersForNewReleases: user.remindersForNewReleases,
                sendNotifications: user.sendNotifications,
                createdAt: user.createdAt,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching profile', error: err.message });
    }
});

/**
 * @swagger
 * /api/profile/manage:
 *   put:
 *     summary: Update user profile
 *     tags: [User Profile Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickName:
 *                 type: string
 *                 description: Nickname of the user
 *               bio:
 *                 type: string
 *                 description: Bio of the user
 *               favoriteGenres:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of user's favorite genres
 *               favoriteActors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of user's favorite actors
 *               remindersForNewReleases:
 *                 type: boolean
 *                 description: Whether the user wants reminders for new releases
 *               sendNotifications:
 *                 type: boolean
 *                 description: Whether the user wants to receive notifications
 *     responses:
 *       200:
 *         description: Successfully updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: No fields provided for update
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// Update user profile
router.put('/manage', authenticateUser, async (req, res) => {
    const { nickName, bio, favoriteGenres, favoriteActors, remindersForNewReleases, sendNotifications } = req.body;

    // Check if no fields are provided to update
    if (
        !nickName &&
        !bio &&
        !favoriteGenres &&
        !favoriteActors &&
        remindersForNewReleases === undefined &&
        sendNotifications === undefined
    ) {
        return res.status(400).json({ message: 'Nothing to update. only nickname,bio,favgenre,favactor, remindersForNewReleases and sendNotifications can be managed' });
    }

    try {
        // Find the user by ID
        const user = await User.findById(req.user.userId);  // Assuming req.user is populated with the authenticated user

        // If the user does not exist, return a 404
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the profile fields
        if (nickName !== undefined) user.profile.nickName = nickName;
        if (bio !== undefined) user.profile.bio = bio;
        if (favoriteGenres !== undefined) user.profile.favoriteGenres = favoriteGenres;
        if (favoriteActors !== undefined) user.profile.favoriteActors = favoriteActors;
        if (remindersForNewReleases !== undefined) user.remindersForNewReleases = remindersForNewReleases;
        if (sendNotifications !== undefined) user.sendNotifications = sendNotifications;

        // Save the updated user
        await user.save();

        // Send back the updated user profile
        res.status(200).json({ message: 'Profile updated successfully', user: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating profile', error: err.message });
    }
});

module.exports = router;
