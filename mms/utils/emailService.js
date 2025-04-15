const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Get API Key from environment variable

// Email configuration
const sendEmail = async (to, subject, message) => {
    const msg = {
        to, // recipient email address
        from: 'moizq8978@gmail.com', // verified sender email (this must be from a verified domain in SendGrid)
        subject,
        text: message,
        html: `<p>${message}</p>`, // optional, for HTML content
    };

    try {
        // Send email
        await sgMail.send(msg);
        console.log('Email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};


module.exports = { sendEmail };