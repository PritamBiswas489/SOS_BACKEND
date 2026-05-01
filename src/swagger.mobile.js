import swaggerJsdoc from "swagger-jsdoc";
import "./config/environment.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Koby tech silent guard API (Mobile)",
      version: "1.0.0",
      description: "API docs with Swagger for travel wallet",
    },
    tags: [
      {
          name: "User authentication routes",
          description: "Endpoints for user authentication management",
      },
      {
          name: "User authenticated routes",
          description: "Endpoints for user authenticated management",
      },
      {
          name: "Add trusted contact routes",
          description: "Endpoints for managing trusted contacts",
      },
      {
          name: "Chat with trusted contact routes",
          description: "Endpoints for managing chat with trusted contacts",
      },
       {
          name: "Push notification services routes",
          description: "Endpoints for managing push notifications",
      },
      {
        name: "Crash report routes",
        description: "Endpoints for managing crash reports",
      },
      {
        name: "Redis testing routes",
        description: "Endpoints for Redis cache management",
      },
      {
        name: "SOS routes",
        description: "Endpoints for SOS session management",
      },
       {
        name: "Health routes",
        description: "Endpoints for health session management",
      },
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
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  //   apis: ['./routes/*.js'],
  apis: ["./src/app.js", "./src/routes/mobile_routers/*.js"],
};

export const swaggerSpecMobile = swaggerJsdoc(options);
