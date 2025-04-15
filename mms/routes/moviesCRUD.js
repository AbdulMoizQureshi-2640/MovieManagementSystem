// /routes/movies.js

/**
 * @swagger
 * tags:
 *   name: Movies CRUD (Admin Panel)
 *   description: Admin Panel with Movie management and retrieval operations and admin-insights
 */
const express = require('express');
const Movie = require('../models/Movie');
const router = express.Router();
const mongoose = require('mongoose');
const authenticateUser = require('../middleware/auth');
const Person = require('../models/person');
const Discussion = require('../models/discussion');


/**
 * @swagger
 * /api/moviesCRUD/:
 *   get:
 *     summary: Get all movies with pagination
 *     tags: 
 *       - Movies CRUD (Admin Panel)
 *       - Movies
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved movies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalMovies:
 *                   type: integer
 *                   example: 50
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "Inception"
 *                       genre:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["Action", "Sci-Fi"]
 *       404:
 *         description: No movies found
 *       500:
 *         description: Server error
 */

// Fetch all movies from the database with pagination
router.get('/', async (req, res) => {
    try {
        // Extract page and limit from query parameters
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

        // Calculate the number of items to skip
        const skip = (page - 1) * limit;

        // Fetch movies with pagination
        const movies = await Movie.find().skip(skip).limit(limit);

        // Count the total number of movies for pagination metadata
        const totalMovies = await Movie.countDocuments();

        // If no movies are found, send a response indicating that
        if (movies.length === 0) {
            return res.status(404).json({ message: 'No movies found' });
        }

        // Send paginated results and metadata
        res.status(200).json({
            success: true,
            totalMovies,
            page,
            totalPages: Math.ceil(totalMovies / limit),
            data: movies
        });
    } catch (err) {
        // Catch any errors and send an error message
        res.status(500).json({ message: 'Error fetching movies', error: err.message });
    }
});

/**
 * @swagger
 * /api/moviesCRUD/add:
 *   post:
 *     summary: Add a new movie (Only Admin)
 *     tags: [Movies CRUD (Admin Panel)]
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
 *               - genre
 *               - directors
 *               - actors
 *               - releaseDate
 *               - runtime
 *               - ageRating
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Inception"
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Action", "Sci-Fi"]
 *               directors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["67382c3aa795e2e905c7b857"]
 *               actors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["67382c2ca795e2e905c7b857","67382bfea795e2e905c7b968"]
 *               releaseDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-16"
 *               runtime:
 *                 type: number
 *                 example: 148
 *               synopsis:
 *                 type: string
 *                 example: "A thief who steals corporate secrets through dream-sharing technology..."
 *               posterUrl:
 *                 type: string
 *                 example: "https://example.com/inception-poster.jpg"
 *               ageRating:
 *                 type: string
 *                 example: "PG-13"
 *     responses:
 *       201:
 *         description: Movie added successfully
 *       401:
 *         description: Authorization Token Required
 *       400:
 *         description: Invalid input or missing required fields. directors and actors must exist in person table and should be a valid id
 *       403:
 *         description: Access denied. Admin only
 *       500:
 *         description: Server error OR Movie already exist
 */
// Add a new movie
// router.post('/add', authenticateUser, async (req, res) => {
//     if (req.user.role !== 'admin') {
//         return res.status(403).json({ message: 'Access denied. You are not an admin.' });
//     }

//     const {
//         title, genre, directors, actors, releaseDate, runtime,
//         synopsis, posterUrl, averageRating, trivia, goofs,
//         soundtrack, ageRating, boxOffice, awards
//     } = req.body;

//     // Basic validation for required fields
//     if (!title || !genre || !directors || !releaseDate || !runtime || !actors || !ageRating) {
//         return res.status(400).json({ message: 'Title, genre, director, releaseDate, runtime, actors, and ageRating are required fields' });
//     }

//     try {
//         // Validate if the director exists in the Person collection
//         const directorDocs = await Person.find({ '_id': { $in: directors } });
//         if (directorDocs.length !== directors.length) {
//             return res.status(400).json({ message: 'One or more directors do not exist' });
//         }

//         // Validate if all cast members exist in the Person collection
//         const castDocs = await Person.find({ '_id': { $in: actors } });
//         if (castDocs.length !== actors.length) {
//             return res.status(400).json({ message: 'One or more cast members do not exist' });
//         }


//         // Create a new movie object with required fields and optional fields
//         const newMovie = new Movie({
//             title,
//             genre,
//             directors,  // Director is a reference to the Person model (ObjectId)
//             actors,      // Cast is an array of references to the Person model (Array of ObjectIds)
//             releaseDate,
//             runtime,
//             synopsis,    // Optional
//             posterUrl,   // Optional
//             averageRating,  // Optional
//             trivia,      // Optional
//             goofs,       // Optional
//             soundtrack,  // Optional
//             ageRating,   // Optional
//             boxOffice,   // Optional
//             awards,      // Optional
//         });

