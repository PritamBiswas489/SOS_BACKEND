import "./config/environment.js";

import express, { Router, json, urlencoded } from "express";
import compression from "compression";
import cors from "cors";
import { resolve as pathResolve, dirname, join as pathJoin } from "path";
import helmet from "helmet";
import bodyParser from "body-parser";
import * as Sentry from "@sentry/node";
import { Sequelize } from "sequelize";
import { swaggerSpec } from "./swagger.js";
import { swaggerSpecMobile } from "./swagger.mobile.js";
import swaggerUi from "swagger-ui-express";
import { default as apiRouter } from "./routes/web_routers/index.router.js";
import { default as mobileApiRouter } from "./routes/mobile_routers/mobile.index.router.js";
import basicAuth from "express-basic-auth";
import multer from "multer";
import customReturn from "./middlewares/responseBuilder.js";
import locales from "./middlewares/locales.js";
import { initializeSentry } from "./config/sentry.config.js";
// import "./cron/index.js"
import cookieParser from "cookie-parser";
import logger from "./config/winston.js";

import {
  otpWhatsappService,
  otpSmsService,
} from "./services/messages.service.js";
import { constants } from "http2";
import { log } from "console";

const {
  NODE_ENV,
  DB_HOST,
  DB_DATABASE,
  DB_USERNAME,
  DB_PASSWORD,
  DB_PORT,
  SENTRY_DSN,
  SENTRY_ENABLED,
} = process.env;
const publicDir =
  NODE_ENV === "development"
    ? pathResolve(pathJoin(dirname("./"), "public"))
    : pathResolve(pathJoin(dirname("./"), "public"));

const app = express();

app.use((req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    const REQUIRED_NODE_VERSION = "20.19.4"; // Define your required version
    const CURRENT_NODE_VERSION = process.versions.node; // Get current Node.js version

    console.log(" Required node version", REQUIRED_NODE_VERSION);
    console.log(" Current node version", CURRENT_NODE_VERSION);

    // Check if current version meets the requirement
    if (CURRENT_NODE_VERSION !== REQUIRED_NODE_VERSION) {
      console.error(
        `\x1b[31m[ERROR] Node.js version mismatch!\x1b[0m`,
        `\nRequired: ${REQUIRED_NODE_VERSION}+`,
        `\nCurrent: ${CURRENT_NODE_VERSION}`,
      );

      return res.status(503).json({
        error: "Service Unavailable",
        message: `Server is running on an incompatible Node.js version (${CURRENT_NODE_VERSION}). Required version: ${REQUIRED_NODE_VERSION} or higher.`,
        currentVersion: CURRENT_NODE_VERSION,
        requiredVersion: REQUIRED_NODE_VERSION,
      });
    }
    console.log(
      `\x1b[32m[INFO] Node.js version check passed.\x1b[0m Current version: ${CURRENT_NODE_VERSION}`,
    );
  }

  next();
});

if (SENTRY_ENABLED === "true") {
  (async () => {
    await initializeSentry(SENTRY_DSN);
  })();
}
app.use(
  cors({
    origin: [
      "http://localhost:4000",
      "http://localhost:3000", // local
      "https://back-sos.pritamaqua.aqualeafitsol.com", // production
      "https://web-sos.pritamaqua.aqualeafitsol.com",
      "https://sosappproject.com",
      "https://www.sosappproject.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "accesstoken",
      "refreshtoken",
      "x-csrf-token",
    ],
    exposedHeaders: ["accesstoken", "refreshtoken"],
  }),
);
// app.options("*", cors());

app.use(compression());
app.use(helmet());
app.use(locales);
app.use((req, res, next) => {
  const defaultHeaders = {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    accept: "*/*",
    connection: "keep-alive",
    referer: "https://back.travelmoney.co.il/",
    cookie: "cf_clearance=xyz123; session_token=abc456;",
  };

  for (const [key, value] of Object.entries(defaultHeaders)) {
    if (!req.headers[key]) {
      req.headers[key] = value;
    }
  }
  // console.log("Request Headers:", req.headers);
  next();
});
// app.use(trackIpAddressDeviceId);
app.use(customReturn);

app.use(
  ["/api-docs", "/api-mobile-docs", "/swagger"],
  basicAuth({
    users: { admin: "admin" }, // username:password
    challenge: true, // shows browser auth popup
    unauthorizedResponse: (req) => "Unauthorized",
  }),
);

