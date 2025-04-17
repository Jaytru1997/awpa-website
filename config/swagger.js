// src/config/swagger.js
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "AWPA API Documentation",
    version: "1.0.0",
    description: "API documentation for the Angel Wings Power Assembly website",
  },
  servers: [
    {
      url:
        process.env.NODE_ENV === "production"
          ? "https://api.angelwingspowerassembly.org/"
          : `http://localhost:${process.env.PORT}/`, // Updated based on application environment
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./routes/*.js"], // Paths to your route files
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerSpec, swaggerUi };
