import "../config/environment.js";
import express from "express";
import NgoController from "../controllers/ngo.controller.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { default as jwtVerifyWebNgo } from "../middlewares/jwtVerifyWebNgo.js";
import User from "../databases/models/User.js";
import AdminController from "../controllers/admin.controller.js";
import { doubleCsrfProtection } from "../middlewares/csrf.js";

const router = express.Router();

// Set up multer storage for NGO certificates
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/ngo_certificates";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Use original file name with timestamp to avoid conflicts
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage: storage });

/**
 * @swagger
 * /api/front-web/ngo/register-ngo:
 *   post:
 *     summary: Register a new NGO
 *     tags:
 *       - NGO Non authenticated routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the NGO
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password
 *               numberOfUser:
 *                 type: integer
 *                 description: Number of users
 *               certificate:
 *                 type: string
 *                 format: binary
 *                 description: Certificate file upload
 *     responses:
 *       200:
 *         description: NGO registered successfully
 *       400:
 *         description: Invalid input
 */
router.post("/register-ngo", upload.single("certificate"), doubleCsrfProtection, async (req, res) => {
  // Attach file info to payload if file is uploaded
  const payload = { ...req.params, ...req.query, ...req.body };
  if (req.file) {
    payload.certificateFile = req.file.path;
  }
  const response = await NgoController.registerNgo({
    payload,
    headers: req.headers,
  });
  res.return(response);
});

/**
 * @swagger
 * /api/front-web/ngo/login-ngo:
 *   post:
 *     summary: NGO login
 *     tags:
 *       - NGO Non authenticated routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: NGO email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: NGO password
 *     responses:
 *       200:
 *         description: NGO login successful
 *       400:
 *         description: Invalid credentials
 */
router.post("/login-ngo", async (req, res) => {
  const response = await NgoController.ngoLogin({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
  });
  res.return(response);
});

const kycUploadDir = path.join(process.cwd(), "uploads", "kyc");
if (!fs.existsSync(kycUploadDir)) {
  fs.mkdirSync(kycUploadDir, { recursive: true });
}

const storageKyc = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, kycUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const uploadKyc = multer({
  storage: storageKyc,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB per file
});
/**
 * @swagger
 * /api/auth-web/ngo/ngo-create-user:
 *   post:
 *     summary: Submit KYC details and documents
 *     tags:
 *       -  NGO authenticated routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Full Name
 *                 default: "John Michael Doe"
 *               phoneNumber:
 *                 type: string
 *                 description: Phone Number
 *                 default: "+1234567890"
 *               emailAddress:
 *                 type: string
 *                 format: email
 *                 description: Email Address
 *                 default: "john.doe@email.com"
 *               residentialAddress:
 *                 type: string
 *                 description: Residential Address
 *                 default: "123 Oak Street, New York, NY 10001"
 *               documentType:
 *                 type: string
 *                 description: Selected document type (Utility Bill, National ID, Driver's License, Int'l Passport)
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Supporting document file
 *     responses:
 *       200:
 *         description: KYC documents submitted successfully
 */
router.post(
  "/ngo-create-user", jwtVerifyWebNgo,
  (req, res, next) => {
    uploadKyc.single("document")(req, res, function (err) {
      if (err && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          status: 400,
          error: { message: "Document must be less than 2 MB." },
        });
      } else if (err) {
        return res.status(400).json({
          status: 400,
          error: { message: err.message },
        });
      }
      next();
    });
  },
  async (req, res) => {
    const response = await NgoController.registerUserForNgo({
      file: req.file,
      payload: { ...req.params, ...req.query, ...req.body },
      headers: req.headers,
      user: req.user,
    });
    res.return(response);
  },
);

/**
 * @swagger
 * /api/auth-web/ngo/user-list-for-ngo:
 *   get:
 *     summary: Get list of users for NGO
 *     tags:
 *       - NGO authenticated routes
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page (default 10)
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: List of users for NGO
 *       400:
 *         description: Invalid query parameters
 */
router.get("/user-list-for-ngo", jwtVerifyWebNgo, async (req, res) => {
    const response = await NgoController.listUsersForNgo({
      payload: { ...req.params, ...req.query, ...req.body },
      headers: req.headers,
      user: req.user,
    });
    res.return(response);
});
export default router;
