import '../../config/environment.js';
import express from 'express';
import { default as jwtVerifyWebUser } from '../../middlewares/jwtVerifyWebUser.js';
import { default as licenseRouter } from './license.router.js';
import { default as kycRouter } from './kyc.router.js';
import { default as AdminRouter } from './admin.router.js';
import RequestIosController from '../../controllers/requestIos.controller.js';
import AdminController from '../../controllers/admin.controller.js';
import { contactAdminApiRateLimiter } from '../../middlewares/otpRateLimiter.js';
const router = express.Router();

router.use(jwtVerifyWebUser);

router.use("/license", licenseRouter);
router.use("/kyc", kycRouter);

/**
 * @swagger
 * /api/auth-web/user/request-for-ios-access:
 *   post:
 *     summary: Request iOS access
 *     tags:
 *       - User routes
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
 *               emailAddress:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: user@example.com
 *             required:
 *               - emailAddress
 *     responses:
 *       200:
 *         description: iOS access request submitted successfully
 */

router.post("/request-for-ios-access",async (req, res, next) => {
  const response = await RequestIosController.requestForIosAccess({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});


/**
 * @swagger
 * /api/auth-web/user/status-of-ios-access-request:
 *   get:
 *     summary: Get iOS access request status for logged-in user
 *     tags:
 *       - User routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: iOS access request status retrieved successfully
 *       400:
 *         description: Failed to retrieve iOS access request status
 */


router.get("/status-of-ios-access-request", async (req, res, next) => {
  const response = await RequestIosController.getStatusOfIosAccessRequest({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});


/**
 * @swagger
 * /api/auth-web/user/contact-admin:
 *   post:
 *     summary: Send message to admin
 *     tags:
 *       - User routes
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



router.post('/contact-admin', contactAdminApiRateLimiter, async (req, res, next) => {
  const response = await AdminController.contactAdmin({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});












 
export default router;
