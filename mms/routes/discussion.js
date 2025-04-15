/**
 * @swagger
 * tags:
 *   name: Discussions
 *   description: Discussion forum management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - content
 *         - createdBy
 *       properties:
 *         content:
 *           type: string
 *           description: Content of the comment
 *         createdBy:
 *           type: string
 *           format: mongoose.ObjectId
 *           description: User ID who created the comment
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of comment creation
 *     
 *     Discussion:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - category
 *         - createdBy
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           description: Title of the discussion
 *         content:
 *           type: string
 *           minLength: 10
 *           description: Content of the discussion
 *         category:
 *           type: string
 *           enum: [General, Genres, Actors, Movies, Drama]
 *           description: Category of the discussion
 *         relatedMovie:
 *           type: array
 *           items:
 *             type: string
 *             format: mongoose.ObjectId
 *           description: Array of related movie IDs
 *         createdBy:
 *           type: string
 *           format: mongoose.ObjectId
 *           description: User ID who created the discussion
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *           description: Array of comments on the discussion
 */
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Movie = require('../models/Movie');
const Discussion = require('../models/discussion');
const auth = require('../middleware/auth'); // Middleware to authenticate and decode token

// Utility: Manual validation
const validateDiscussion = (data) => {
    const errors = [];
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
        errors.push('Title is required and must be at least 3 characters long.');
    }
    if (!data.content || typeof data.content !== 'string' || data.content.trim().length < 10) {
        errors.push('Content is required and must be at least 10 characters long.');
    }
    if (!data.category || !['General', 'Genres', 'Actors', 'Movies', 'Drama'].includes(data.category)) {
        errors.push('Category is required and must be one of General, Genres, Actors, or Movies.');
    }
    return errors;
};

/**
 * @swagger
 * /api/discussion/create-new:
 *   post:
 *     summary: Create a new discussion
 *     tags: [Discussions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *               content:
 *                 type: string
 *                 minLength: 10
 *               category:
 *                 type: string
 *                 enum: [General, Genres, Actors, Movies, Drama]
 *               relatedMovie:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: mongoose.ObjectId
 *     responses:
 *       201:
 *         description: Discussion created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
// Create a new discussion
router.post('/create-new', auth, async (req, res) => {
    const { title, content, relatedMovie, category } = req.body;

    // Manual Validation
    const errors = validateDiscussion({ title, content, category });
    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    if (relatedMovie === "") {
        return res.status(400).json({ success: false, message: 'Also add movie id if youa dd title of movie.' });

    }


    if (relatedMovie) {
        // Validate relatedMovies as an array of ObjectIds (if provided)
        if (relatedMovie && !Array.isArray(relatedMovie)) {
            return res.status(400).json({ success: false, message: 'Related movies should be an array of ObjectIds. or object id' });
        }
        if (relatedMovie && !relatedMovie.every(id => mongoose.Types.ObjectId.isValid(id))) {
            return res.status(400).json({ success: false, message: 'Each related movie must be a valid ObjectId.' });
        }
        // Check if all relatedMovies exist in the Movie collection
        const existingMovies = await Movie.find({ '_id': { $in: relatedMovie } }).select('_id');
        const existingMovieIds = existingMovies.map(movie => movie._id.toString());

        // Filter out invalid movie IDs that do not exist in the Movie collection
        const invalidMovieIds = relatedMovie.filter(id => !existingMovieIds.includes(id.toString()));

        if (invalidMovieIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: `The following related movie IDs do not exist: ${invalidMovieIds.join(', ')}`
            });
        }
    }

    try {


        // Get the current user ID from the auth middleware and convert it to ObjectId
        const createdBy = new mongoose.Types.ObjectId(req.user.userId);

        // Create the discussion
        const discussion = new Discussion({
            title,
            content,
            relatedMovie,
            category,
            createdBy
        });

        await discussion.save();
        res.status(201).json({ success: true, discussion });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error creating discussion', error: err.message });
    }
});



/**
 * @swagger
 * /api/discussion/:
 *   get:
 *     summary: Get all discussions with pagination
 *     tags: [Discussions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
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
 *         description: List of discussions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 discussions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Discussion'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *       500:
 *         description: Server error
 */
// Fetch all discussions
router.get('/', async (req, res) => {
    try {
        // Get pagination parameters with defaults
        let { page = 1, limit = 10 } = req.query;

        // Ensure page and limit are positive integers
        page = Math.max(1, parseInt(page));
        limit = Math.max(1, parseInt(limit));

        // Fetch paginated discussions
        const discussions = await Discussion.find()
            .populate('createdBy', 'username')
            .populate('relatedMovie', 'title')
            .skip((page - 1) * limit) // Skip based on the current page
            .limit(limit); // Limit the number of discussions per page

        // Get total count of discussions
        const totalDiscussions = await Discussion.countDocuments();

        // Calculate total pages
        const totalPages = totalDiscussions === 0 ? 1 : Math.ceil(totalDiscussions / limit);

        // Return response
        res.status(200).json({
            success: true,
            discussions,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalDiscussions,
                itemsPerPage: limit,
            },
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error fetching discussions',
            error: err.message,
        });
    }
});


/**
 * @swagger
 * /api/discussion/{id}/comments:
 *   post:
 *     summary: Add a comment to a discussion
 *     tags: [Discussions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoose.ObjectId
 *         description: Discussion ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 description: Content of the comment
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 discussion:
 *                   $ref: '#/components/schemas/Discussion'
 *       400:
 *         description: Invalid comment content
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Discussion not found
 *       500:
 *         description: Server error
 */

// Add a comment to a discussion
router.post('/:id/comments', auth, async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    // Validate comment
    if (!content || typeof content !== 'string' || content.trim().length < 1) {
        return res.status(400).json({ success: false, message: 'Comment content is required and cannot be empty.' });
    }

    try {
        const createdBy = new mongoose.Types.ObjectId(req.user.userId);
        const idObject = new mongoose.Types.ObjectId(id);
        const discussion = await Discussion.findById(idObject);

        if (!discussion) {
            return res.status(404).json({ success: false, message: 'Discussion not found.' });
        }

        // Add comment
        discussion.comments.push({ content, createdBy });
        await discussion.save();

        res.status(201).json({ success: true, discussion });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error adding comment', error: err.message });
    }
});


module.exports = router;
