import "../config/environment.js";
import express from "express";
import LicenseController from "../controllers/license.controller.js";
const router = express.Router();

/**
 * @swagger
 * /api/auth-web/user/license/generate-code:
 *   post:
 *     summary: Generate a license code
 *     tags:
 *       - License routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: License code generated successfully
 */
router.post("/generate-code", async (req, res) => {
  const response = await LicenseController.generateLicenseCode({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});

/**
 * @swagger
 * /api/auth-web/user/license/get-code:
 *   get:
 *     summary: Retrieve license code
 *     tags:
 *       - License routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: License code retrieved successfully
 */

router.get("/get-code", async (req, res) => {
  const response = await LicenseController.getLicenseCode({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});

export default router;
