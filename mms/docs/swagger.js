// /docs/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Define Swagger options
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Movie Management System API Documentation',
            version: '1.0.0',
            description: 'API Documentation for managing movies in the movie management system'
        },
        servers: [{ url: 'http://localhost:5000' }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',  // Optional but useful for JWT tokens
                },
            },
        },
    },
    apis: ['./routes/*.js'], // Path to your route files for Swagger annotations
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);


module.exports = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};
