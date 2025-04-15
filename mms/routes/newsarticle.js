
/**
 * @swagger
 * tags:
 *   name: News Articles
 *   description: News article management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     News:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - content
 *         - category
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the news article
 *         description:
 *           type: string
 *           description: Brief description of the news article
 *         content:
 *           type: string
 *           description: Full content of the news article
 *         category:
 *           type: string
 *           enum: [Movies, Actors, Projects, Industry, Drama]
 *           description: Category of the news article
 *         relatedMovies:
 *           type: array
 *           items:
 *             type: string
 *             format: mongoose.ObjectId
 *           description: Array of movie IDs related to the news article
 *         relatedActors:
 *           type: array
 *           items:
 *             type: string
 *             format: mongoose.ObjectId
 *           description: Array of actor IDs related to the news article
 *     
 *     NewsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         news:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/News'
 */
const express = require('express');
const router = express.Router();
const News = require('../models/news'); // Import News schema
const mongoose = require('mongoose');
const Person = require('../models/person'); // Import Person schema (for references)
const Movie = require('../models/Movie');
const authenticateUser = require('../middleware/auth');

/**
 * @swagger
 * /api/news/:
 *   get:
 *     summary: Get all news articles with pagination
 *     tags: [News Articles]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination (default is 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page (default is 10)
 *     responses:
 *       200:
 *         description: Successfully retrieved news articles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalItems:
 *                       type: integer
 *                       example: 50
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 10
 *                 news:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/News'
 *       500:
 *         description: Server error
 */
// Fetch all news articles
router.get('/', async (req, res) => {
    try {
        // Get pagination parameters with defaults
        let { page = 1, limit = 10 } = req.query;

        // Ensure page is at least 1 and limit is a positive number
        page = Math.max(1, parseInt(page));
        limit = Math.max(1, parseInt(limit));

        // Fetch paginated news articles with related movies and actors populated
        const news = await News.find()
            .populate('relatedMovies', 'title')
            .populate('relatedActors', 'name')
            .skip((page - 1) * limit) // Skip based on the current page
            .limit(limit); // Limit the number of articles per page

        // Get the total count of news articles for pagination info
        const totalNewsCount = await News.countDocuments();

        // Calculate total pages
        const totalPages = totalNewsCount === 0 ? 1 : Math.ceil(totalNewsCount / limit);

        res.status(200).json({
            success: true,
            news,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalNewsCount,
                itemsPerPage: limit,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching news articles', error: err.message });
    }
});

/**
 * @swagger
 * /api/news/category/{category}:
 *   get:
 *     summary: Get news articles by category with pagination
 *     tags: [News Articles]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Movies, Actors, Projects, Industry, Drama]  # List of possible categories
 *         description: Category of news articles to retrieve
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination (default is 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page (default is 10)
 *     responses:
 *       200:
 *         description: Successfully retrieved news articles in the specified category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalItems:
 *                       type: integer
 *                       example: 50
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 10
 *                 news:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/News'  # Assuming you have a 'News' schema defined in components
 *       404:
 *         description: No news articles found in this category
 *       500:
 *         description: Server error
 */
// Fetch news by category
router.get('/category/:category', async (req, res) => {
    const { category } = req.params;
    try {
        // Get pagination parameters with defaults
        let { page = 1, limit = 10 } = req.query;

        // Ensure page is at least 1 and limit is a positive number
        page = Math.max(1, parseInt(page));
        limit = Math.max(1, parseInt(limit));

        // Fetch paginated news articles by category
        const news = await News.find({ category })
            .populate('relatedMovies', 'title')
            .populate('relatedActors', 'name')
            .skip((page - 1) * limit) // Skip based on the current page
            .limit(limit); // Limit the number of articles per page

        // Count the total number of news articles for this category
        const totalNewsCount = await News.countDocuments({ category });

        // Calculate total pages
        const totalPages = totalNewsCount === 0 ? 1 : Math.ceil(totalNewsCount / limit);

        // If no articles found for the category
        if (news.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No news articles found for this category',
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: totalNewsCount,
                    itemsPerPage: limit,
                },
            });
        }

        res.status(200).json({
            success: true,
            news,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalNewsCount,
                itemsPerPage: limit,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching news by category', error: err.message });
    }
});

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: Get a specific news article by ID
 *     tags: [News Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoose.ObjectId
 *         description: ID of the news article
 *     responses:
 *       200:
 *         description: News article details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewsResponse'
 *       404:
 *         description: News article not found
 *       500:
 *         description: Server error
 */
// Fetch a single news article by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const news = await News.findById(id)
            .populate('relatedMovies', 'title')
            .populate('relatedActors', 'name');
        if (!news) {
            return res.status(404).json({ success: false, message: 'News article not found' });
        }
        res.status(200).json({ success: true, news });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching news article', error: err.message });
    }
});

