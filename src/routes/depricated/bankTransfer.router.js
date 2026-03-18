import '../config/environment.js';
import express from 'express';
import BankTransferPaymentController from '../controllers/bankTransferPayment.controller.js';
const router = express.Router();

/**
 * @swagger
 * /api/auth/bank-transfer/get-payment-link:
 *   post:
 *     summary: Initiate Bank Transfer Payment
 *     tags: [Auth-Deposit Bank Transfer routes]
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *     responses:
 *       200:
 *         description: Bank transfer payment initiated successfully
 */
router.post('/get-payment-link', async (req, res, next) => {
    const response = await BankTransferPaymentController.getPaymentLink({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});

export default router;