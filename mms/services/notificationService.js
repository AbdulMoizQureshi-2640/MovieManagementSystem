const User = require('../models/User');
const Movie = require('../models/Movie');
const Person = require('../models/person'); // Adjust the path accordingly
const { sendEmail } = require('../utils/emailService');

class NotificationService {

    static async checkUpcomingMovies() {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        // Fetch movies that will be released in the next month
        const upcomingMovies = await Movie.find({
            releaseDate: {
                $gte: new Date(),    // Movies being released today or later
                $lte: nextMonth      // Movies being released within the next month
            }
        }).populate('actors');  // Populate actors data for filtering

        // Find all users who have reminders for new releases or notifications enabled
        const users = await User.find({
            $or: [
                { remindersForNewReleases: true },
                { sendNotifications: true }
            ]
        }).populate('profile.favoriteActors');  // Populate favorite actors for filtering

        console.log("yahan tak ho raha ha");

        // Iterate over each user to send notifications
        for (const user of users) {
            // Skip admin users
            if (user.type === 'admin') {
                continue;
            }

            // Filter relevant movies for this user based on favorite genres or actors
            const relevantMovies = upcomingMovies.filter(movie =>
                movie.genre.some(g => user.profile.favoriteGenres.includes(g)) ||
                movie.actors.some(actor =>
                    user.profile.favoriteActors.some(favActor =>
                        favActor._id.toString() === actor._id.toString()
                    )
                )
            );

            // If there are relevant movies, send notification
            if (relevantMovies.length > 0) {
                await this.sendNotification(user, relevantMovies);
            }
        }
    }
    /*
        static async sendNotification(user, movies) {
            // Build the email content for each relevant movie
            const moviesList = movies.map(movie => `
          <div>
            <h3>${movie.title}</h3>
            <p>Release Date: ${movie.releaseDate.toLocaleDateString()}</p>
            <p>${movie.description}</p>
            ${movie.trailerUrl ? `<p>Watch trailer: <a href="${movie.trailerUrl}">here</a></p>` : ''}
          </div>
        `).join('<hr>');
    
            const emailContent = `
          <h2>Upcoming Movies You Might Like</h2>
          <p>Hello ${user.username},</p>
          <p>Here are some upcoming movies based on your preferences:</p>
          ${moviesList}
          <p>Best regards,<br>AMQ Movie Team</p>
        `;
    
            // Send email if notifications are enabled for the user
            if (user.sendNotifications && user.email) {
                await sendEmail(
                    user.email,
                    'Upcoming Movies Notification',
                    emailContent
                );
            }
        }*/
    static async sendNotification(user, movies) {
        // Build the email content for each relevant movie
        const moviesList = movies.map(movie => {
            // Get the actor names
            const actors = movie.actors.map(actor => actor.name).join(', ') || 'Unknown';

            // Build the movie details with relevant information
            return `
              <div>
                <h3>${movie.title}</h3>
                <p><strong>Release Date:</strong> ${movie.releaseDate.toLocaleDateString()}</p>
                <p><strong>Synopsis:</strong> ${movie.synopsis || 'No synopsis available'}</p>
                <p><strong>Actors:</strong> ${actors}</p>
                ${movie.soundtracks && movie.soundtracks.length > 0 ? `
                  <p><strong>Soundtracks:</strong> ${movie.soundtracks.join(', ')}</p>` : ''}
              </div>
            `;
        }).join('<hr>');

        const emailContent = `
              <h2>Upcoming Movies You Might Like</h2>
              <p>Hello ${user.username},</p>
              <p>Here are some upcoming movies based on your preferences:</p>
              ${moviesList}
              <p>Best regards,<br>AMQ Movie Team</p>
            `;

        // Send email if notifications are enabled for the user
        if (user.sendNotifications && user.email) {
            await sendEmail(
                user.email,
                'Upcoming Movies Notification',
                emailContent
            );
        }
    }
}

module.exports = NotificationService;
