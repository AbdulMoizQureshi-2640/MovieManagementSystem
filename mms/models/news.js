const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true }, // Title of the news article
    description: { type: String, required: true }, // Brief description or summary
    content: { type: String, required: true }, // Full content of the article
    category: {
        type: String,
        enum: ['Movies', 'Actors', 'Projects', 'Industry', 'Drama'], // Predefined categories
        required: true,
    },
    publishedDate: { type: Date, default: Date.now }, // Date of publication
    relatedMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }], // Related movies (optional)
    relatedActors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }], // Related actors (optional)
});

const News = mongoose.model('News', newsSchema);
module.exports = News;
