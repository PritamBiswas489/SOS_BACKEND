import "../../config/environment.js";
import express from "express";
import PushNotificationController from "../../controllers/pushNotification.controller.js";
const router = express.Router();

/**
 * @swagger
 * /api-mobile/front/push-notification/test-send-push-notification:
 *   post:
 *     summary: Push notification services routes
 *     tags:
 *       - Push notification services routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 default: ""
 *               title:
 *                 type: string
 *                 default: "Test title"
 *               body:
 *                 type: string
 *                 default: "Test message"
 *               data:
 *                 type: object
 *                 example: { "key1": "value1", "key2": "value2" }
 *     responses:
 *       200:
 *         description: Push notification test sent successfully
 */

router.post("/test-send-push-notification", async (req, res, next) => {
     const response = await PushNotificationController.testSendPushNotification({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
      });
      res.return(response);
});

export default router;