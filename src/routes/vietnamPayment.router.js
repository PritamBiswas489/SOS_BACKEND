import '../config/environment.js';
import express from 'express';
import VietnamPaymentController from '../controllers/vietnamPayment.controller.js';
const router = express.Router();


/**
 * @swagger
 *  /api/auth/ninePay/decode-qr-code:
 *   post:
 *     summary: Validate NinePay transaction via QR code
 *     tags:
 *       - Vietnam Payment
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qrCode:
 *                 type: string
 *                 description: QR code string for transaction validation
 *             required:
 *               - qrCode
 *     responses:
 *       200:
 *         description: Transaction validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request
 */
router.post('/decode-qr-code', async (req, res, next) => {
    const response = await VietnamPaymentController.decodeQrCode({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});


/**
 * @swagger
 * /api/auth/ninePay/crypto/decode-qr-code:
 *   post:
 *     tags:
 *       - Vietnam Payment
 *     summary:  Execute a crypto decode QR code transaction
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               envelope:
 *                 type: object
 *                 description: Encrypted payload containing buy expense details
 *               sig:
 *                 type: string
 *                 description: Signature for the envelope
 *             required:
 *               - envelope
 *               - sig
 *     responses:
 *       200:
 *         description:  Crypto decode QR code transaction executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/crypto/decode-qr-code', async (req, res, next) => {
    const response = await VietnamPaymentController.cryptoDecodeQrCode({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});


/**
 * @swagger
 *  /api/auth/ninePay/buy-expense:
 *   post:
 *     summary: Buy expense using NinePay
 *     tags:
 *       - Vietnam Payment
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walletCurrency:
 *                 type: string
 *                 example: ILS
 *                 description: Currency of the wallet
 *               amount:
 *                 type: number
 *                 example: 20000
 *                 description: Amount to spend
 *               expenseCatId:
 *                 type: integer
 *                 example: 1
 *                 description: Expense category ID
 *               memo:
 *                 type: string
 *                 example: "Making Payment in General"
 *                 description: Memo for the expense
 *               bank_no:
 *                 type: string
 *                 example: "BIDV"
 *                 description: Bank name
 *               account_number:
 *                 type: string
 *                 example: "2034030440000"
 *                 description: Bank account number
 *               account_name:
 *                 type: string
 *                 example: "NGUYEN VAN A"
 *                 description: Bank account holder name
 *               qrCode:
 *                 type: string
 *                 description: QR code string for transaction validation
 *                 example: "00020101021129370016A00000067701011101130066999999902081234567803037645802VND5909NGUYEN VAN A6009HO CHI MINH62070503***6304B1E2"
 *               is_fixed_price:
 *                 type: boolean
 *                 default: false
 *                 description: Whether the price is fixed or not
 *             required:
 *               - walletCurrency
 *               - amount
 *               - expenseCatId
 *               - memo
 *               - bank_no
 *               - account_number
 *               - account_name
 *               - qrCode
 *               - is_fixed_price
 *     responses:
 *       200:
 *         description: Expense bought successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request
 */
router.post('/buy-expense', async (req, res, next) => {
    const response = await VietnamPaymentController.buyExpense({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});

/**
 * @swagger
 * /api/auth/ninePay/crypto/buy-expense:
 *   post:
 *     tags:
 *       - Vietnam Payment
 *     summary: Execute a crypto buy expense transaction
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               envelope:
 *                 type: object
 *                 description: Encrypted payload containing buy expense details
 *               sig:
 *                 type: string
 *                 description: Signature for the envelope
 *             required:
 *               - envelope
 *               - sig
 *     responses:
 *       200:
 *         description: Crypto buy expense transaction executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/crypto/buy-expense', async (req, res, next) => {
    const response = await VietnamPaymentController.cryptoBuyExpense({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});




/**
 * @swagger
 *  /api/auth/ninePay/expense-transaction-details:
 *   post:
 *     summary: Get details of an expense transaction
 *     tags:
 *       - Vietnam Payment
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               request_id:
 *                 type: string
 *                 description: Transaction info code to retrieve details
 *             required:
 *               - request_id
 *     responses:
 *       200:
 *         description: Transaction details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request
 */
router.post('/expense-transaction-details', async (req, res, next) => {
    const response = await VietnamPaymentController.getExpenseTransactionDetails({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});


/**
 * @swagger
 *  /api/auth/ninePay/expenses-transactions:
 *   post:
 *     summary: Get expenses transactions for a specific month, year and category
 *     tags:
 *       - Vietnam Payment
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               month:
 *                 type: integer
 *                 nullable: true
 *                 default: null
 *                 description: Month for the transactions (1-12), null for all months
 *               year:
 *                 type: integer
 *                 nullable: true
 *                 default: null
 *                 description: Year for the transactions, null for all years
 *               categoryId:
 *                 type: integer
 *                 nullable: true
 *                 default: null
 *                 description: Category ID for filtering transactions, null for all categories
 *               page:
 *                 type: integer
 *                 default: 1
 *                 description: Page number for pagination
 *               limit:
 *                 type: integer
 *                 default: 10
 *                 description: Number of transactions per page
 *             required: []
 *     responses:
 *       200:
 *         description: Expenses transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request
 */
router.post('/expenses-transactions', async (req, res, next) => {
    const response = await VietnamPaymentController.getExpensesTransactions({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});




/**
 * @swagger
 *  /api/auth/ninePay/expenses-report:
 *   post:
 *     summary: Get expenses report for a specific month and year
 *     tags:
 *       - Vietnam Payment
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               month:
 *                 type: integer
 *                 nullable: true
 *                 default: null
 *                 description: Month for the report (1-12), null for all months
 *               year:
 *                 type: integer
 *                 nullable: true
 *                 default: null
 *                 description: Year for the report, null for all years
 *             required: []
 *     responses:
 *       200:
 *         description: Expenses report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request
 */
router.post('/expenses-report', async (req, res, next) => {
    const response = await VietnamPaymentController.getExpensesReport({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});



/**
 * @swagger
 *  /api/auth/ninePay/transaction-mark-as-favorite:
 *   post:
 *     summary: Mark a transaction as favorite
 *     tags:
 *       - Vietnam Payment
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 description: Name of the merchant
 *               transaction_id:
 *                 type: string
 *                 description: ID of the transaction to mark as favorite
 *             required:
 *               - label
 *               - transaction_id
 *     responses:
 *       200:
 *         description: Transaction marked as favorite successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request
 */
router.post('/transaction-mark-as-favorite', async (req, res, next) => {
    const response = await VietnamPaymentController.markTransactionAsFavorite({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});




export default router;
