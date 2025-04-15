/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: Movie recommendations and discovery endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MovieRecommendationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Operation success status
 *         recommendations:
 *           type: object
 *           properties:
 *             personalized:
 *               type: object
 *               properties:
 *                 movies:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movie'
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalItems:
 *                   type: integer
 *             trending:
 *               type: object
 *               properties:
 *                 movies:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movie'
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalItems:
 *                   type: integer
 *     
 *     SimilarMoviesResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         similarMovies:
 *           type: object
 *           properties:
 *             movies:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Movie'
 *             page:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             totalItems:
 *               type: integer
 *     
 *     TrendingMoviesResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         movies:
 *           type: object
 *           properties:
 *             trending:
 *               type: object
 *               properties:
 *                 movies:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movie'
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalItems:
 *                   type: integer
 *             topRated:
 *               type: object
 *               properties:
 *                 movies:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movie'
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalItems:
 *                   type: integer
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const User = require('../models/User');
const authenticateUser = require('../middleware/auth');


/**
 * @swagger
 * /api/recommendations/personalized:
 *   get:
 *     summary: Get personalized movie recommendations
 *     description: Returns personalized movie recommendations based on user's favorite genres and trending movies
 *     tags: [Recommendations]
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
 *         description: Successfully retrieved personalized recommendations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MovieRecommendationResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// Personalized Recommendations
router.get('/personalized', authenticateUser, async (req, res) => {
    try {
        const id = req.user.userId; // Assuming `req.user` is populated via authentication middleware
        let userId = new mongoose.Types.ObjectId(id); // Convert string ID to ObjectId

        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const favoriteGenres = user.profile.favoriteGenres || [];

        // Get pagination parameters with defaults
        let { page = 1, limit = 10 } = req.query;

        // Ensure page is at least 1 and limit is a positive number
        page = Math.max(1, parseInt(page));
        limit = Math.max(1, parseInt(limit)); // Ensure limit is a positive number

        // Fetch personalized movie recommendations based on user's favorite genres with pagination
        const genreRecommendations = await Movie.find({ genre: { $in: favoriteGenres } })
            .skip((page - 1) * limit)  // Skip documents based on the page number
            .limit(limit);  // Limit the number of movies per page

        // Fetch trending movies (e.g., based on high ratings or popularity) with pagination
        const trendingMovies = await Movie.find()
            .sort({ averageRating: -1 })
            .skip((page - 1) * limit)  // Skip documents based on the page number
            .limit(limit);  // Limit the number of trending movies per page

        // Get total counts for pagination info
        const totalGenreRecommendations = await Movie.countDocuments({ genre: { $in: favoriteGenres } });
        const totalTrendingMovies = await Movie.countDocuments();

        // Calculate total pages for both recommendations and trending movies
        const totalGenrePages = totalGenreRecommendations === 0 ? 1 : Math.ceil(totalGenreRecommendations / limit);
        const totalTrendingPages = totalTrendingMovies === 0 ? 1 : Math.ceil(totalTrendingMovies / limit);

        res.status(200).json({
            success: true,
            recommendations: {
                personalized: {
                    movies: genreRecommendations,
                    page: page,
                    totalPages: totalGenrePages,
                    totalItems: totalGenreRecommendations
                },
                trending: {
                    movies: trendingMovies,
                    page: page,
                    totalPages: totalTrendingPages,
                    totalItems: totalTrendingMovies
                }
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching recommendations', error: error.message });
    }
});

/**
 * @swagger
 * /api/recommendations/similar-movies/{id}:
 *   get:
 *     summary: Get similar movies
 *     description: Returns movies similar to the specified movie based on genre, directors, or actors
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoose.ObjectId
 *         description: ID of the movie to find similar titles for
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
 *         description: Successfully retrieved similar movies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimilarMoviesResponse'
 *       404:
 *         description: Movie not found
 *       500:
 *         description: Server error
 */
