import "../../config/environment.js";
import express from "express";
import NgoController from "../../controllers/ngo.controller.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { default as jwtVerifyWebNgo } from "../../middlewares/jwtVerifyWebNgo.js";
import User from "../../databases/models/User.js";
import AdminController from "../../controllers/admin.controller.js";
import crypto from "crypto";
import EmergencyServicesController from "../../controllers/emergencyServices.controller.js";
import { contactAdminApiRateLimiter } from "../../middlewares/otpRateLimiter.js";
 
const router = express.Router();

// Set up multer storage for NGO certificates
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/ngo_certificates";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Use original file name with timestamp to avoid conflicts
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const unique = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    cb(null, unique);
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
router.post("/register-ngo", upload.single("certificate"), async (req, res) => {
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
  fs.mkdirSync(kycUploadDir, { recursive: true, mode: 0o755 });
}

const storageKyc = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, kycUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    cb(null, unique);
  },
});

const uploadKyc = multer({
  storage: storageKyc,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, and PDF files are allowed."));
    }
    cb(null, true);
  },
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


/**
 * @swagger
 * /api/auth-web/ngo/ngo-sos-list:
 *   get:
 *     summary: Get SOS sessions for users registered under the logged-in NGO
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, cancelled, resolved]
 *         description: Filter SOS sessions by status
 *       - in: query
 *         name: mobileNumber
 *         schema:
 *           type: string
 *         description: Filter SOS sessions by user mobile number
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-07-01"
 *         description: Filter SOS sessions created on or after this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-07-31"
 *         description: Filter SOS sessions created on or before this date
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: SOS sessions retrieved successfully
 *       400:
 *         description: Failed to retrieve SOS sessions
 */


router.get("/ngo-sos-list", jwtVerifyWebNgo, async (req, res) => {
  const response = await NgoController.listSosForNgo({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});


/**
 * @swagger
 * /api/auth-web/ngo/request-register-new-location:
 *   post:
 *     summary: Request registration of a new emergency service
 *     tags:
 *       - NGO authenticated routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - locationName
 *               - latitude
 *               - longitude
 *               - address
 *               - phoneNumber
 *               - placeId
 *               - serviceType
 *             properties:
 *               locationName:
 *                 type: string
 *                 example: "SSKM Hospital"
 *               latitude:
 *                 type: number
 *                 example: 22.5392
 *               longitude:
 *                 type: number
 *                 example: 88.3426
 *               address:
 *                 type: string
 *                 example: "244 AJC Bose Road, Kolkata, West Bengal"
 *               phoneNumber:
 *                 type: string
 *                 example: "03322041100"
 *               placeId:
 *                 type: string
 *                 example: "kol_hospital_001"
 *               serviceType:
 *                 type: string
 *                 example: "hospital"
 *     responses:
 *       200:
 *         description: Registration request submitted successfully
 *       400:
 *         description: Bad request
 */
router.post('/request-register-new-location', jwtVerifyWebNgo, async (req, res) => {
  const response = await EmergencyServicesController.requestRegisterNewEmergencyService({
    payload: { ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});


/**
 * @swagger
 * /api/auth-web/ngo/get-my-requested-emergency-services:
 *   get:
 *     summary: Get emergency services requested by the logged-in user
 *     tags:
 *       - NGO authenticated routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *         description: Page number for paginated results
 *         example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *         description: Number of records per page
 *         example: 10
 *     responses:
 *       200:
 *         description: User requested emergency services fetched successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

router.get('/get-my-requested-emergency-services', jwtVerifyWebNgo, async (req, res) => {
  const response = await EmergencyServicesController.getMyRequestedEmergencyServices({
    payload: { ...req.query },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});




/**
 * @swagger
 * /api/auth-web/ngo/contact-admin:
 *   post:
 *     summary: Send message to admin
 *     tags:
 *       - NGO authenticated routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Message from user to admin
 *                 example: Please contact me regarding my account issue.
 *             required:
 *               - message
 *     responses:
 *       200:
 *         description: Message sent to admin successfully
 *       400:
 *         description: Failed to send message to admin
 */
router.post('/contact-admin', jwtVerifyWebNgo, contactAdminApiRateLimiter, async (req, res, next) => {
  const response = await AdminController.contactAdmin({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});

 
export default router;