//         // Save the new movie to the database
//         await newMovie.save();

//         // Update the filmography for each director
//         for (let directorId of directors) {
//             await Person.findByIdAndUpdate(directorId, {
//                 $push: {
//                     filmography: {
//                         movie: newMovie._id,
//                         role: 'Director',
//                         year: new Date(releaseDate).getFullYear()
//                     }
//                 }
//             });
//         }

//         // Update the filmography for each actor
//         for (let actorId of actors) {
//             await Person.findByIdAndUpdate(actorId, {
//                 $push: {
//                     filmography: {
//                         movie: newMovie._id,
//                         role: 'Actor',
//                         year: new Date(releaseDate).getFullYear()
//                     }
//                 }
//             });
//         }

//         // Return success response
//         res.status(201).json({ message: 'Movie added successfully', movie: newMovie });

//     } catch (err) {
//         res.status(500).json({ message: 'Error adding movie', error: err.message });
//     }
// });

router.post('/add', authenticateUser, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. You are not an admin.' });
    }

    const {
        title, genre, directors, actors, releaseDate, runtime,
        synopsis, posterUrl, averageRating, trivia, goofs,
        soundtrack, ageRating, boxOffice, awards, countryOfOrigin, language
    } = req.body;

    // Basic validation for required fields
    if (!title || !genre || !directors || !releaseDate || !runtime || !actors || !ageRating || !countryOfOrigin || !language) {
        return res.status(400).json({ message: 'Title, genre, director, releaseDate, runtime, actors, ageRating, countryOfOrigin, and language are required fields' });
    }

    try {
        // Validate if the director exists in the Person collection
        const directorDocs = await Person.find({ '_id': { $in: directors } });
        if (directorDocs.length !== directors.length) {
            return res.status(400).json({ message: 'One or more directors do not exist' });
        }

        // Validate if all cast members exist in the Person collection
        const castDocs = await Person.find({ '_id': { $in: actors } });
        if (castDocs.length !== actors.length) {
            return res.status(400).json({ message: 'One or more cast members do not exist' });
        }

        // Create a new movie object with required fields and optional fields
        const newMovie = new Movie({
            title,
            genre,
            directors,  // Director is a reference to the Person model (ObjectId)
            actors,      // Cast is an array of references to the Person model (Array of ObjectIds)
            releaseDate,
            runtime,
            synopsis,    // Optional
            posterUrl,   // Optional
            averageRating,  // Optional
            trivia,      // Optional
            goofs,       // Optional
            soundtrack,  // Optional
            ageRating,   // Optional
            boxOffice,   // Optional
            awards,      // Optional
            countryOfOrigin, // New field for country of origin
            language,    // New field for language
        });

        // Save the new movie to the database
        await newMovie.save();

        // Update the filmography for each director
        for (let directorId of directors) {
            await Person.findByIdAndUpdate(directorId, {
                $push: {
                    filmography: {
                        movie: newMovie._id,
                        role: 'Director',
                        year: new Date(releaseDate).getFullYear()
                    }
                }
            });
        }

        // Update the filmography for each actor
        for (let actorId of actors) {
            await Person.findByIdAndUpdate(actorId, {
                $push: {
                    filmography: {
                        movie: newMovie._id,
                        role: 'Actor',
                        year: new Date(releaseDate).getFullYear()
                    }
                }
            });
        }

        // Return success response
        res.status(201).json({ message: 'Movie added successfully', movie: newMovie });

    } catch (err) {
        res.status(500).json({ message: 'Error adding movie', error: err.message });
    }
});


/**
 * @swagger
 * /api/moviesCRUD/{id}:
 *   put:
 *     summary: Update a movie by ID (any valid field can be updated)
 *     tags: [Movies CRUD (Admin Panel)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID (Must exist in movies and is valid)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               directors:
 *                 type: array
 *                 items:
 *                   type: string
 *               actors:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Movie updated successfully
 *       400:
 *         description: Invalid input or invalid field name.
 *       403:
 *         description: Access denied. Admin only
 *       404:
 *         description: Movie not found
 *       500:
 *         description: Server error
 */
