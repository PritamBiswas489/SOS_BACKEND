import '../config/environment.js';
import express from 'express';
import { default as loginRouter } from './login.router.js';
import {default as NgoTouter} from './ngo.router.js';
import {default as AdminRouter} from './admin.router.js';
// import { default as notificationRouter } from './notification.router.js';
import trackIpAddressDeviceId from '../middlewares/trackIpAddressDeviceId.js';
const router = express.Router();
import ContactUsController from '../controllers/contactus.controller.js';
import AndroidApkService from '../services/androidApk.service.js';
import { generateCsrfToken } from '../middlewares/csrf.js';

// router.use(trackIpAddressDeviceId);

/**
 * @swagger
 * /api/front-web/contact-us:
 *   post:
 *     summary: Save contact us content
 *     tags: [Non authenticated routes]
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
 *               address:
 *                 type: string
 *                 required: true
 *               phoneOne:
 *                 type: string
 *                 required: true
 *               phoneTwo:
 *                 type: string
 *                 required: false
 *               email:
 *                 type: string
 *                 required: true
 *               website:
 *                 type: string
 *                 required: false
 *     responses:
 *       200:
 *         description: Content saved successfully
 */
router.post('/contact-us', async (req, res, next) => {
	const response = await ContactUsController.saveContent({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});
//create swagger  for below router
 /**
    * @swagger
    * /api/front-web/contact-us:
    *   get:
    *     summary: Get contact us content
    *     tags: [Non authenticated routes]
    *     security:
    *       - bearerAuth: []
    *       - refreshToken: []
    *     responses:
    *       200:
    *         description: Contact us endpoint is working
    */
router.get('/contact-us', async (req, res, next) => {
   const response = await ContactUsController.listAll({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response)
});

 
 /**
 * @swagger
 * /api/front-web/donwload-latest-apk:
 *   get:
 *     summary: Download the latest Android APK file
 *     tags:
 *       - Non authenticated routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Latest APK file download
 *         content:
 *           application/vnd.android.package-archive:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Failed to download APK
 */

router.get("/donwload-latest-apk", async (req, res) => {
   const response = await AndroidApkService.downloadLatestApk({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response);
});
/**
 * @swagger
 * /api/front-web/csrf-token:
 *   get:
 *     summary: Get CSRF token
 *     tags:
 *       - Non authenticated routes
 *     responses:
 *       200:
 *         description: Returns a CSRF token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 csrfToken:
 *                   type: string
 *                   description: CSRF token value
 */
router.get("/csrf-token", (req, res) => {
  const csrfToken = generateCsrfToken(req, res);  // ← updated name
  res.json({ csrfToken });
});
router.use('/login',loginRouter)
router.use('/ngo',NgoTouter)
router.use('/admin',AdminRouter);
// router.use('/notification', notificationRouter);




export default router;