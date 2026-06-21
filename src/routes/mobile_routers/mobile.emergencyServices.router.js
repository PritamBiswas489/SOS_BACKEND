import '../../config/environment.js';
import express from 'express';
import EmergencyServicesController from '../../controllers/emergencyServices.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api-mobile/auth/emergency-services/request-register-new-location:
 *   post:
 *     summary: Request registration of a new emergency service
 *     tags:
 *       - Emergency services routes
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
router.post('/request-register-new-location', async (req, res) => {
  const response = await EmergencyServicesController.requestRegisterNewEmergencyService({
    payload: { ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});

/**
 * @swagger
 * /api-mobile/auth/emergency-services/get-nearby-emergency-services:
 *   get:
 *     summary: Get nearby emergency services
 *     tags:
 *       - Emergency services routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Latitude of the user's current location
 *         example: 22.6958
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Longitude of the user's current location
 *         example: 88.4443
 *       - in: query
 *         name: serviceType
 *         required: false
 *         schema:
 *           type: string
 *         description: Type of emergency service to search for
 *         example: "hospital"
 *       - in: query
 *         name: radius
 *         required: false
 *         schema:
 *           type: number
 *           format: float
 *         description: Search radius in kilometers (default is 5 km)
 *         example: 5
 *     responses:
 *       200:
 *         description: Nearby emergency services fetched successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/get-nearby-emergency-services', async (req, res) => {

  const response = await EmergencyServicesController.getNearbyEmergencyServices({
    payload: { ...req.query },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});

/**
 * @swagger
 * /api-mobile/auth/emergency-services/get-my-requested-emergency-services:
 *   get:
 *     summary: Get emergency services requested by the logged-in user
 *     tags:
 *       - Emergency services routes
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

router.get('/get-my-requested-emergency-services', async (req, res) => {
  const response = await EmergencyServicesController.getMyRequestedEmergencyServices({
    payload: { ...req.query },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});

export default router;