//Update a movie based on id
router.put('/:id', authenticateUser, async (req, res) => {
    // Check if the user is an admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. You are not an admin.' });
    }

    const { id } = req.params;

    // Ensure the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid movie ID' });
    }

    const updateFields = req.body;

    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ message: 'No fields provided to update' });
    }

    // Ensure directors is either an array or a single ID, if it's missing, make it an empty array
    let directors = updateFields.directors || [];
    if (!Array.isArray(directors)) {
        directors = [directors]; // Wrap single director ID into an array
    }

    // Ensure all director IDs are valid ObjectId's
    const isValidDirector = directors.every(directorId => mongoose.Types.ObjectId.isValid(directorId));
    if (!isValidDirector) {
        return res.status(400).json({ message: 'One or more director IDs are invalid' });
    }

    // Ensure actors is either an array or a single ID, if it's missing, make it an empty array
    let actors = updateFields.actors || [];
    if (!Array.isArray(actors)) {
        actors = [actors]; // Wrap single actor ID into an array if it's not an array
    }

    // Ensure all actor IDs are valid ObjectId's
    const isValidActor = actors.every(actorId => mongoose.Types.ObjectId.isValid(actorId));
    if (!isValidActor) {
        return res.status(400).json({ message: 'One or more actor IDs are invalid' });
    }

    // Validate if the director exists in the Person collection
    try {
        if (directors.length > 0) {
            const directorDocs = await Person.find({ '_id': { $in: directors } });
            console.log('Found Directors:', directorDocs);  // Debugging line to check the result

            // If the number of found directors doesn't match the length of the given IDs, report an error
            if (directorDocs.length !== directors.length) {
                return res.status(400).json({ message: 'One or more directors do not exist' });
            }
        }

        // Validate if the actors exist in the Person collection
        if (actors.length > 0) {
            const actorDocs = await Person.find({ '_id': { $in: actors } });
            console.log('Found Actors:', actorDocs);  // Debugging line to check the result

            // If the number of found actors doesn't match the length of the given IDs, report an error
            if (actorDocs.length !== actors.length) {
                return res.status(400).json({ message: 'One or more actors do not exist' });
            }
        }

        // Fetch the current movie document
        const movie = await Movie.findById(id);
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // Check for duplicates in the directors or actors
        const existingDirectors = movie.directors || [];
        const existingActors = movie.actors || [];

        const duplicateDirectors = directors.filter(director => existingDirectors.includes(director));
        const duplicateActors = actors.filter(actor => existingActors.includes(actor));

        if (duplicateDirectors.length > 0) {
            return res.status(400).json({ message: `The following directors are already added: ${duplicateDirectors.join(', ')}` });
        }

        if (duplicateActors.length > 0) {
            return res.status(400).json({ message: `The following actors are already added: ${duplicateActors.join(', ')}` });
        }

        // Proceed with the update logic
        const pushFields = ['awards', 'genre', 'actors', 'directors', 'crew', 'trivia', 'goofs', 'soundtrack'];
        const pushUpdates = {};
        const setUpdates = {};

        for (let key in updateFields) {
            if (updateFields[key]) {
                if (pushFields.includes(key)) {
                    pushUpdates[key] = { $each: Array.isArray(updateFields[key]) ? updateFields[key] : [updateFields[key]] };
                } else {
                    setUpdates[key] = updateFields[key];
                }
            }
        }

        const updateObject = {};
        if (Object.keys(pushUpdates).length > 0) {
            updateObject.$push = pushUpdates;
        }
        if (Object.keys(setUpdates).length > 0) {
            updateObject.$set = setUpdates;
        }

        const updatedMovie = await Movie.findByIdAndUpdate(id, updateObject, { new: true });

        if (!updatedMovie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // Update filmography for directors
        if (directors.length > 0) {
            for (let directorId of directors) {
                await Person.findByIdAndUpdate(directorId, {
                    $push: {
                        filmography: {
                            movie: updatedMovie._id,
                            role: 'Director',
                            year: new Date(updatedMovie.releaseDate).getFullYear()
                        }
                    }
                });
            }
        }

        // Update filmography for actors
        if (actors.length > 0) {
            for (let actorId of actors) {
                await Person.findByIdAndUpdate(actorId, {
                    $push: {
                        filmography: {
                            movie: updatedMovie._id,
                            role: 'Actor',
                            year: new Date(updatedMovie.releaseDate).getFullYear()
                        }
                    }
                });
            }
        }

        res.status(200).json({ message: 'Movie updated successfully', movie: updatedMovie });

    } catch (err) {
        res.status(500).json({ message: 'Error updating movie', error: err.message });
    }
});

/**
 * @swagger
 * /api/moviesCRUD/{id}:
 *   delete:
 *     summary: Delete a movie by ID
 *     tags: [Movies CRUD (Admin Panel)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: Movie deleted successfully
 *       400:
 *         description: Invalid movie ID format
 *       403:
 *         description: Access denied. Admin only
 *       404:
 *         description: Movie not found
 *       500:
 *         description: Server error
 */
