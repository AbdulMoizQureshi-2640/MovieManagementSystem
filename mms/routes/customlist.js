/**
 * @swagger
 * tags:
 *   name: Custom Lists
 *   description: Movie custom lists management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CustomListResponse:
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
 *           description: Total number of items
 *         customLists:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CustomList'
 *     
 *     CustomList:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: mongoose.ObjectId
 *         user:
 *           type: string
 *           format: mongoose.ObjectId
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         movies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Movie'
 *     
 */
const express = require('express');
const mongoose = require('mongoose');
const Reviews = require('../models/ReviewAndRating');
const Movie = require('../models/Movie');
const User = require('../models/User');
const authenticateUser = require('../middleware/auth'); // Import the JWT middleware
const router = express.Router();
const Person = require('../models/person');  // Assuming this is your unified Person table
const CustomList = require('../models/Customlist'); // Import custom list model


/**
 * @swagger
 * /api/customlist/all:
 *   get:
 *     summary: Get all custom lists (public)
 *     tags: [Custom Lists]
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
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved custom lists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomListResponse'
 *       404:
 *         description: No custom lists found on requested page
 *       500:
 *         description: Server error
 */
// View All Custom Lists (without user authentication)
router.get('/all', async (req, res) => {
    try {
        // Get pagination parameters with defaults
        let { page = 1, limit = 10 } = req.query;

        // Ensure page is at least 1 and limit is a positive number
        page = Math.max(1, parseInt(page));
        limit = Math.max(1, parseInt(limit)); // Ensure limit is a positive number

        // Fetch all custom lists with pagination
        const customLists = await CustomList.find()
            .skip((page - 1) * limit) // Skip based on page number
            .limit(limit) // Limit the number of custom lists per page
            .populate({
                path: 'movies',
                select: 'title genre releaseDate synopsis ageRating',
                populate: [
                    { path: 'actors', select: 'name' },
                    { path: 'directors', select: 'name' }
                ]
            });

        // Get the total number of custom lists for pagination info
        const totalItemsCount = await CustomList.countDocuments();

        // Calculate totalPages
        const totalPages = totalItemsCount === 0 ? 1 : Math.ceil(totalItemsCount / limit);

        // Handle the case where no custom lists are found on the requested page
        if (customLists.length === 0 && page > 1) {
            return res.status(404).json({ message: 'No custom lists found on the requested page' });
        }

        // Send the response with custom lists and pagination info
        res.json({
            success: true,
            page: page,
            totalPages: totalPages,
            totalItems: totalItemsCount,
            customLists: customLists
        });

    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch custom lists', message: err.message });
    }
});


/**
 * @swagger
 * /api/customlist/:
 *   get:
 *     summary: Get user's custom lists
 *     tags: [Custom Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved user's custom lists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomListResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No custom lists found
 *       500:
 *         description: Server error
 */
// View All Custom Lists (with Movie Details) of user
router.get('/', authenticateUser, async (req, res) => {
    try {
        // Get pagination parameters with defaults
        let { page = 1, limit = 10 } = req.query;

        // Ensure page is at least 1 and limit is a positive number
        page = Math.max(1, parseInt(page));
        limit = Math.max(1, parseInt(limit)); // Ensure limit is a positive number

        // Find custom lists for the authenticated user with pagination
        const customLists = await CustomList.find({ user: req.user.userId })
            .skip((page - 1) * limit)  // Skip documents based on the page number
            .limit(limit)  // Limit the number of custom lists per page
            .populate({
                path: 'movies',
                select: 'title genre releaseDate synopsis ageRating',
                populate: [
                    { path: 'actors', select: 'name' },
                    { path: 'directors', select: 'name' }
                ]
            });

        // Get the total number of custom lists for pagination info
        const totalItemsCount = await CustomList.countDocuments({ user: req.user.userId });

        // Calculate totalPages
        const totalPages = totalItemsCount === 0 ? 1 : Math.ceil(totalItemsCount / limit);

        // Handle the case where no custom lists are found on the requested page
        if (customLists.length === 0 && page > 1) {
            return res.status(404).json({ message: 'No custom lists found on the requested page' });
        }

        // Send the response with custom lists and pagination info
        res.json({
            success: true,
            page: page,
            totalPages: totalPages,
            totalItems: totalItemsCount,
            customLists: customLists
        });

    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch custom lists', message: err.message });
    }
});

/**
 * @swagger
 * /api/customlist/create-new:
 *   post:
 *     summary: Create a new custom list
 *     tags: [Custom Lists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Custom list created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 customList:
 *                   $ref: '#/components/schemas/CustomList'
 *       400:
 *         description: Invalid request or list name already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Create a new custom list
router.post('/create-new', authenticateUser, async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'List name is required' });
    }

    try {
        // Check if a custom list with the same name already exists for this user
        const existingList = await CustomList.findOne({
            user: req.user.userId,  // Check that the list belongs to the authenticated user
            name: name  // Check for the same list name
        });

        if (existingList) {
            return res.status(400).json({ error: 'A custom list with this name already exists' });
        }

        // Create a new custom list
        const customList = new CustomList({
            user: req.user.userId,  // Get user ID from authenticated user
            name,
            description
        });

        await customList.save();
        res.status(201).json({ message: 'Custom list created', customList });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create custom list', message: err.message });
    }
});


/**
 * @swagger
 * /api/customlist/delete/{listId}:
 *   delete:
 *     summary: Delete a custom list
 *     tags: [Custom Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of custom list to delete
 *     responses:
 *       200:
 *         description: Custom list deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not list owner
 *       404:
 *         description: Custom list not found
 *       500:
 *         description: Server error
 */
