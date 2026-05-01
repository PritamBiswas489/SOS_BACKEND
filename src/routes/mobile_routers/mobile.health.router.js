import '../../config/environment.js';
import express from 'express';
import HeartRateController from '../../controllers/heartRate.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api-mobile/auth/health/save-stress-reading:
 *   post:
 *     summary: Save a heart rate / stress reading
 *     tags:
 *       - Health routes
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
 *               - source
 *               - current_hr
 *               - created_at
 *             properties:
 *               source:
 *                 type: string
 *                 enum: [ble, googlefit]
 *                 example: "ble"
 *               current_hr:
 *                 type: integer
 *                 example: 72
 *               created_at:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-01T10:00:00Z"
 *               stress_score:
 *                 type: integer
 *                 example: 45
 *               stress_state:
 *                 type: string
 *                 example: "moderate"
 *               stress_level:
 *                 type: integer
 *                 example: 2
 *               rmssd:
 *                 type: number
 *                 example: 42.5
 *               hr_intensity:
 *                 type: integer
 *                 example: 60
 *               hr_score:
 *                 type: integer
 *                 example: 80
 *               rmssd_score:
 *                 type: integer
 *                 example: 70
 *               avg_hr:
 *                 type: integer
 *                 example: 74
 *     responses:
 *       200:
 *         description: Stress reading saved successfully
 *       400:
 *         description: Bad request
 */
router.post("/save-stress-reading", async (req, res) => {
  const response = await HeartRateController.saveStressReading({
    payload: { ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});

/**
 * @swagger
 * /api-mobile/auth/health/stress-readings:
 *   get:
 *     summary: Get paginated list of stress readings for the authenticated user
 *     tags:
 *       - Health routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Records per page
 *         example: 20
 *     responses:
 *       200:
 *         description: List of stress readings
 *       400:
 *         description: Bad request
 */
router.get("/stress-readings", async (req, res) => {
  const response = await HeartRateController.getStressReadings({
    payload: { ...req.query },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});

/**
 * @swagger
 * /api-mobile/auth/health/stress-readings/latest:
 *   get:
 *     summary: Get the latest stress reading for the authenticated user
 *     tags:
 *       - Health routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Latest stress reading
 *       400:
 *         description: Bad request
 */
router.get("/stress-readings/latest", async (req, res) => {
  const response = await HeartRateController.getLatestStressReading({
    payload: {},
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});

export default router;
