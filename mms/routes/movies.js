// /routes/movies.js

/**
 * @swagger
 * tags:
 *   name: Movies
 *   description: Movie management and search operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Status indicating if the operation was successful
 *         totalMovies:
 *           type: integer
 *           description: The total number of movies that match the query
 *         page:
 *           type: integer
 *           description: The current page number being viewed
 *         totalPages:
 *           type: integer
 *           description: The total number of pages available
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Movie'  # Reference to the Movie schema
 *       required:
 *         - success
 *         - totalMovies
 *         - page
 *         - totalPages
 *         - data
 *       example:
 *         success: true
 *         totalMovies: 100
 *         page: 1
 *         totalPages: 10
 *         data:  # An array of movie objects
 *           - title: "Inception"
 *             genre: ["Action", "Sci-Fi"]
 *             directors: ["507f1f77bcf86cd799439011"]
 *             actors: ["507f1f77bcf86cd799439012"]
 *             releaseDate: "2010-07-16"
 *             runtime: 148
 *             synopsis: "A thief who steals corporate secrets through dream-sharing technology..."
 *             posterUrl: "https://example.com/inception-poster.jpg"
 *             averageRating: 4.5
 *             ageRating: "PG-13"
 *             countryOfOrigin: "USA"
 *             language: "English"
 *             trivia: ["The movie's visual effects were groundbreaking for its time."]
 *             goofs: ["In one scene, the background city is upside down."]
 *             soundtrack: ["Hans Zimmer - Time"]
 *             boxOffice:
 *               openingWeekend: 60000000
 *               totalGross: 829895144
 *               internationalRevenue: 400000000
 *             awards: ["Academy Award for Best Cinematography"]
 *             createdAt: "2024-01-01T12:00:00Z"
 *     Movie:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the movie
 *         genre:
 *           type: array
 *           items:
 *             type: string
 *           description: List of genres for the movie (e.g., Action, Sci-Fi)
 *         directors:
 *           type: array
 *           items:
 *             type: string
 *             format: mongoose.ObjectId
 *           description: List of director IDs (references to the Person collection)
 *         actors:
 *           type: array
 *           items:
 *             type: string
 *             format: mongoose.ObjectId
 *           description: List of actor IDs (references to the Person collection)
 *         crew:
 *           type: array
 *           items:
 *             type: string
 *             format: mongoose.ObjectId
 *           description: List of crew member IDs (optional, references to the Person collection)
 *         releaseDate:
 *           type: string
 *           format: date
 *           description: Release date of the movie
 *         runtime:
 *           type: number
 *           description: Movie duration in minutes (must be a positive number)
 *         synopsis:
 *           type: string
 *           description: Brief plot summary of the movie
 *         posterUrl:
 *           type: string
 *           description: URL to the movie poster image
 *         averageRating:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *           description: Average user rating of the movie, on a scale from 0 to 5
 *         ageRating:
 *           type: string
 *           enum: [G, PG, PG-13, R, NC-17, Unrated]
 *           description: MPAA rating (e.g., G, PG-13)
 *         countryOfOrigin:
 *           type: string
 *           description: Country of origin of the movie (e.g., USA, UK)
 *         language:
 *           type: string
 *           description: Primary language of the movie (e.g., English, Spanish)
 *         trivia:
 *           type: array
 *           items:
 *             type: string
 *           description: List of trivia facts related to the movie
 *         goofs:
 *           type: array
 *           items:
 *             type: string
 *           description: List of goofs or mistakes in the movie
 *         soundtrack:
 *           type: array
 *           items:
 *             type: string
 *           description: List of soundtracks featured in the movie
 *         boxOffice:
 *           type: object
 *           properties:
 *             openingWeekend:
 *               type: number
 *               description: Opening weekend box office revenue (optional)
 *             totalGross:
 *               type: number
 *               description: Total worldwide box office gross revenue
 *             internationalRevenue:
 *               type: number
 *               description: International box office revenue
 *         awards:
 *           type: array
 *           items:
 *             type: string
 *           description: List of awards won by the movie
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the movie was created (automatically generated)
 *       required:
 *         - title
 *         - genre
 *         - directors
 *         - actors
 *         - releaseDate
 *         - runtime
 *         - ageRating
 *         - countryOfOrigin
 *         - language
 *       example:
 *         title: "Inception"
 *         genre: ["Action", "Sci-Fi"]
 *         directors: ["507f1f77bcf86cd799439011"]
 *         actors: ["507f1f77bcf86cd799439012"]
 *         releaseDate: "2010-07-16"
 *         runtime: 148
 *         synopsis: "A thief who steals corporate secrets through dream-sharing technology..."
 *         posterUrl: "https://example.com/inception-poster.jpg"
 *         averageRating: 4.5
 *         ageRating: "PG-13"
 *         countryOfOrigin: "USA"
 *         language: "English"
 *         trivia: ["The movie's visual effects were groundbreaking for its time."]
 *         goofs: ["In one scene, the background city is upside down."]
 *         soundtrack: ["Hans Zimmer - Time"]
 *         boxOffice:
 *           openingWeekend: 60000000
 *           totalGross: 829895144
 *           internationalRevenue: 400000000
 *         awards: ["Academy Award for Best Cinematography"]
 *         createdAt: "2024-01-01T12:00:00Z"
 */

