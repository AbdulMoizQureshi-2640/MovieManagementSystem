require('dotenv').config(); // Load environment variables from .env file
const express = require('express');//importing necessary modules
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const movieCRUDRoutes = require('./routes/moviesCRUD');
const movieRoutes = require('./routes/movies');
const reviewsRoutes = require('./routes/reviews');
const wishlistRoutes = require('./routes/wishlist');
const userProfileRoutes = require('./routes/userprofile');
const customlistRoutes = require('./routes/customlist');
const notificationRoutes = require('./routes/notifications');
const newsRoutes = require('./routes/newsarticle');
const discussionRoutes = require('./routes/discussion');
const recommendationRoutes = require('./routes/recommendation');
const swaggerDocs = require('./docs/swagger');
const cors = require('cors'); // Import the cors package
const app = express();
app.use(express.json());  // Add this line to parse incoming JSON requests


// Enable CORS for all origins
// For specific domain, replace 'http://yourfrontenddomain.com' with your front-end URL
app.use(cors({
    origin: 'http://localhost:5000'  // Example: Allow only requests from your front-end running on localhost:3000
}));

// Database connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('Error connecting to MongoDB', err));

// Routes
app.use('/api/auth', authRoutes); //for user login and signup
app.use('/api/moviesCRUD', movieCRUDRoutes); //for movies CRUD (Admin Panel)..not component
app.use('/api/reviews', reviewsRoutes);//for reviews and rating
app.use('/api/movies', movieRoutes); //for moviees (searching, filtering, top rated, trending, etc...)
app.use('/api/wishlist', wishlistRoutes);// for user wishlists
app.use('/api/customlist', customlistRoutes);// for custom lists
app.use('/api/profile', userProfileRoutes); //profile management
app.use('/api/notifications', notificationRoutes);//pending
app.use('/api/news', newsRoutes);//for news articles
app.use('/api/discussion', discussionRoutes);//discussion
app.use('/api/recommendations', recommendationRoutes);//recommendations of movies

// Swagger documentation
swaggerDocs(app);

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));

