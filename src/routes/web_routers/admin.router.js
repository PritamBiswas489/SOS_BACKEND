import "../../config/environment.js";
import express from "express";
import AdminController from "../../controllers/admin.controller.js";
import { default as jwtVerifyWebAdmin } from "../../middlewares/jwtVerifyWebAdmin.js";
import multer from "multer";
import path from "path";
import fs from "fs";
const router = express.Router();

/**
 * @swagger
 * /api/front-web/admin/register-admin-user:
 *   post:
 *     summary: Register a new admin user
 *     tags:
 *       - Admin Non authenticated routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Admin name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin email address
 *               phone:
 *                 type: string
 *                 description: Admin phone number
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Admin password
 *     responses:
 *       200:
 *         description: Admin user registered successfully
 *       400:
 *         description: Invalid input
 */
router.post("/register-admin-user", async (req, res) => {
    const response = await AdminController.registerAdminUser({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});


/**
 * @swagger
 * /api/front-web/admin/login-admin-user:
 *   post:
 *     summary: Admin user login
 *     tags:
 *       - Admin Non authenticated routes
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
 *                 description: Admin email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Admin password
 *     responses:
 *       200:
 *         description: Admin login successful
 *       400:
 *         description: Invalid credentials
 */
router.post("/login-admin-user",  async (req, res) => {
    const response = await AdminController.loginAdminUser({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});



/**
 * @swagger
 * /api/auth-web/admin/ngo-autocomplete-by-name:
 *   get:
 *     summary: Autocomplete NGOs by name
 *     tags:
 *       - Admin authenticated routes
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: NGO name to autocomplete
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: List of matching NGOs
 *       400:
 *         description: Invalid query parameters
 */
router.get("/ngo-autocomplete-by-name", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.getNgoAutocompleteByName({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});



/**
 * @swagger
 * /api/auth-web/admin/ngo-list:
 *   get:
 *     summary: Get list of NGOs
 *     tags:
 *       - Admin authenticated routes
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [verified, unverified]
 *         description: Filter NGOs by status
 *       - in: query
 *         name: ngo_id
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filter by specific NGO ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of results per page  
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number  
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: List of NGOs
 *       400:
 *         description: Invalid query parameters
 */
router.get("/ngo-list", jwtVerifyWebAdmin, async (req, res) => {
    const response = await AdminController.listNgo({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});
/**
 * @swagger
 * /api/auth-web/admin/ngo-details:
 *   get:
 *     summary: Get NGO details
 *     tags:
 *       - Admin authenticated routes
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: NGO ID
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: NGO details
 *       400:
 *         description: Invalid query parameters
 */
router.get("/ngo-details", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.getNgoDetails({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});

/**
 * @swagger
 * /api/auth-web/admin/verify-ngo:
 *   post:
 *     summary: Verify an NGO
 *     tags:
 *       - Admin authenticated routes
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: NGO ID to verify
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: NGO verified successfully
 *       400:
 *         description: Invalid input or verification failed
 */
router.post("/verify-ngo", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.verifyNgo({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});

/**
 * @swagger
 * /api/auth-web/admin/reject-ngo:
 *   post:
 *     summary: Reject an NGO
 *     tags:
 *       - Admin authenticated routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: NGO ID to reject
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: NGO rejected successfully
 *       400:
 *         description: Invalid input or rejection failed
 */
router.post("/reject-ngo", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.rejectNgo({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});

/**
 * @swagger
 * /api/auth-web/admin/change-status:
 *   post:
 *     summary: Change NGO status
 *     tags:
 *       - Admin authenticated routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: NGO ID to change status
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: New status for the NGO
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: NGO status changed successfully
 *       400:
 *         description: Invalid input or status change failed
 */
router.post("/change-status", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.changeNgoStatus({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});

/**
 * @swagger
 * /api/auth-web/admin/ngo-upgrade-user-limit:
 *   post:
 *     summary: Upgrade the user limit for an NGO
 *     tags:
 *       - Admin authenticated routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: NGO ID to upgrade
 *               additional_limit:
 *                 type: integer
 *                 description: Additional user limit for the NGO
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: NGO user limit upgraded successfully
 *       400:
 *         description: Invalid input or upgrade failed
 */
router.post("/ngo-upgrade-user-limit", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.upgradeNgoUserLimit({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});


// Multer storage configuration
const storage = multer.diskStorage({
   destination: function (req, file, cb) {
      // Ensure the uploads/apks directory exists and return destination once.
      const uploadDir = "uploads/apks";
      if (!fs.existsSync(uploadDir)) {
         fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
      }
      cb(null, uploadDir);
   },
   filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
   }
});

// Multer file filter for APK files
const fileFilter = (req, file, cb) => {
   console.log("File MIME type:", file.mimetype);
   if (file.mimetype === "application/vnd.android.package-archive" || file.mimetype === "application/octet-stream") {
      cb(null, true);
   } else {
      cb(new Error("Only APK files are allowed!"), false);
   }
};


const upload = multer({ storage, fileFilter });


/**
 * @swagger
 * /api/auth-web/admin/upload-apk:
 *   post:
 *     summary: Upload an Android APK file
 *     tags:
 *       - Admin authenticated routes
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               apkFile:
 *                 type: string
 *                 format: binary
 *                 description: The APK file to upload
 *               version:
 *                 type: string
 *                 description: Version of the APK being uploaded
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: APK uploaded successfully
 *       400:
 *         description: No APK file uploaded or invalid file type
 */
router.post("/upload-apk", jwtVerifyWebAdmin, upload.single("apkFile"), async (req, res) => {
   if (!req.file) {
      return res.status(400).json({ message: "No APK file uploaded." });
   }
   const response = await AdminController.uploadAndroidApp({
      payload: { ...req.params, ...req.query, ...req.body, apkFile: req.file },
      headers: req.headers
   });
   res.return(response);
});


/**
 * @swagger
 * /api/auth-web/admin/apk-releases:
 *   get:
 *     summary: Get list of Android APK releases
 *     tags:
 *       - Admin authenticated routes
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
 *         description: List of APK releases
 *       400:
 *         description: Invalid query parameters
 */
router.get("/apk-releases", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.getApkReleases({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});


/**
 * @swagger
 * /api/auth-web/admin/user-list:
 *   get:
 *     summary: Get list of users
 *     tags:
 *       - Admin authenticated routes
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
 *         name: ngo_id
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filter users by NGO ID
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: List of users
 *       400:
 *         description: Invalid query parameters
 */
router.get("/user-list", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.listUsers({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});
   

/**
 * @swagger
 * /api/auth-web/admin/change-user-status:
 *   post:
 *     summary: Change user status
 *     tags:
 *       - Admin authenticated routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: User ID to change status
 *               status:
 *                 type: string
 *                 enum: ["active", "inactive"]
 *                 description: New status for the user
 *             required:
 *               - id
 *               - status
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: User status changed successfully
 *       400:
 *         description: Invalid input or status change failed
 */
router.post("/change-user-status", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.changeUserStatus({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});


/**
 * @swagger
 * /api/auth-web/admin/pending-kyc-documents:
 *   get:
 *     summary: Get list of pending KYC documents
 *     tags:
 *       - Admin authenticated routes
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
 *         description: List of  pending KYC documents
 *       400:
 *         description: Invalid query parameters
 */
router.get("/pending-kyc-documents", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.getPendingKycDocuments({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});


/**
 * @swagger
 * /api/auth-web/admin/change-kyc-document-status:
 *   post:
 *     summary: Change KYC document status
 *     tags:
 *       - Admin authenticated routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: KYC document ID to change status
 *               status:
 *                 type: string
 *                 enum: [approved, cancelled]
 *                 description: New status for the KYC document
 *             required:
 *               - id
 *               - status
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: KYC document status changed successfully
 *       400:
 *         description: Invalid input or status change failed
 */
router.post("/change-kyc-document-status", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.changeKycDocumentStatus({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});

/**
 * @swagger
 * /api/auth-web/admin/all-sos-list:
 *   get:
 *     summary: Get SOS sessions for all NGOs
 *     tags:
 *       - Admin authenticated routes
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
 *         name: ngo_id
 *         schema:
 *           type: integer
 *         description: Filter SOS sessions by NGO ID
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
router.get("/all-sos-list", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.listSos({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});

/**
 * @swagger
 * /api/auth-web/admin/app-feedback-list:
 *   get:
 *     summary: Get app feedback list
 *     tags:
 *       - Admin authenticated routes
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
 *           enum: [new, reviewed, resolved, ignored]
 *         description: Filter feedback by status
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter feedback by user ID
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-07-01"
 *         description: Filter feedback created on or after this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-07-31"
 *         description: Filter feedback created on or before this date
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: App feedback list retrieved successfully
 *       400:
 *         description: Failed to retrieve app feedback list
 */

router.get("/app-feedback-list", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.listAppFeedback({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});

/**
 * @swagger
 * /api/auth-web/admin/reply-email-app-feedback:
 *   post:
 *     summary: Reply to app feedback by email
 *     tags:
 *       - Admin authenticated routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               feedback_id:
 *                 type: integer
 *                 description: App feedback ID to reply to
 *               message:
 *                 type: string
 *                 description: Reply message sent to the user
 *             required:
 *               - feedback_id
 *               - message
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Reply email sent successfully
 *       400:
 *         description: Failed to send reply email
 */
router.post('/reply-email-app-feedback', jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.replyAppFeedback({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});

/**
 * @swagger
 * /api/auth-web/admin/update-app-feedback-status:
 *   post:
 *     summary: Update app feedback status
 *     tags:
 *       - Admin authenticated routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               feedback_id:
 *                 type: integer
 *                 description: App feedback ID to update
 *               status:
 *                 type: string
 *                 enum: [new, reviewed, resolved, ignored]
 *                 description: New status for the app feedback
 *             required:
 *               - feedback_id
 *               - status
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: App feedback status updated successfully
 *       400:
 *         description: Failed to update app feedback status
 */
router.post('/update-app-feedback-status', jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.updateAppFeedbackStatus({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});


/**
 * @swagger
 * /api/auth-web/admin/request-ios-access-list:
 *   get:
 *     summary: Get iOS access requests
 *     tags:
 *       - Admin authenticated routes
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter requests by user ID
 *       - in: query
 *         name: mobileNumber
 *         schema:
 *           type: string
 *         description: Filter requests by user mobile number (partial match)
 *       - in: query
 *         name: testFlightEmail
 *         schema:
 *           type: string
 *           format: email
 *         description: Filter requests by TestFlight email (partial match)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, added, failed]
 *         description: Filter requests by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: iOS access requests retrieved successfully
 *       400:
 *         description: Failed to retrieve iOS access requests
 */


router.get("/request-ios-access-list", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.listRequestIosAccess({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});


/**
 * @swagger
 * /api/auth-web/admin/request-ios-access-status-change:
 *   post:
 *     summary: Change iOS access request status
 *     tags:
 *       - Admin authenticated routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: iOS access request ID
 *               status:
 *                 type: string
 *                 enum: [new, added, failed]
 *                 description: Updated status for the request
 *             required:
 *               - id
 *               - status
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: iOS access request status updated successfully
 *       400:
 *         description: Failed to update iOS access request status
 */

router.post("/request-ios-access-status-change", jwtVerifyWebAdmin,  async (req, res) => {
   const response = await AdminController.changeRequestIosAccessStatus({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});


/**
 * @swagger
 * /api/auth-web/admin/update-email-for-ios-access-request:
 *   post:
 *     summary: Update TestFlight email for an iOS access request
 *     tags:
 *       - Admin authenticated routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: iOS access request ID
 *               testFlightEmail:
 *                 type: string
 *                 format: email
 *                 description: Updated TestFlight email for the request
 *             required:
 *               - id
 *               - testFlightEmail
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: iOS access request email updated successfully
 *       400:
 *         description: Failed to update iOS access request email
 */

router.post("/update-email-for-ios-access-request", jwtVerifyWebAdmin,  async (req, res) => {
   const response = await AdminController.updateEmailForIosAccessRequest({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});

/**
 * @swagger
 * /api/auth-web/admin/reply-email-request-ios-access:
 *   post:
 *     summary: Reply to iOS access request by email
 *     tags:
 *       - Admin authenticated routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               request_id:
 *                 type: integer
 *                 description: iOS access request ID
 *               message:
 *                 type: string
 *                 description: Reply message sent to the user
 *             required:
 *               - request_id
 *               - message
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: iOS access reply email sent successfully
 *       400:
 *         description: Failed to send iOS access reply email
 */

router.post('/reply-email-request-ios-access', jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.replyRequestIosAccess({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});


/**
 * @swagger
 * /api/auth-web/admin/contact-admin-list:
 *   get:
 *     summary: Get contact admin messages
 *     tags:
 *       - Admin authenticated routes
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter messages by user ID
 *       - in: query
 *         name: mobileNumber
 *         schema:
 *           type: string
 *         description: Filter by user mobile number (partial match)
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-07-01"
 *         description: Filter messages created on or after this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-07-31"
 *         description: Filter messages created on or before this date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Contact admin list retrieved successfully
 *       400:
 *         description: Failed to retrieve contact admin list
 */
router.get("/contact-admin-list", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.listContactAdmin({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});

/**
 * @swagger
 * /api/auth-web/admin/reply-email-contact-admin:
 *   post:
 *     summary: Reply to a contact admin message by email
 *     tags:
 *       - Admin authenticated routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contact_id:
 *                 type: integer
 *                 description: Contact admin message ID
 *               message:
 *                 type: string
 *                 description: Reply message sent to the user
 *             required:
 *               - contact_id
 *               - message
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Contact admin reply email sent successfully
 *       400:
 *         description: Failed to send contact admin reply email
 */
router.post("/reply-email-contact-admin", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.replyContactAdmin({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});


/**
 * @swagger
 * /api/auth-web/admin/emergency-services-location-list:
 *   get:
 *     summary: Get emergency services location list
 *     tags:
 *       - Admin authenticated routes
 *     parameters:
 *       - in: query
 *         name: requestBy
 *         schema:
 *           type: integer
 *         description: Filter by requester user ID
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *         description: Filter by service type (partial match)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved]
 *         description: Filter by service status
 *       - in: query
 *         name: phoneNumber
 *         schema:
 *           type: string
 *         description: Filter by emergency service phone number (partial match)
 *       - in: query
 *         name: placeId
 *         schema:
 *           type: string
 *         description: Filter by placeId (partial match)
 *       - in: query
 *         name: locationName
 *         schema:
 *           type: string
 *         description: Filter by location name (partial match)
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-07-01"
 *         description: Filter records created on or after this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-07-31"
 *         description: Filter records created on or before this date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Emergency services location list fetched successfully
 *       400:
 *         description: Failed to fetch emergency services location list
 */
router.get("/emergency-services-location-list", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.listEmergencyServicesLocation({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});


/**
 * @swagger
 * /api/auth-web/admin/change-emergency-services-location-status:
 *   post:
 *     summary: Change emergency service location status
 *     tags:
 *       - Admin authenticated routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Emergency service location ID
 *               status:
 *                 type: string
 *                 enum: [pending, approved]
 *                 description: Updated status for the emergency service location
 *             required:
 *               - id
 *               - status
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Emergency service location status updated successfully
 *       400:
 *         description: Failed to update emergency service location status
 */
router.post("/change-emergency-services-location-status", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.changeEmergencyServicesLocationStatus({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});


/**
 * @swagger
 * /api/auth-web/admin/get-abouse-report-list:
 *   get:
 *     summary: Get abuse report list with relation details
 *     tags:
 *       - Admin authenticated routes
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by reporting user ID
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Alias of userId
 *       - in: query
 *         name: abuserId
 *         schema:
 *           type: integer
 *         description: Filter by abuser ID
 *       - in: query
 *         name: abuser_id
 *         schema:
 *           type: integer
 *         description: Alias of abuserId
 *       - in: query
 *         name: abuseType
 *         schema:
 *           type: string
 *         description: Filter by abuse type (partial match)
 *       - in: query
 *         name: threatLevel
 *         schema:
 *           type: string
 *           enum: [Low, Medium, High]
 *         description: Filter by threat level
 *       - in: query
 *         name: history_of_violence
 *         schema:
 *           type: boolean
 *         description: Filter by history of violence flag
 *       - in: query
 *         name: weapon_access
 *         schema:
 *           type: boolean
 *         description: Filter by weapon access flag
 *       - in: query
 *         name: restraining_order
 *         schema:
 *           type: boolean
 *         description: Filter by restraining order flag
 *       - in: query
 *         name: userName
 *         schema:
 *           type: string
 *         description: Filter by reporting user name (partial match)
 *       - in: query
 *         name: mobileNumber
 *         schema:
 *           type: string
 *         description: Filter by reporting user mobile number (partial match)
 *       - in: query
 *         name: abuserName
 *         schema:
 *           type: string
 *         description: Filter by abuser full name (partial match)
 *       - in: query
 *         name: abuserPhone
 *         schema:
 *           type: string
 *         description: Filter by abuser phone (partial match)
 *       - in: query
 *         name: abuserEmail
 *         schema:
 *           type: string
 *           format: email
 *         description: Filter by abuser email (partial match)
 *       - in: query
 *         name: incidentFromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter reports where incident_date is on or after this date
 *       - in: query
 *         name: incidentToDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter reports where incident_date is on or before this date
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter reports created on or after this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter reports created on or before this date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Abuse report list fetched successfully
 *       400:
 *         description: Failed to fetch abuse report list
 */
router.get("/get-abouse-report-list", jwtVerifyWebAdmin, async (req, res) => {
   const response = await AdminController.getAbuseReportList({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});

export default router;