app.use((err, req, res, next) => {
  if (err.status === 403) {
    return res.status(403).json({ status: 403, message: "Invalid CSRF token" });
  }
  next(err);
});

app.use(express.static(publicDir));
 

// Swagger routes
app.use(
  "/api-docs",
  swaggerUi.serveFiles(swaggerSpec, {}),
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      withCredentials: true,
      persistAuthorization: true,
    },
    customJs: "/swagger-restore-api.js",
  })
);

app.use(
  "/api-mobile-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecMobile, {
    swaggerOptions: {
      withCredentials: true,
      persistAuthorization: true,
    },
    customJs: "/swagger-restore-mobile.js",
  })
);

const isProduction = process.env.NODE_ENV === "production";
const sequelize = new Sequelize(DB_DATABASE, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  dialect: "postgres",
  port: DB_PORT,
  dialectOptions: isProduction
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {},
  logging: false,
});

app.use(bodyParser.json({ limit: "500mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "500mb",
    extended: true,
    parameterLimit: 50000,
  }),
);


/**
 * @swagger
 * /test-server:
 *   get:
 *     summary: Test server endpoint
 *     tags: [Testing endpoints]
 *     responses:
 *       200:
 *         description: Server is working
 */
app.get("/test-server", (req, res, next) => {
  res.status(200).send({
    msg: `server working - ${NODE_ENV} mode ON PORT: ${process.env.PORT} BASE URL: ${process.env.BASE_URL}`,
  });
});
/**
 * @swagger
 * /test-database:
 *   get:
 *     summary: Test database endpoint
 *     tags: [Testing endpoints]
 *     responses:
 *       200:
 *         description: Server is working
 */
app.get("/test-database", async (req, res, next) => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    res.status(200).send({ msg: "Database connection successful" });
  } catch (error) {
    logger.error("Unable to connect to the database:", { error });
    console.error("Unable to connect to the database:", error);
    res.status(500).send({ msg: "Database connection failed", error });
  }
});
app.get("/test-error", (req, res) => {
  try {
    throw new Error("Testing winston error logging");
  } catch (e) {
    logger.error("An error occurred in /test-error route", { error: e });
    res.status(500).send({ error: "something went wrong" });
  }
});
/**
 * @swagger
 * /test-otp/{number}/{otp_code}:
 *   get:
 *     summary: Test OTP verification
 *     tags: [Testing endpoints]
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         placeholder: +919830990065
 *         schema:
 *           type: string
 *           example: +919830990065
 *         description: The phone number
 *       - in: path
 *         name: otp_code
 *         required: true
 *         placeholder: 1234
 *         schema:
 *           type: string
 *           example: 1234
 *         description: The OTP code
 *     responses:
 *       200:
 *         description: OTP received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Send successful
 */
app.get("/test-otp/:number/:otp_code", async (req, res) => {
  //add  validation for number and otp_code phone number format +<country_code><number>
  const phoneRegex = /^\+\d{1,3}\d{4,14}$/; // Example regex for international phone numbers
  const otpRegex = /^\d{4}$/; // Example regex for 4-digit OTP codes

  const { number, otp_code } = req.params;
  if (!phoneRegex.test(number)) {
    return res.status(400).json({
      error: "Invalid phone number format. Format: +<country_code><number>",
    });
  }
  if (!otpRegex.test(otp_code)) {
    return res
      .status(400)
      .json({ error: "Invalid OTP code format. Format: 1234" });
  }
  try {
    const [whatsappResult, smsResult] = await Promise.all([
      otpWhatsappService(number, otp_code),
      otpSmsService(number, otp_code),
    ]);
    res.status(200).json({
      whatsapp: whatsappResult,
      sms: smsResult,
    });
  } catch (error) {
    logger.error("Error in OTP verification:", { error });
    console.error("Error in OTP verification:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/test-error2", (req, res) => {
  try {
    NeverFoundFunction();
  } catch (e) {
    SENTRY_ENABLED === "true" && Sentry.captureException(e);
    logger.error("An error occurred in /test-error2 route", { error: e });
    res.status(500).send({ error: "something went wrong" });
  }
});

app.use("/api", apiRouter);
app.use("/api-mobile", mobileApiRouter);
if (SENTRY_ENABLED === "true") {
  (async () => {
    Sentry.setupExpressErrorHandler(app);
  })();
}
app.use("/uploads", express.static("uploads"));

// Multer error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File size should not exceed 2MB." });
    }
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

export default app;
