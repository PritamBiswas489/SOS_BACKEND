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


export default router;