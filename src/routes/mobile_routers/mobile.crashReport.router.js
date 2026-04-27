import '../../config/environment.js';
import express from 'express';
import CrashReportController from '../../controllers/crashReports.controller.js';
const router = express.Router();


/**
 * @swagger
 * /api-mobile/front/crash-report/submit:
 *   post:
 *     summary: Submit a crash report
 *     tags:
 *       - Crash report routes
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
 *               payload:
 *                 type: object
 *                 description: Crash report payload (JSON)
 *                 example: {"error": "TypeError", "stack": "..."}
 *     responses:
 *       200:
 *         description: Crash report submitted successfully
 */
router.post("/submit", async (req, res) => {
    
    const response = await CrashReportController.submitCrashReport({
        payload: req.body,
    });

    res.status(200).json(response);
});


/**
 * @swagger
 * /api-mobile/front/crash-report/list:
 *   get:
 *     summary: Get list of crash reports
 *     tags:
 *       - Crash report routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records per page
 *         example: 10
 *     responses:
 *       200:
 *         description: List of crash reports
 */
router.get("/list", async (req, res) => {
    const response = await CrashReportController.getCrashReports({
        payload: { ...req.query },
    });
    res.status(200).json(response);
});

export default router;