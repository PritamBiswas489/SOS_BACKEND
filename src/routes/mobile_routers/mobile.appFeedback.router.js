import '../../config/environment.js';
import express from 'express';
import AppFeedbackController from '../../controllers/appFeedback.controller.js';


const router = express.Router();

/**
 * @swagger
 * /api-mobile/auth/app-feedback/submit-feedback:
 *   post:
 *     summary: Submit app feedback
 *     tags:
 *       - App feedback routes
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
 *               - rating
 *               - message
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               message:
 *                 type: string
 *                 example: "The app is working well."
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/submit-feedback", async (req, res) => {
  const response = await AppFeedbackController.submitFeedback({
          payload: { ...req.params, ...req.query, ...req.body },
          headers: req.headers,
          user: req.user,
        });
        res.return(response);
});

export default router;