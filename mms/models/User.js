const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: {
        nickName: { type: String, default: '' },
        bio: { type: String, default: '' },
        favoriteGenres: [{ type: String }],
        favoriteActors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],  // Wishlist of movie IDs
    customLists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CustomList' }],  // Reference to custom lists
    remindersForNewReleases: { type: Boolean, default: true },  // New Property
    sendNotifications: { type: Boolean, default: true },  // New Property
    createdAt: { type: Date, default: Date.now },
});

// Hash the password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare the provided password with the hashed one
userSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
