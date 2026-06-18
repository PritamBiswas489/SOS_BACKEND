import '../../config/environment.js';
import express from 'express';
import SettingsController from '../../controllers/settings.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api-mobile/auth/settings/get-settings:
 *   get:
 *     summary: Get settings for the authenticated user
 *     tags:
 *       - Settings routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Settings fetched successfully
 *       400:
 *         description: Bad request
 */
router.get("/get-settings", async (req, res) => {
  const response = await SettingsController.getSettings({
          payload: { ...req.params, ...req.query, ...req.body },
          headers: req.headers,
          user: req.user,
        });
        res.return(response);
});

export default router;
