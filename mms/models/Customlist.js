const mongoose = require('mongoose');

const customListSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Foreign key to User
    name: { type: String, required: true },  // List name
    description: { type: String, default: '' },
    movies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],  // Movies in the list
    createdAt: { type: Date, default: Date.now },
});

const CustomList = mongoose.model('CustomList', customListSchema);
module.exports = CustomList;