// Delete movie by ID
router.delete('/:id', authenticateUser, async (req, res) => {
    // Check if the user is an admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. You are not an admin.' });
    }
    const { id } = req.params;

    // Validate the ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid movie ID format' });
    }

    try {
        // Try to find and delete the movie by ID
        const deletedMovie = await Movie.findByIdAndDelete(id);

        // If movie with given ID is not found, return a 404 response
        if (!deletedMovie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // Return success message along with the deleted movie's data
        res.status(200).json({
            message: 'Movie deleted successfully',
            movie: deletedMovie, // You may want to return the deleted movie's details here
        });
    } catch (err) {
        // Handle any errors (e.g., database errors, connection issues, etc.)
        res.status(500).json({
            message: 'Error deleting movie',
            error: err.message,
        });
    }
});


/**
 * @swagger
 * /api/moviesCRUD/addPerson:
 *   post:
 *     summary: Add a new person (actor, director, crew)
 *     tags: [Movies CRUD (Admin Panel)]
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
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Abdul Moiz"
 *               type:
 *                 type: string
 *                 enum: [actor, director, crew]
 *                 example: "actor"
 *               biography:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               awards:
 *                 type: array
 *                 items:
 *                   type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Person created successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Access denied. Admin only
 *       500:
 *         description: Server error
 */
// POST: Add a new person (actor, director, crew)
router.post('/addPerson', authenticateUser, async (req, res) => {
    // Check if the user is an admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. You are not an admin.' });
    }

    const { name, biography, birthDate, awards, photos, type, filmography, socialLinks } = req.body;

    // Validate required fields
    if (!name || !type) {
        return res.status(400).json({ message: 'Name and type are required' });
    }

    // Validate the type (role must be 'actor', 'director', or 'crew')
    if (!['actor', 'director', 'crew'].includes(type)) {
        return res.status(400).json({ message: 'Type must be either actor, director, or crew' });
    }

    // Create the new Person document
    const newPerson = new Person({
        name,
        biography,
        birthDate,
        type,  // Actor, director, or crew
        awards: awards || [],  // Awards is optional, defaults to an empty array if not provided
        photos: photos || [],  // Photos is optional, defaults to an empty array if not provided
        filmography: filmography || [],  // Filmography is optional
        socialLinks: socialLinks || {},  // SocialLinks is optional, defaults to an empty object if not provided
    });

    try {
        await newPerson.save();
        res.status(201).json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully`, person: newPerson });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating person', error: err.message });
    }
});

/**
 * @swagger
 * /api/moviesCRUD/admin/insights:
 *   get:
 *     summary: Get admin insights about movies and engagement
 *     tags: [Movies CRUD (Admin Panel)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: genrePage
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: genreLimit
 *         schema:
 *           type: integer
 *           default: 5
 *       - in: query
 *         name: actorPage
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: actorLimit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Successfully retrieved insights
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 genreTrends:
 *                   type: array
 *                   items:
 *                     type: object
 *                 actorTrends:
 *                   type: array
 *                   items:
 *                     type: object
 *                 dailyEngagement:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Access denied. Admin only
 *       500:
 *         description: Server error
 */
// Route for Admin Insights wiith pagination
router.get('/admin/insights', authenticateUser, async (req, res) => {
    // Check if the user is an admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. You are not an admin.' });
    }

    try {
        // Extract page and limit from query parameters for genreTrends
        const genrePage = parseInt(req.query.genrePage) || 1;
        const genreLimit = parseInt(req.query.genreLimit) || 5;
        const genreSkip = (genrePage - 1) * genreLimit;

        // Extract page and limit for actorTrends
        const actorPage = parseInt(req.query.actorPage) || 1;
        const actorLimit = parseInt(req.query.actorLimit) || 5;
        const actorSkip = (actorPage - 1) * actorLimit;

        // Trending Genres: Count movies by genre and sort by most popular with pagination
        const genreTrends = await Movie.aggregate([
            { $unwind: "$genre" },
            { $group: { _id: "$genre", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $skip: genreSkip },
            { $limit: genreLimit }
        ]);

        // Most Searched Actors: Count discussions related to each actor with pagination
        const actorTrends = await Discussion.aggregate([
            { $match: { category: "Actors" } },
            { $group: { _id: "$relatedActor", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $skip: actorSkip },
            { $limit: actorLimit }
        ]);

        // User Engagement Patterns (no pagination added here as it's usually daily grouped data)
        const dailyEngagement = await Discussion.aggregate([
            {
                $project: {
                    createdAt: 1,
                    commentsCount: { $cond: { if: { $isArray: "$comments" }, then: { $size: "$comments" }, else: 0 } }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    discussions: { $sum: 1 },
                    comments: { $sum: "$commentsCount" }
                }
            },
            { $sort: { _id: 1 } } // Sort by date
        ]);

        res.status(200).json({
            success: true,
            genreTrends,
            genrePage,
            actorTrends,
            actorPage,
            dailyEngagement
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching insights', error: error.message });
    }
});













module.exports = router;
