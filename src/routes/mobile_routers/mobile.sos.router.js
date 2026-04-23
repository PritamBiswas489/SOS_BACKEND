import '../../config/environment.js';
import express from 'express';
import SosSessionsController from '../../controllers/sosSessions.controller.js';
const router = express.Router();


/**
 * @swagger
 * /api-mobile/auth/sos/register-sos:
 *   post:
 *     summary: Register a new SOS session
 *     tags:
 *       - SOS routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: SOS session registered successfully
 */
router.post("/register-sos", async (req, res) => {
    const response = await SosSessionsController.registerSosSession({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
      });
      res.return(response);
});


/**
 * @swagger
 * /api-mobile/auth/sos/send-sos-notification:
 *   post:
 *     summary: Send SOS notification for an active SOS session
 *     tags:
 *       - SOS routes
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
 *               - session_id
 *             properties:
 *               session_id:
 *                 type: integer
 *                 description: The ID of the SOS session to send notifications for
 *                 example: 1
 *     responses:
 *       200:
 *         description: SOS notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "SOS notification sent successfully"
 *       400:
 *         description: Bad request — missing or invalid session_id
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/send-sos-notification", async (req, res) => {
    const response = await SosSessionsController.sendSosSessionNotification({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
      });
      res.return(response);
});



/**
 * @swagger
 * /api-mobile/auth/sos/incomming-sos-notification:
 *   post:
 *     summary: Get incoming SOS notifications for the authenticated user
 *     tags:
 *       - SOS routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *                 description: Number of records to return per page
 *                 example: 10
 *               page:
 *                 type: integer
 *                 description: Page number for pagination
 *                 example: 1
 *               status:
 *                 type: string
 *                 description: Filter notifications by status
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Incoming SOS notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Incoming SOS notifications retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Bad request — invalid parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/incomming-sos-notification", async (req, res) => {
    const response = await SosSessionsController.incommingSosSessionNotification({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
      });
      res.return(response);
});


/**
 * @swagger
 * /api-mobile/auth/sos/my-sos-sessions:
 *   post:
 *     summary: Get SOS sessions for the authenticated user
 *     tags:
 *       - SOS routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *                 description: Number of records to return per page
 *                 example: 10
 *               page:
 *                 type: integer
 *                 description: Page number for pagination
 *                 example: 1
 *               status:
 *                 type: string
 *                 description: Filter SOS sessions by status
 *                 example: "active"
 *     responses:
 *       200:
 *         description: SOS sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "SOS sessions retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Bad request — invalid parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/my-sos-sessions", async (req, res) => {
    const response = await SosSessionsController.mySosSessions({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
      });
      res.return(response);
});

 

export default router;