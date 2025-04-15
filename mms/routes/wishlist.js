
/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Movie wishlist management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WishlistResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Operation success status
 *         page:
 *           type: integer
 *           description: Current page number
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 *         totalItems:
 *           type: integer
 *           description: Total number of items in wishlist
 *         wishlist:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Movie'
 *           description: Array of movies in the wishlist
 *     
 *     WishlistOperation:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Operation result message
 *         wishlist:
 *           type: array
 *           items:
 *             type: string
 *             format: mongoose.ObjectId
 *           description: Updated list of movie IDs in wishlist
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error type or title
 *         message:
 *           type: string
 *           description: Detailed error message
 */
const express = require('express');
const mongoose = require('mongoose');
const Movie = require('../models/Movie');  // Assuming Movie schema is in models/Movie.js
const User = require('../models/User');    // Assuming User schema is in models/User.js
const authenticateUser = require('../middleware/auth');  // Import authentication middleware
const router = express.Router();

/**
 * @swagger
 * /api/wishlist/add:
 *   post:
 *     summary: Add a movie to user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movieId
 *             properties:
 *               movieId:
 *                 type: string
 *                 format: mongoose.ObjectId
 *                 description: ID of the movie to add to wishlist
 *     responses:
 *       200:
 *         description: Movie successfully added to wishlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistOperation'
 *       400:
 *         description: Invalid request or movie already in wishlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               movieIdMissing:
 *                 value:
 *                   error: 'Movie ID is required'
 *               alreadyInWishlist:
 *                 value:
 *                   error: 'Movie already in wishlist'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Add movie to wishlist
router.post('/add', authenticateUser, async (req, res) => {
    const { movieId } = req.body;

    if (!movieId) {
        return res.status(400).json({ error: 'Movie ID is required' });
    }

    try {
        const userId = new mongoose.Types.ObjectId(req.user.userId); // Convert string to ObjectId

        // Find the user by the ObjectId
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }


        // Check if movie is already in wishlist
        if (user.wishlist.includes(movieId)) {
            return res.status(400).json({ error: 'Movie already in wishlist' });
        }

        // Add movie to wishlist
        user.wishlist.push(movieId);
        await user.save();

        res.json({ message: 'Movie added to wishlist successfully', wishlist: user.wishlist });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add movie to wishlist', message: err.message });
    }
});


/**
 * @swagger
 * /api/wishlist/:
 *   get:
 *     summary: Get user's wishlist with pagination
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved wishlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: User not found or no movies on requested page
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               userNotFound:
 *                 value:
 *                   error: 'User not found'
 *               noMoviesOnPage:
 *                 value:
 *                   error: 'No movies found on the requested page'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get the user's wishlist
router.get('/', authenticateUser, async (req, res) => {
    try {
        // Get pagination parameters with defaults
        let { page = 1, limit = 10 } = req.query;

        // Ensure page is at least 1
        page = Math.max(1, parseInt(page));
        limit = parseInt(limit); // Ensure limit is a number

        // Find user by ID and populate the wishlist with pagination
        const user = await User.findById(req.user.userId).populate({
            path: 'wishlist',
            options: {
                skip: (page - 1) * limit, // Skip based on the page
                limit: limit // Limit the number of items
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get the total number of items in the wishlist for pagination info
        const totalItemsCount = user.wishlist.length;

        // Calculate totalPages
        const totalPages = totalItemsCount === 0 ? 1 : Math.ceil(totalItemsCount / limit);

        // Handle the case where there are no items in the wishlist
        if (totalItemsCount === 0 && page > 1) {
            return res.status(404).json({ error: 'No movies found on the requested page' });
        }

        res.json({
            success: true,
            page: page,
            totalPages: totalPages,
            totalItems: totalItemsCount,
            wishlist: user.wishlist
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get wishlist', message: err.message });
    }
});


/**
 * @swagger
 * /api/wishlist/remove:
 *   delete:
 *     summary: Remove a movie from user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movieId
 *             properties:
 *               movieId:
 *                 type: string
 *                 format: mongoose.ObjectId
 *                 description: ID of the movie to remove from wishlist
 *     responses:
 *       200:
 *         description: Movie successfully removed from wishlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistOperation'
 *       400:
 *         description: Invalid request or movie not in wishlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               movieIdMissing:
 *                 value:
 *                   error: 'Movie ID is required'
 *               notInWishlist:
 *                 value:
 *                   error: 'Movie not found in wishlist'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Delete a movie from the user's wishlist
router.delete('/remove', authenticateUser, async (req, res) => {
    const { movieId } = req.body;

    if (!movieId) {
        return res.status(400).json({ error: 'Movie ID is required' });
    }

    try {
        const userId = new mongoose.Types.ObjectId(req.user.userId); // Convert string to ObjectId

        // Find the user by the ObjectId
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if movie is in wishlist
        const movieIndex = user.wishlist.indexOf(movieId);

        if (movieIndex === -1) {
            return res.status(400).json({ error: 'Movie not found in wishlist' });
        }

        // Remove the movie from the wishlist
        user.wishlist.splice(movieIndex, 1); // Removes 1 item at the found index
        await user.save();

        res.json({ message: 'Movie removed from wishlist successfully', wishlist: user.wishlist });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove movie from wishlist', message: err.message });
    }
});

module.exports = router;
