/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management for users, including upcoming releases and user settings
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationSettings:
 *       type: object
 *       properties:
 *         remindersForNewReleases:
 *           type: boolean
 *           description: Whether the user wants reminders for new movie releases
 *         sendNotifications:
 *           type: boolean
 *           description: Whether the user wants to receive notifications for upcoming movies
 *         automaticNotificationCheck:
 *           type: boolean
 *           description: Whether automatic notifications are scheduled to be sent daily at midnight
 *           example: true
 *   description:
 *     automaticNotificationSchedule:
 *       type: string
 *       description: >
 *         The system has an automatic schedule to check for upcoming movie releases daily at midnight.
 *         This check looks for movies releasing in the next month and sends notifications to users who have opted for them.
 *         The cron job is set up with the following schedule: '0 0 * * *' (midnight every day).
 *         Notifications are sent based on user preferences, including genre matching or all upcoming releases.
 */
const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notificationService');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Your existing auth middleware
const cron = require('node-cron');
const mongoose = require('mongoose');

// Schedule daily check for upcoming movies at midnight
cron.schedule('0 0 * * *', async () => {
    try {
        await NotificationService.checkUpcomingMovies();
        console.log('Daily notification check completed');
    } catch (error) {
        console.error('Error in scheduled notification:', error);
    }
});

/**
 * @swagger
 * /api/notifications/check-upcoming:
 *   post:
 *     summary: Manually trigger a check for upcoming movies (admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification check triggered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Notification check triggered successfully"
 *       403:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
// Manual trigger for checking upcoming movies (admin only)
router.post('/check-upcoming', auth, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.userId); // Convert string to ObjectId

        // Check if the converted userId is valid
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        const user = await User.findById(userId);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized: Admin access required' });
        }

        await NotificationService.checkUpcomingMovies();
        res.json({ message: 'Notification check triggered successfully' });
    } catch (error) {
        console.error('Error checking upcoming movies:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/notifications/settings:
 *   patch:
 *     summary: Update user notification settings (reminders and notifications)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remainder:
 *                 type: boolean
 *                 description: Whether to enable reminders for new releases
 *               notifications:
 *                 type: boolean
 *                 description: Whether to enable notifications for upcoming movies
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Notification settings updated"
 *                 settings:
 *                   $ref: '#/components/schemas/NotificationSettings'
 *       400:
 *         description: Invalid input data (missing or incorrect value types)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */


// route to change notification settings(user)
router.patch('/settings', auth, async (req, res) => {

    try {
        const { remainder, notifications } = req.body;

        // Check if at least one of remainder or notifications is provided
        if (remainder === undefined && notifications === undefined) {
            return res.status(400).json({
                message: 'At least one of "remainder" or "notifications" must be provided.'
            });
        }

        // Check if remainder and notifications are both booleans (if provided)
        if (remainder !== undefined && typeof remainder !== 'boolean') {
            return res.status(400).json({
                message: '"remainder" must be a boolean value (true/false).'
            });
        }

        if (notifications !== undefined && typeof notifications !== 'boolean') {
            return res.status(400).json({
                message: '"notifications" must be a boolean value (true/false).'
            });
        }

        // Convert req.userId (string) to ObjectId
        const userId = new mongoose.Types.ObjectId(req.user.userId); // Convert string to ObjectId

        // Check if the converted userId is valid
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Prepare the update object conditionally
        const updateFields = {};
        if (remainder !== undefined) {
            updateFields.remindersForNewReleases = remainder;
        }
        if (notifications !== undefined) {
            updateFields.sendNotifications = notifications;
        }

        // Update user settings
        const user = await User.findByIdAndUpdate(
            userId,
            {
                $set: updateFields
            },
            { new: true }
        );


        // If user is not found
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return success response
        res.json({
            message: 'Notification settings updated',
            settings: {
                remindersForNewReleases: user.remindersForNewReleases,
                sendNotifications: user.sendNotifications
            }
        });

    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;