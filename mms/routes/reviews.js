
/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Movie reviews and ratings management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       required:
 *         - movie
 *         - rating
 *       properties:
 *         movie:
 *           type: string
 *           format: mongoose.ObjectId
 *           description: The ID of the movie being reviewed
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           description: Rating value between 1 and 5
 *         reviewText:
 *           type: string
 *           description: Optional review text
 */
const express = require('express');
const mongoose = require('mongoose');
const ReviewAndRating = require('../models/ReviewAndRating');
const Movie = require('../models/Movie');
const User = require('../models/User');
const authenticateUser = require('../middleware/auth'); // Import the JWT middleware
const router = express.Router();

/**
 * @swagger
 * /api/reviews/:
 *   post:
 *     summary: Add a new review and rating for a movie
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movie
 *               - rating
 *             properties:
 *               movie:
 *                 type: string
 *                 format: mongoose.ObjectId
 *                 description: Valid MongoDB ObjectId of the movie
 *                 example: "507f1f77bcf86cd799439011"
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating must be a whole number between 1 and 5
 *                 example: 4
 *               reviewText:
 *                 type: string
 *                 description: Optional detailed review text
 *                 example: "This movie was fantastic! Great plot and acting."
 *     responses:
 *       201:
 *         description: Review successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Review and rating added successfully"
 *                 review:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Rating must be between 1 and 5"
 *       401:
 *         description: Unauthorized - User not logged in
 *       404:
 *         description: Movie or User not found
 *       409:
 *         description: User has already reviewed this movie
 */
// 1. Add a rating and review for a movie
router.post('/', authenticateUser, async (req, res) => {
    const { movie, rating, reviewText } = req.body;
    const user = req.user.userId; // Get the userId from the decoded token

    // Validate required fields
    if (!movie || !rating) {
        return res.status(400).json({ message: 'MovieID, rating are mandatory fields while reviewText is optional' });
    }

    // Rating must be between 1 and 5
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if movie ID is valid
    if (!mongoose.Types.ObjectId.isValid(movie)) {
        return res.status(400).json({ message: 'Invalid Movie ID format' });
    }
    // Check if the movie exists
    const foundMovie = await Movie.findById(movie);
    if (!foundMovie) {
        return res.status(404).json({ message: 'Movie not found' });
    }

    // Check if the user exists (optional since user ID comes from token, but we can double-check)
    const foundUser = await User.findById(user);
    if (!foundUser) {
        return res.status(404).json({ message: 'User not found' });
    }
    // Check if the user has already reviewed this movie
    const existingReview = await ReviewAndRating.findOne({ user: user, movie: movie });
    if (existingReview) {
        return res.status(400).json({ message: 'You have already reviewed this movie' });
    }

    // Create the new review and rating
    const newReview = new ReviewAndRating({
        user,
        movie,
        rating,
        reviewText
    });

    try {
        await newReview.save();
        // After saving the review, update the movie's average rating
        await updateMovieRating(movie);
        res.status(201).json({ message: 'Review and rating added successfully', review: newReview });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error adding review', error: err.message });
    }
});


/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   put:
 *     summary: Update an existing review and rating
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Updated rating (1-5)
 *                 example: 4
 *               reviewText:
 *                 type: string
 *                 description: Updated review text
 *                 example: "After watching it again, I noticed more details..."
 *     responses:
 *       200:
 *         description: Review successfully updated
 *       400:
 *         description: Invalid rating value or empty update
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User not authorized to update this review
 *       404:
 *         description: Review not found
 */
