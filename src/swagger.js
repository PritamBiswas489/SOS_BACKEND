import swaggerJsdoc from "swagger-jsdoc";
import "./config/environment.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Koby tech silent guard API (Web)",
      version: "1.0.0",
      description: "API docs with Swagger for travel wallet",
    },
    tags: [
      {name: "Non authenticated routes", description: "Endpoints that do not require authentication"},
      { name: "Login routes", description: "User login endpoints" },
      { name : "NGO Non authenticated routes", description: "NGO management endpoints" },
      { name: "NGO authenticated routes", description: "NGO management endpoints" },
      { name: "Admin Non authenticated routes", description: "Admin management endpoints" },
      {name:"Admin authenticated routes", description: "Admin management endpoints"},
      { name: "KYC routes", description: "KYC management endpoints" },
      { name: "License routes", description: "License management endpoints" },
      { name: "Redis testing routes", description: "Endpoints for Redis cache management" },
      { name: "Testing endpoints",  description: "Endpoints for testing purposes",  },
    ],
    servers: [
      {
        url: process.env.BASE_URL || "http://localhost:4000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Access token for authentication (in Authorization header)",
        },
        refreshToken: {
          type: "apiKey",
          in: "header",
          name: "refreshtoken",
          description:
            "Refresh token for renewing access (in `refreshtoken` header)",
        },
        csrfToken: {
          type: "apiKey",
          in: "header",
          name: "x-csrf-token",
          description: "CSRF token for protection (in `x-csrf-token` header)",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        csrfToken: [],
      },
    ],
  },
  //   apis: ['./routes/*.js'],
  apis: ["./src/app.js", "./src/routes/web_routers/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
