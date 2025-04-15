
const mongoose = require('mongoose');

const reviewAndRatingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Foreign key to User
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },  // Foreign key to Movie
    rating: { type: Number, required: true, min: 1, max: 5 },  // Rating from 1 to 5
    reviewText: { type: String, required: true },  // Review text
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Middleware to update the 'updatedAt' field when the review is updated
reviewAndRatingSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updatedAt: Date.now() });
    next();
});

// Middleware to update the movie's average rating based on all reviews
reviewAndRatingSchema.post('save', async function () {
    const movie = await mongoose.model('Movie').findById(this.movie);
    const reviews = await mongoose.model('ReviewAndRating').find({ movie: this.movie });

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    // Update the movie's average rating
    movie.averageRating = averageRating;
    await movie.save();
});

const ReviewAndRating = mongoose.model('ReviewAndRating', reviewAndRatingSchema);
module.exports = ReviewAndRating;