/**
 * @swagger
 * /api/news/add-news:
 *   post:
 *     summary: Create a new news article
 *     tags: [News Articles]
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
 *               - description
 *               - content
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Movies, Actors, Projects, Industry, Drama]
 *               relatedMovies:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: mongoose.ObjectId
 *               relatedActors:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: mongoose.ObjectId
 *     responses:
 *       201:
 *         description: News article created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewsResponse'
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Server error
 */
// Add a new news article
router.post('/add-news', authenticateUser, async (req, res) => {
    const { title, description, content, category, relatedMovies, relatedActors } = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. You are not an admin.' });
    }


    // Check if required fields (title, description, content, category) are provided
    if (!title || typeof title !== 'string') {
        return res.status(400).json({ success: false, message: 'Title is required and must be a string.' });
    }

    if (!description || typeof description !== 'string') {
        return res.status(400).json({ success: false, message: 'Description is required and must be a string.' });
    }

    if (!content || typeof content !== 'string') {
        return res.status(400).json({ success: false, message: 'Content is required and must be a string.' });
    }

    // Check if category is valid
    const validCategories = ['Movies', 'Actors', 'Projects', 'Industry', 'Drama'];
    if (!category || !validCategories.includes(category)) {
        return res.status(400).json({ success: false, message: 'Category is required and must be one of the following: Movies, Actors, Projects, Industry.' });
    }

    // Validate relatedMovies as an array of ObjectIds (if provided)
    if (relatedMovies && !Array.isArray(relatedMovies)) {
        return res.status(400).json({ success: false, message: 'Related movies should be an array of ObjectIds.' });
    }

    if (relatedMovies && !relatedMovies.every(id => mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({ success: false, message: 'Each related movie must be a valid ObjectId.' });
    }

    if (relatedMovies) {
        // Check if all relatedMovies exist in the Movie collection
        const existingMovies = await Movie.find({ '_id': { $in: relatedMovies } }).select('_id');
        const existingMovieIds = existingMovies.map(movie => movie._id.toString());

        // Filter out invalid movie IDs that do not exist in the Movie collection
        const invalidMovieIds = relatedMovies.filter(id => !existingMovieIds.includes(id.toString()));

        if (invalidMovieIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: `The following related movie IDs do not exist: ${invalidMovieIds.join(', ')}`
            });
        }
    }


    // Validate relatedActors as an array of ObjectIds (if provided)
    if (relatedActors && !Array.isArray(relatedActors)) {
        return res.status(400).json({ success: false, message: 'Related actors should be an array of ObjectIds.' });
    }

    if (relatedActors && !relatedActors.every(id => mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({ success: false, message: 'Each related actor must be a valid ObjectId.' });
    }

    // Check if all relatedActors IDs exist in the Person collection
    if (relatedActors) {
        const existingActors = await Person.find({ '_id': { $in: relatedActors } }).select('_id');
        const existingActorIds = existingActors.map(actor => actor._id.toString());
        const invalidActorIds = relatedActors.filter(id => !existingActorIds.includes(id.toString()));

        if (invalidActorIds.length > 0) {
            return res.status(400).json({ success: false, message: `The following related actor IDs do not exist: ${invalidActorIds.join(', ')}` });
        }
    }

    try {
        // Create a new News article with validated data
        const newNews = new News({
            title,
            description,
            content,
            category,
            relatedMovies,
            relatedActors,
        });

        // Save the news article to the database
        await newNews.save();
        res.status(201).json({ success: true, news: newNews });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Error creating news article', error: err.message });
    }
});


// Helper function to check if ObjectIds exist in the Person collection
const checkObjectIdsExist = async (ids) => {
    const existingItems = await Person.find({ '_id': { $in: ids } }).select('_id');
    const existingIds = existingItems.map(item => item._id.toString());
    return ids.filter(id => !existingIds.includes(id.toString()));
};

