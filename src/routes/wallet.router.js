import '../config/environment.js';
import express from 'express';
import { default as WalletController } from '../controllers/wallet.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/wallet/user-wallet:
 *   post:
 *     summary: Get user wallet information
 *     tags:
 *       - Auth-Wallet routes
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
 *               currency:
 *                 type: array
 *                 items:
 *                   type: string
 *                 default: ["ILS", "USD", "EUR"]
 *                 description: Filter by currency (array of currency codes, e.g. ["ILS", "USD", "EUR"])
 *     responses:
 *       200:
 *         description: Success - User wallet information retrieved
 */
router.post('/user-wallet', async (req, res, next) => {
  const response = await WalletController.getUserWallet({ headers: req.headers, user: req.user, payload: req.body });
  res.return(response);
});


/**
 * @swagger
 * /api/auth/wallet/user-wallet-all-currencies:
 *   get:
 *     summary: Get user wallet All Currencies information
 *     tags:
 *       - Auth-Wallet routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Success - User wallet information retrieved
 */
router.get('/user-wallet-all-currencies', async (req, res, next) => {
  const response = await WalletController.getUserWalletAllCurrencies({ headers: req.headers, user: req.user, payload: req.body });
  res.return(response);
});



/**
 * @swagger
 * /api/auth/wallet/user-wallet-transaction-history:
 *   post:
 *     summary: Get user wallet transaction history
 *     tags:
 *       - Auth-Wallet routes
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
 *               page:
 *                 type: integer
 *                 default: 1
 *                 description: Page number for pagination
 *               limit:
 *                 type: integer
 *                 default: 10
 *                 description: Number of items per page
 *               filter:
 *                 type: string
 *                 enum:
 *                   - sent
 *                   - received
 *                   - topup
 *                   - expenses
 *                 default: sent
 *                 description: Filter by transaction type (sent, received, topup, expenses)
 *     responses:
 *       200:
 *         description: Success - User wallet transaction history retrieved
 */
router.post('/user-wallet-transaction-history', async (req, res, next) => {
  const response = await WalletController.getUserWalletTransactionHistory({ headers: req.headers, user: req.user, payload: req.body });
  res.return(response);
});



 
 


export default router;

