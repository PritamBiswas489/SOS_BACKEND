import '../../config/environment.js';
import express from 'express';
import ProfileController from '../../controllers/profile.controller.js';
import { uploadProfileImage } from '../../middlewares/profileImageUpload.js';
const router = express.Router();

/**
 * @swagger
 * /api-mobile/auth/user/profile/details:
 *   get:
 *     summary: Get user profile details
 *     tags: 
 *       - User authenticated routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: User profile details retrieved successfully
 */
router.get("/details", async (req, res) => {
    const response = await ProfileController.getAppUserProfile({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
      });
      res.return(response);
});



/**
 * @swagger
 * /api-mobile/auth/user/profile/save-device-token:
 *   post:
 *     summary: Save device token for push notifications
 *     tags:
 *       - User authenticated routes
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
 *               device_token:
 *                 type: string
 *                 description: Device token for push notifications
 *                 example: "abcdef123456"
 *               device_type:
 *                 type: string
 *                 description: Type of device
 *                 enum: ["android", "ios", "web"]
 *                 example: "android"
 *     responses:
 *       200:
 *         description: Device token saved successfully
 */
router.post("/save-device-token", async (req, res) => {
    const response = await ProfileController.saveDeviceToken({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
      });
      res.return(response);
});


/**
 * @swagger
 * /api-mobile/auth/user/profile/delete-device-token:
 *   post:
 *     summary: Delete device token for push notifications
 *     tags:
 *       - User authenticated routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Device token deleted successfully
 */
router.post("/delete-device-token", async (req, res) => {
    const response = await ProfileController.deleteDeviceToken({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
      });
      res.return(response);
});


/**
 * @swagger
 * /api-mobile/auth/user/profile/update:
 *   post:
 *     summary: Update user profile with optional profile image upload
 *     tags:
 *       - User authenticated routes
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
 *               name:
 *                 type: string
 *                 description: User's full name (optional)
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 description: User's email address (optional)
 *                 example: "john@example.com"
 *               profile_image:
 *                 type: string
 *                 format: binary
 *                 description: User profile image (optional, JPEG/PNG/GIF/WebP, max 5MB)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Bad request or validation error
 */
router.post("/update", uploadProfileImage.single('profile_image'), async (req, res) => {
    const profileImagePath = req.file 
      ? `/uploads/profile_images/${req.file.filename}`
      : null;
    
    const response = await ProfileController.updateProfile({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
        profileImagePath,
      });
      res.return(response);
});


export default router;