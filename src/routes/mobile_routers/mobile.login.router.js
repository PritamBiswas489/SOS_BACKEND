import "../../config/environment.js";
import express from "express";
import LoginController from "../../controllers/login.controller.js";
import { otpRateLimiter } from "../../middlewares/otpRateLimiter.js";
 
const router = express.Router();


/**
 * @swagger
 * /api-mobile/front/login/send-otp:
 *   post:
 *     summary: Send OTP for login
 *     tags: 
 *       - User authentication routes
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
 *               phoneNumber:
 *                 type: string
 *                 required: true
 *                 default: "+919830990065"
 *               messageType:
 *                 type: string
 *                 required: true
 *                 enum: ["whatsapp", "sms"]
 *                 default: "sms"
 *               appHash:
 *                 type: string
 *                 required: true
 *                 default: ""
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post("/send-otp", otpRateLimiter, async (req, res) => {
  const response = await LoginController.sendOtpToMobileNumber({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});

  /**
   * @swagger
   * /api-mobile/front/login/verify-otp:
   *   post:
   *     summary: Verify OTP for login
   *     tags:
   *       - User authentication routes
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
   *               phoneNumber:
   *                 type: string
   *                 required: true
   *                 default: "+919830990065"
   *               otp:
   *                 type: string
   *                 required: true
   *                 default: "123456"
   *     responses:
   *       200:
   *         description: OTP verified successfully
   */
router.post("/verify-otp", async (req, res) => {
   const response = await LoginController.verifyOtp({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});

/**
 * @swagger
 * /api-mobile/front/login/create-user-after-otp-verification:
 *   post:
 *     summary: Create user after OTP verification
 *     tags:
 *       - User authentication routes
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
 *               phoneNumber:
 *                 type: string
 *                 required: true
 *                 default: "+919830990065"
 *     responses:
 *       200:
 *         description: User created successfully after OTP verification
 */
router.post("/create-user-after-otp-verification", async (req, res) => {
   const response = await LoginController.createUserAfterOtpVerification({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});

 

 export default router;