// Delete Custom List by ID
router.delete('/delete/:listId', authenticateUser, async (req, res) => {
    const { listId } = req.params;

    try {
        // Find the custom list by ID and check if it belongs to the authenticated user
        const customList = await CustomList.findById(listId);

        if (!customList) {
            return res.status(404).json({ error: 'Custom list not found' });
        }

        if (customList.user.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'You are not authorized to delete this custom list' });
        }

        // Delete the custom list
        // Use findByIdAndDelete() instead of remove()
        await CustomList.findByIdAndDelete(listId);
        res.json({ message: 'Custom list deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete custom list', message: err.message });
    }
});



/**
 * @swagger
 * /api/customlist/{listId}/add-movie:
 *   post:
 *     summary: Add movie to custom list
 *     tags: [Custom Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Movie added successfully
 *       400:
 *         description: Movie already in list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not list owner
 *       404:
 *         description: List or movie not found
 *       500:
 *         description: Server error
 */
// Add movie to a custom list
router.post('/:listId/add-movie', authenticateUser, async (req, res) => {
    const { listId } = req.params;
    const { movieId } = req.body;

    if (!movieId) {
        return res.status(400).json({ error: 'Movie ID is required' });
    }

    try {
        // Check if the movie exists in the Movie collection
        const movieExists = await Movie.findById(movieId);

        if (!movieExists) {
            return res.status(404).json({ error: 'Movie not found in the database' });
        }

        // Find the custom list by ID
        const customList = await CustomList.findById(listId);

        if (!customList) {
            return res.status(404).json({ error: 'Custom list not found' });
        }
        if (customList.user.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'You are not authorized to add movie to this custom list' });
        }

        // Check if the movie is already in the custom list
        if (customList.movies.includes(movieId)) {
            return res.status(400).json({ error: 'Movie already in the list' });
        }

        // Add movie to the custom list
        customList.movies.push(movieId);
        await customList.save();

        res.json({ message: 'Movie added to custom list successfully', customList });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add movie to custom list', message: err.message });
    }
});


/**
 * @swagger
 * /api/customlist/{listId}/update:
 *   put:
 *     summary: Update custom list details
 *     tags: [Custom Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Custom list updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not list owner
 *       404:
 *         description: Custom list not found
 *       500:
 *         description: Server error
 */

// Update Custom List (Name or Description)
router.put('/:listId/update', authenticateUser, async (req, res) => {
    const { listId } = req.params;
    const { name, description } = req.body;

    if (!name && !description) {
        return res.status(400).json({ error: 'At least name or description is required to update' });
    }


    if (!listId) {
        return res.status(400).json({ error: 'Please Provide valid list id' });
    }

    try {
        // Find the custom list by ID and check if it belongs to the authenticated user
        const customList = await CustomList.findById(listId);

        if (!customList) {
            return res.status(404).json({ error: 'Custom list not found' });
        }

        if (customList.user.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'You are not authorized to update this custom list' });
        }

        // Update the custom list fields
        if (name) customList.name = name;
        if (description) customList.description = description;

        await customList.save();

        res.json({ message: 'Custom list updated successfully', customList });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update custom list', message: err.message });
    }
});



/**
 * @swagger
 * /api/customlist/{listId}/remove-movie:
 *   delete:
 *     summary: Remove movie from custom list
 *     tags: [Custom Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Movie removed successfully
 *       400:
 *         description: Invalid request or movie not in list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not list owner
 *       404:
 *         description: List not found
 *       500:
 *         description: Server error
 */
// Delete Movie from Custom List
router.delete('/:listId/remove-movie', authenticateUser, async (req, res) => {
    const { listId } = req.params;
    const { movieId } = req.body;

    if (!movieId) {
        return res.status(400).json({ error: 'Movie ID is required' });
    }

    try {
        // Find the custom list by ID
        const customList = await CustomList.findById(listId);

        if (!customList) {
            return res.status(404).json({ error: 'Custom list not found' });
        }

        if (customList.user.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'You are not authorized to remove movie from this custom list' });
        }
        // Check if the movie exists in the custom list
        const movieIndex = customList.movies.indexOf(movieId);
        if (movieIndex === -1) {
            return res.status(404).json({ error: 'Movie not found in the custom list' });
        }

        // Remove the movie from the custom list
        customList.movies.splice(movieIndex, 1);
        await customList.save();

        res.json({ message: 'Movie removed from custom list', customList });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove movie from custom list', message: err.message });
    }
});



module.exports = router;