/**
 * @swagger
 * /api/news/update-news/{id}:
 *   put:
 *     summary: Update an existing news article
 *     tags: [News Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoose.ObjectId
 *         description: ID of the news article to update
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Movies, Actors, Projects, Industry, Drama]
 *               relatedMovies:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: mongoose.ObjectId
 *               relatedActors:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: mongoose.ObjectId
 *     responses:
 *       200:
 *         description: News article updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewsResponse'
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: News article not found
 *       500:
 *         description: Server error
 */
// Route for updating a news article
router.put('/update-news/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const { title, description, content, category, relatedMovies, relatedActors } = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. You are not an admin.' });
    }
    console.log(id);
    let newsId = new mongoose.Types.ObjectId(id); // Convert string ID to ObjectId
    console.log(newsId);


    // Step 1: Check if the news article exists
    const newsArticle = await News.findById(newsId);

    if (!newsArticle) {
        return res.status(404).json({ success: false, message: 'News article not found.' });
    }

    // Step 2: Validate the input fields

    // Check if required fields are provided and valid (title, description, content, category)
    if (title && typeof title !== 'string') {
        return res.status(400).json({ success: false, message: 'Title must be a string.' });
    }

    if (description && typeof description !== 'string') {
        return res.status(400).json({ success: false, message: 'Description must be a string.' });
    }

    if (content && typeof content !== 'string') {
        return res.status(400).json({ success: false, message: 'Content must be a string.' });
    }

    const validCategories = ['Movies', 'Actors', 'Projects', 'Industry', 'Drama'];
    if (category && !validCategories.includes(category)) {
        return res.status(400).json({ success: false, message: 'Category must be one of: Movies, Actors, Projects, Industry, Drama' });
    }

    // Step 3: Validate relatedMovies (if provided)
    if (relatedMovies && !Array.isArray(relatedMovies)) {
        return res.status(400).json({ success: false, message: 'Related movies should be an array of ObjectIds.' });
    }

    if (relatedMovies && !relatedMovies.every(id => mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({ success: false, message: 'Each related movie must be a valid ObjectId.' });
    }

    // Check if all relatedMovies IDs exist in the Person collection
    let invalidMovieIds = [];
    if (relatedMovies) {
        invalidMovieIds = await checkObjectIdsExist(relatedMovies);
        if (invalidMovieIds.length > 0) {
            return res.status(400).json({ success: false, message: `The following related movie IDs do not exist: ${invalidMovieIds.join(', ')}` });
        }
    }

    // Step 4: Validate relatedActors (if provided)
    if (relatedActors && !Array.isArray(relatedActors)) {
        return res.status(400).json({ success: false, message: 'Related actors should be an array of ObjectIds.' });
    }

    if (relatedActors && !relatedActors.every(id => mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({ success: false, message: 'Each related actor must be a valid ObjectId.' });
    }


    // Step 5: Check if any fields are provided to update
    // If no valid fields are provided, return a message saying nothing is updated
    if (!title && !description && !content && !category && !relatedMovies && !relatedActors) {
        return res.status(400).json({ success: false, message: 'No fields provided to update. Nothing was updated.', newsArticle });
    }

    // Check if all relatedActors IDs exist in the Person collection
    let invalidActorIds = [];
    if (relatedActors) {
        invalidActorIds = await checkObjectIdsExist(relatedActors);
        if (invalidActorIds.length > 0) {
            return res.status(400).json({ success: false, message: `The following related actor IDs do not exist: ${invalidActorIds.join(', ')}` });
        }
    }

    // Step 5: Update the news article
    try {
        // Only update fields that are provided
        if (title) newsArticle.title = title;
        if (description) newsArticle.description = description;
        if (content) newsArticle.content = content;
        if (category) newsArticle.category = category;
        if (relatedMovies) newsArticle.relatedMovies = relatedMovies;
        if (relatedActors) newsArticle.relatedActors = relatedActors;

        // Save the updated news article
        await newsArticle.save();

        // Return success response
        res.status(200).json({ success: true, message: 'News article updated successfully', news: newsArticle });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating news article', error: err.message });
    }
});


module.exports = router;