// 2. Update an existing review and rating
router.put('/:reviewId', authenticateUser, async (req, res) => {
    const { reviewId } = req.params;
    const { rating, reviewText } = req.body;
    const user = req.user.userId; // Get userId from the token

    // Validate required fields
    if (!rating && !reviewText) {
        return res.status(400).json({ message: 'Either rating or reviewText must be provided for update' });
    }

    if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    try {
        const review = await ReviewAndRating.findById(reviewId);

        // Ensure that the user is the one who created the review
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        if (review.user.toString() !== user) {
            return res.status(403).json({ message: 'You are not authorized to update this review' });
        }

        // Update the review fields
        if (rating) review.rating = rating;
        if (reviewText) review.reviewText = reviewText;
        review.updatedAt = Date.now(); // Automatically update the 'updatedAt' field

        // Save the updated review
        await review.save();

        // After updating, recalculate the movie's average rating
        await updateMovieRating(review.movie);

        res.status(200).json({ message: 'Review updated successfully', review });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating review', error: err.message });
    }
});

/**
 * @swagger
 * /api/reviews/{movieId}:
 *   get:
 *     summary: Get all reviews for a specific movie
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the movie to get reviews for
 *     responses:
 *       200:
 *         description: List of reviews for the movie
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                   rating:
 *                     type: number
 *                   reviewText:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: No reviews found for this movie
 */
// 3. Get all reviews for a movie
router.get('/:movieId', async (req, res) => {
    const { movieId } = req.params;

    try {
        // Find all reviews for the movie
        const reviews = await ReviewAndRating.find({ movie: movieId })
            .populate('user', 'username')  // Optionally populate user data (e.g., username)
            .sort({ createdAt: -1 }); // Sort by most recent review first

        if (reviews.length === 0) {
            return res.status(404).json({ message: 'No reviews found for this movie' });
        }

        res.status(200).json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching reviews', error: err.message });
    }
});

/**
 * @swagger
 * /api/reviews/average/{movieId}:
 *   get:
 *     summary: Get the average rating for a movie
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the movie to get average rating for
 *     responses:
 *       200:
 *         description: Average rating of the movie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageRating:
 *                   type: number
 *                   format: float
 *                   example: 4.5
 *       404:
 *         description: No reviews found for this movie
 */
// 4. Get the average rating of a movie
router.get('/average/:movieId', async (req, res) => {
    const { movieId } = req.params;

    try {
        // Find all reviews for the movie
        const reviews = await ReviewAndRating.find({ movie: movieId });

        if (reviews.length === 0) {
            return res.status(404).json({ message: 'No reviews found for this movie' });
        }

        // Calculate the average rating
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

        res.status(200).json({ averageRating });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error calculating average rating', error: err.message });
    }
});

/**
 * @swagger
 * /api/reviews/highlights/{movieId}:
 *   get:
 *     summary: Get review highlights including top-rated and most-discussed reviews
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the movie to get review highlights for
 *     responses:
 *       200:
 *         description: Review highlights successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topRatedReviews:
 *                   type: array
 *                   description: Top 5 reviews with ratings >= 4
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                 mostDiscussedReviews:
 *                   type: array
 *                   description: Top 5 reviews with longest review text
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *       500:
 *         description: Server error while fetching highlights
 */
// 5. Get review highlights (top-rated and most-discussed reviews)
router.get('/highlights/:movieId', async (req, res) => {
    const { movieId } = req.params;

    try {
        // Find top-rated reviews (rating >= 4)
        const topRatedReviews = await ReviewAndRating.find({ movie: movieId, rating: { $gte: 4 } })
            .sort({ rating: -1, createdAt: -1 })  // Sort by rating, then by most recent
            .limit(5);  // Limit to top 5

        // Find the most discussed reviews (i.e., reviews with longest reviewText)
        const mostDiscussedReviews = await ReviewAndRating.find({ movie: movieId })
            .sort({ 'reviewText.length': -1 })  // Sort by longest reviewText
            .limit(5);  // Limit to 5 most discussed

        res.status(200).json({
            topRatedReviews,
            mostDiscussedReviews
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching review highlights', error: err.message });
    }
});

// Helper function to update the movie's average rating
async function updateMovieRating(movieId) {
    const reviews = await ReviewAndRating.find({ movie: movieId });
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    // Update the movie's average rating in the database
    await Movie.findByIdAndUpdate(movieId, { averageRating });
}


module.exports = router;
