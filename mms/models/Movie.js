

const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    genre: [{ type: String }],
    actors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true }],
    directors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true }],
    crew: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }], // Crew is optional
    releaseDate: { type: Date },
    runtime: { type: Number, min: 0 },  // Runtime in minutes
    synopsis: { type: String },
    posterUrl: { type: String },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    trivia: [{ type: String }],
    goofs: [{ type: String }],
    soundtrack: [{ type: String }],
    ageRating: {
        type: String,
        enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', 'Unrated'],
    },
    boxOffice: {
        openingWeekend: { type: Number, min: 0 },
        totalGross: { type: Number, min: 0 },
        internationalRevenue: { type: Number, min: 0 },
    },
    awards: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    countryOfOrigin: { type: String },  // Country of origin
    language: { type: String },  // Language
}, { timestamps: true });




const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;