//similar movies
router.get('/similar-movies/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let movieId = new mongoose.Types.ObjectId(id); // Convert string ID to ObjectId

        // Find the movie
        const movie = await Movie.findById(movieId);
        if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });

        // Get pagination parameters with defaults
        let { page = 1, limit = 10 } = req.query;

        // Ensure page is at least 1 and limit is a positive number
        page = Math.max(1, parseInt(page));
        limit = Math.max(1, parseInt(limit)); // Ensure limit is a positive number

        // Find similar movies by genre, director, or shared actors with pagination
        const similarMovies = await Movie.find({
            _id: { $ne: movieId },
            $or: [
                { genre: { $in: movie.genre } },
                { directors: { $in: movie.directors } },
                { actors: { $in: movie.actors } },
            ],
        })
            .skip((page - 1) * limit)  // Skip documents based on the page number
            .limit(limit);  // Limit the number of similar movies per page

        // Get total count of similar movies for pagination info
        const totalSimilarMovies = await Movie.countDocuments({
            _id: { $ne: movieId },
            $or: [
                { genre: { $in: movie.genre } },
                { directors: { $in: movie.directors } },
                { actors: { $in: movie.actors } },
            ],
        });

        // Calculate total pages
        const totalPages = totalSimilarMovies === 0 ? 1 : Math.ceil(totalSimilarMovies / limit);

        res.status(200).json({
            success: true,
            similarMovies: {
                movies: similarMovies,
                page: page,
                totalPages: totalPages,
                totalItems: totalSimilarMovies
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching similar titles', error: error.message });
    }
});

/**
 * @swagger
 * /api/recommendations/trending-movies:
 *   get:
 *     summary: Get trending and top-rated movies
 *     description: Returns lists of trending and top-rated movies with pagination
 *     tags: [Recommendations]
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
 *         description: Successfully retrieved trending and top-rated movies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TrendingMoviesResponse'
 *       500:
 *         description: Server error
 */
// Trending and Top Rated Movies
router.get('/trending-movies', async (req, res) => {
    try {
        // Get pagination parameters with defaults
        let { page = 1, limit = 10 } = req.query;

        // Ensure page is at least 1 and limit is a positive number
        page = Math.max(1, parseInt(page));
        limit = Math.max(1, parseInt(limit)); // Ensure limit is a positive number

        // Fetch trending movies based on ratings with pagination
        const trendingMovies = await Movie.find()
            .sort({ averageRating: -1 })
            .skip((page - 1) * limit)  // Skip movies based on page number
            .limit(limit);  // Limit the number of movies per page

        // Fetch total count of trending movies for pagination info
        const totalTrendingMovies = await Movie.countDocuments();

        // Calculate total pages for trending movies
        const totalTrendingPages = totalTrendingMovies === 0 ? 1 : Math.ceil(totalTrendingMovies / limit);

        // Fetch top-rated movies with pagination (same logic)
        const topRatedMovies = await Movie.find()
            .sort({ averageRating: -1 })
            .skip((page - 1) * limit)  // Skip movies based on page number
            .limit(limit);  // Limit the number of movies per page

        // Fetch total count of top-rated movies for pagination info
        const totalTopRatedMovies = await Movie.countDocuments();

        // Calculate total pages for top-rated movies
        const totalTopRatedPages = totalTopRatedMovies === 0 ? 1 : Math.ceil(totalTopRatedMovies / limit);

        // Send the response with pagination data
        res.status(200).json({
            success: true,
            movies: {
                trending: {
                    movies: trendingMovies,
                    page: page,
                    totalPages: totalTrendingPages,
                    totalItems: totalTrendingMovies
                },
                topRated: {
                    movies: topRatedMovies,
                    page: page,
                    totalPages: totalTopRatedPages,
                    totalItems: totalTopRatedMovies
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching movies', error: error.message });
    }
});


module.exports = router;