const express = require('express');
const mongoose = require('mongoose');
const Reviews = require('../models/ReviewAndRating');
const Movie = require('../models/Movie');
const User = require('../models/User');
const authenticateUser = require('../middleware/auth'); // Import the JWT middleware
const router = express.Router();
const Person = require('../models/person');  // Assuming this is your unified Person table


/**
 * @swagger
 * /api/movies/upcoming:
 *   get:
 *     summary: Get paginated list of upcoming movies
 *     tags: [Movies]
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
 *         description: Successfully retrieved upcoming movies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       500:
 *         description: Server error while fetching upcoming movies
 */
// Route to get upcoming movies with pagination
router.get('/upcoming', async (req, res) => {
    try {
        const today = new Date();

        // Extract page and limit from query parameters
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

        // Calculate the number of items to skip
        const skip = (page - 1) * limit;

        // Fetch upcoming movies with pagination
        const upcomingMovies = await Movie.find({ releaseDate: { $gte: today } })
            .sort({ releaseDate: 1 }) // Sort by release date ascending
            .skip(skip)
            .limit(limit)
            .select('title releaseDate genre posterUrl'); // Only select relevant fields

        // Count the total number of upcoming movies for pagination metadata
        const totalMovies = await Movie.countDocuments({ releaseDate: { $gte: today } });

        res.status(200).json({
            success: true,
            totalMovies,
            page,
            totalPages: Math.ceil(totalMovies / limit),
            data: upcomingMovies
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch upcoming movies', message: err.message });
    }
});

/**
 * @swagger
 * /api/movies/search:
 *   get:
 *     summary: Search movies by title, genre, actor and director (paginated response will be given)
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Movie title (case-insensitive partial match)
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Movie genre
 *       - in: query
 *         name: director
 *         schema:
 *           type: string
 *         description: Director name (case-insensitive)
 *       - in: query
 *         name: actor
 *         schema:
 *           type: string
 *         description: Actor name (case-insensitive)
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
 *         description: Search results with pagination
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       404:
 *         description: Director or actor not found
 *       500:
 *         description: Server error during search
 */
//Route to search movie by title,genre,directors and actors with pagination
router.get('/search', async (req, res) => {
    Movie.schema.set('strictPopulate', false);

    const { title, genre, director, actor, page = 1, limit = 10 } = req.query;
    let searchQuery = {};

    // Validate and build search query for title and genre
    if (title) {
        searchQuery.title = { $regex: title, $options: 'i' };
    }

    if (genre) {
        searchQuery.genre = genre;
    }

    try {
        // Handle director search
        if (director) {
            const directorResult = await Person.findOne({
                name: { $regex: director, $options: 'i' },
                type: 'director'
            });

            if (directorResult) {
                // Include movies where this person is either a director or an actor
                searchQuery.$or = searchQuery.$or || [];
                searchQuery.$or.push({ directors: directorResult._id }, { actors: directorResult._id });
            } else {
                return res.status(404).json({ message: `Director with name ${director} not found` });
            }
        }

        // Handle actor search
        if (actor) {
            const actorResult = await Person.findOne({
                name: { $regex: actor, $options: 'i' }
            });

            if (actorResult) {
                // If the person is found and they are an actor, look for them in the 'actors' field
                if (actorResult.type === 'actor') {
                    searchQuery.$or = searchQuery.$or || [];
                    searchQuery.$or.push({ actors: actorResult._id });
                }

                // If the person is also a director and we searched by actor, include their movies as well
                if (actorResult.type === 'director' || actorResult.type === 'actor') {
                    searchQuery.$or = searchQuery.$or || [];
                    searchQuery.$or.push({ actors: actorResult._id }, { directors: actorResult._id });
                }
            } else {
                return res.status(404).json({ message: `Actor with name ${actor} not found` });
            }
        }

        // Calculate pagination values
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const parsedLimit = parseInt(limit);

        // Perform the query to find movies with the constructed search query and apply pagination
        const movies = await Movie.find(searchQuery)
            .populate('directors', 'name') // Populate director with their name
            .populate('actors', 'name')    // Populate actors with their names
            .skip(skip)
            .limit(parsedLimit);

        // Get the total count of documents matching the search query
        const totalMovies = await Movie.countDocuments(searchQuery);

        // Return the movies found with pagination metadata
        res.status(200).json({
            success: true,
            totalMovies,
            page: parseInt(page),
            totalPages: Math.ceil(totalMovies / parsedLimit),
            data: movies
        });

    } catch (err) {
        console.error(err);  // Log error for debugging
        res.status(500).json({ message: 'Failed to search movies', error: err.message });
    }
});

/**
 * @swagger
 * /api/movies/filter:
 *   get:
 *     summary: Filter movies by rating and release year (paginated response will be given)
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *         description: Minimum average rating
 *       - in: query
 *         name: releaseYear
 *         schema:
 *           type: integer
 *         description: Release year
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
 *         description: Filtered movies with pagination
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       500:
 *         description: Server error while filtering
 */
//Route to filter movies based on release year and rating with pagination
router.get('/filter', async (req, res) => {
    const { rating, releaseYear, page = 1, limit = 10 } = req.query;

    // Initialize filter query
    let filterQuery = {};

    // Filter by rating if provided
    if (rating) {
        filterQuery.averageRating = { $gte: parseFloat(rating) }; // Ensure rating is greater than or equal to provided value
    }

    // Filter by release year if provided
    if (releaseYear) {
        filterQuery.releaseDate = {
            $gte: new Date(releaseYear, 0, 1),
            $lt: new Date(parseInt(releaseYear) + 1, 0, 1)
        }; // Filter for movies released in the specified year
    }

    try {
        // Calculate pagination values
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const parsedLimit = parseInt(limit);

        // Fetch the filtered movies from the database with pagination
        const movies = await Movie.find(filterQuery)
            .skip(skip)
            .limit(parsedLimit);

        // Count total documents for the filter query
        const totalMovies = await Movie.countDocuments(filterQuery);

        // Send the filtered list of movies with pagination metadata
        res.status(200).json({
            success: true,
            totalMovies,
            page: parseInt(page),
            totalPages: Math.ceil(totalMovies / parsedLimit),
            data: movies
        });
    } catch (err) {
        // If an error occurs, return a 500 response with the error message
        res.status(500).json({ error: 'Failed to filter movies', message: err.message });
    }
});


/**
 * @swagger
 * /api/movies/advanced-filter:
 *   get:
 *     summary: Advanced movie filtering by kewwords, language, countryoforigin, agerating.(paginated response)
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: decade
 *         schema:
 *           type: string
 *         description: Decade (format "1990s")
 *         example: "1990s"
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Country of origin
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Movie language
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: Search across title, genre, synopsis, trivia, etc.
 *       - in: query
 *         name: ageRating
 *         schema:
 *           type: string
 *           enum: [G, PG, PG-13, R, NC-17]
 *         description: MPAA rating
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
 *         description: Advanced filtered results with pagination
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       500:
 *         description: Server error during advanced filtering
 */
//Route to advance filtering movies based on country of origin, language, decade, keywords, agerating with pagination
router.get('/advanced-filter', async (req, res) => {
    const { decade, country, language, keywords, ageRating, page = 1, limit = 10 } = req.query;

    let advancedFilterQuery = {};

    // Apply decade filter
    if (decade) {
        const startYear = parseInt(decade.slice(0, 4)); // Assumes decade format like "1990s"
        const endYear = startYear + 9;
        advancedFilterQuery.releaseDate = { $gte: new Date(startYear, 0, 1), $lte: new Date(endYear, 11, 31) };
    }

    // Apply countryOfOrigin and language filters (if present)
    if (country) advancedFilterQuery.countryOfOrigin = { $regex: country, $options: 'i' };
    if (language) advancedFilterQuery.language = { $regex: language, $options: 'i' };

    // Apply the keyword search across specific fields
    if (keywords) {
        const regexQuery = [
            { title: { $regex: keywords, $options: 'i' } },
            { genre: { $regex: keywords, $options: 'i' } },
            { synopsis: { $regex: keywords, $options: 'i' } },
            { trivia: { $regex: keywords, $options: 'i' } },
            { goofs: { $regex: keywords, $options: 'i' } },
            { soundtrack: { $regex: keywords, $options: 'i' } },
            { awards: { $regex: keywords, $options: 'i' } }
        ];

        // Add the $or operator for keyword search across these fields
        advancedFilterQuery.$or = regexQuery;
    }

    // Apply filter by ageRating if present
    if (ageRating) {
        advancedFilterQuery.ageRating = ageRating;
    }

    try {
        // Calculate pagination values
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const parsedLimit = parseInt(limit);

        // Fetch filtered movies with pagination
        const movies = await Movie.find(advancedFilterQuery)
            .skip(skip)
            .limit(parsedLimit);

        // Count total documents for the filter query
        const totalMovies = await Movie.countDocuments(advancedFilterQuery);

        // Send the filtered list of movies with pagination metadata
        res.status(200).json({
            success: true,
            totalMovies,
            page: parseInt(page),
            totalPages: Math.ceil(totalMovies / parsedLimit),
            data: movies
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to apply advanced filters', message: err.message });
    }
});


/**
 * @swagger
 * /api/movies/top-month:
 *   get:
 *     summary: Get top rated movies of the current month (paginated response)
 *     tags: [Movies]
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
 *         description: Top movies of the month with pagination
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       500:
 *         description: Server error while fetching top movies
 */
// Route to get top movies of the month with paginatioon
router.get('/top-month', async (req, res) => {
    const currentMonth = new Date().getMonth(); // 0-indexed, so January is 0
    const currentYear = new Date().getFullYear();

    // Get pagination parameters with defaults (page=1, limit=10)
    const { page = 1, limit = 10 } = req.query;

    try {
        // Calculate skip and limit for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const parsedLimit = parseInt(limit);

        // Fetch top movies of the current month with pagination
        const topMovies = await Movie.find({
            releaseDate: {
                $gte: new Date(currentYear, currentMonth, 1), // First day of the current month
                $lt: new Date(currentYear, currentMonth + 1, 1) // First day of the next month
            }
        })
            .sort({ rating: -1 }) // Sort by rating, descending
            .skip(skip) // Skip results for pagination
            .limit(parsedLimit); // Limit the number of results

        // Count total movies for the current month's filter
        const totalMovies = await Movie.countDocuments({
            releaseDate: {
                $gte: new Date(currentYear, currentMonth, 1),
                $lt: new Date(currentYear, currentMonth + 1, 1)
            }
        });

        // Return the paginated results with pagination metadata
        res.json({
            success: true,
            totalMovies,
            page: parseInt(page),
            totalPages: Math.ceil(totalMovies / parsedLimit),
            data: topMovies
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get top movies of the month', message: err.message });
    }
});



/**
 * @swagger
 * /api/movies/top-genre:
 *   get:
 *     summary: Get top rated movies by genre (paginated response)
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: genre
 *         required: true
 *         schema:
 *           type: string
 *         description: Genre to filter by
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
 *         description: Top movies by genre with pagination
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       400:
 *         description: Genre parameter is missing
 *       500:
 *         description: Server error while fetching top genre movies
 */
// Route to get top 10 movies by genre with pagination
router.get('/top-genre', async (req, res) => {
    const { genre, page = 1, limit = 10 } = req.query;

    if (!genre) {
        return res.status(400).json({ error: 'Genre is required' });
    }

    try {
        // Calculate skip and limit for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const parsedLimit = parseInt(limit);

        // Fetch top movies by genre with pagination
        const topGenreMovies = await Movie.find({ genre: { $regex: genre, $options: 'i' } }) // Case-insensitive search
            .sort({ rating: -1 }) // Sort by rating, descending
            .skip(skip) // Skip the appropriate number of documents
            .limit(parsedLimit); // Limit the number of results

        // Count total movies matching the genre
        const totalMovies = await Movie.countDocuments({ genre: { $regex: genre, $options: 'i' } });

        // Return the paginated results with pagination metadata
        res.json({
            success: true,
            totalMovies,
            page: parseInt(page),
            totalPages: Math.ceil(totalMovies / parsedLimit),
            data: topGenreMovies
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get top movies by genre', message: err.message });
    }
});

module.exports = router;