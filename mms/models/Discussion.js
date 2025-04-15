const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
    title: { type: String, required: true }, // Title of the discussion
    content: { type: String, required: true }, // Initial post content
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to user who started the discussion
    relatedMovie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }, // Optional: Link to a related movie
    category: { type: String, enum: ['General', 'Genres', 'Actors', 'Movies', 'Drama'], required: true }, // Discussion category
    comments: [
        {
            content: { type: String, required: true }, // Comment content
            createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who posted the comment
            createdAt: { type: Date, default: Date.now }, // Timestamp
        },
    ],
    createdAt: { type: Date, default: Date.now }, // Discussion creation time
});

const Discussion = mongoose.model('Discussion', discussionSchema);
module.exports = Discussion;
