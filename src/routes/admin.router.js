import "../config/environment.js";
import express from "express";
import AdminController from "../controllers/admin.controller.js";
import { default as jwtVerifyWebAdmin } from "../middlewares/jwtVerifyWebAdmin.js";
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
 *         application/json:
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
      cb(null, "uploads/apks/");
   // Ensure the uploads/apks directory exists
   const uploadDir = "uploads/apks";
   if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
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

export default router;

