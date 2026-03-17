import "../config/environment.js";
import express from "express";
const router = express.Router();
import RedisController from "../controllers/redis.controller.js";
import trackIpAddressDeviceId from '../middlewares/trackIpAddressDeviceId.js';
router.use(trackIpAddressDeviceId);
/**
 * @swagger
 * /api/redis/clear-cache:
 *   post:
 *     summary: Clear Redis cache
 *     tags: [Redis testing routes]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.post("/clear-cache", async (req, res, next) => {
  const response = await RedisController.clearCache(req, res);
  res.return(response);
});

/**
 * @swagger
 * /api/redis/save-demo-data:
 *   post:
 *     summary: Save demo data to Redis
 *     tags: [Redis testing routes]
 *     responses:
 *       200:
 *         description: Demo data saved successfully
 */

router.post("/save-demo-data", async (req, res, next) => {
  const response = await RedisController.saveDemoData(req, res);
  res.return(response);
});

/**
 * @swagger
 * /api/redis/get-demo-data:
 *   get:
 *     summary: Get demo data from Redis
 *     tags: [Redis testing routes]
 *     responses:
 *       200:
 *         description: Demo data retrieved successfully
 */
router.get("/get-demo-data", async (req, res, next) => {
  const response = await RedisController.getDemoData(req, res);
  res.return(response);
});

export default router;
