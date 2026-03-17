import "../config/environment.js";
import express from "express";
import NotificationService from "../services/notification.service.js";

const router = express.Router();
/**
 * @swagger
 * /api/front/notification/wallet-transfer:
 *   post:
 *     summary: Create wallet transfer notification
 *     tags: [Notification routes - Testing purposes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transferId:
 *                 type: string
 *                 required: true
 *     responses:
 *       201:
 *         description: Wallet transfer notification created successfully
 */
router.post("/wallet-transfer", async (req, res) => {
    const { transferId } = req.body;
    const { i18n } = req.headers;
    await NotificationService.walletTransferNotification(transferId, i18n);
    res.status(201).send("Wallet transfer notification created");
});
/**
 * @swagger
 * /api/front/notification/wallet-transfer/rejection:
 *   post:
 *     summary: Create wallet transfer rejection notification
 *     tags: [Notification routes - Testing purposes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transferId:
 *                 type: string
 *                 required: true
 *     responses:
 *       201:
 *         description: Wallet transfer rejection notification created successfully
 */
router.post("/wallet-transfer/rejection", async (req, res) => {
    const { transferId } = req.body;
    const { i18n } = req.headers;
    await NotificationService.walletTransferRejectionNotification(transferId, i18n);
    res.status(201).send("Wallet transfer rejection notification created");
});
/**
 * @swagger
 * /api/front/notification/wallet-transfer/acceptance:
 *   post:
 *     summary: Create wallet transfer acceptance notification
 *     tags: [Notification routes - Testing purposes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transferId:
 *                 type: string
 *                 required: true
 *     responses:
 *       201:
 *         description: Wallet transfer acceptance notification created successfully
 */

router.post("/wallet-transfer/acceptance", async (req, res) => {
    const { transferId } = req.body;
    const { i18n } = req.headers;
    await NotificationService.walletTransferAcceptanceNotification(transferId, i18n);
    res.status(201).send("Wallet transfer acceptance notification created");
});

export default router;