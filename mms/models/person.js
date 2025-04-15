const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['actor', 'director', 'crew'], required: true }, // Role: actor, director, or crew
    biography: { type: String },
    birthDate: { type: Date },
    awards: [{
        awardName: { type: String },
        year: { type: Number },
    }],
    photos: [{ type: String }], // Array of URLs to photos
    filmography: [{
        movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
        role: { type: String }, // e.g., 'Lead Actor', 'Director', etc.
        year: { type: Number }
    }],
    socialLinks: {
        twitter: { type: String },
        instagram: { type: String },
        facebook: { type: String },
        // Other social media links
    },
    createdAt: { type: Date, default: Date.now }
});

const Person = mongoose.model('Person', personSchema);
module.exports = Person;
