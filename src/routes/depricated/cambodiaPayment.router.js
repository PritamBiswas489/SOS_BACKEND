import '../config/environment.js';
import express from 'express';
import CambodiaPaymentController from '../controllers/cambodiaPayment.controller.js';
const router = express.Router();



/**
 * @swagger
 *  /api/auth/kesspay/token:
 *   get:
 *     summary: Get KessPay API token
 *     tags:
 *       - Cambodia Payment
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Token retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid request
 */
router.get('/token', async (req, res, next) => {
    const response = await CambodiaPaymentController.getToken();
    res.return(response);
});




/**
 * @swagger
 *  /api/auth/kesspay/decode-khqr:
 *   post:
 *     summary: Decode KHQR code
 *     tags:
 *       - Cambodia Payment
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
 *               - qrcode
 *             properties:
 *               qrcode:
 *                 type: string
 *                 example: "00020101021229370009khqr@aclb011009781311020206ACLEDA392000118551247962701014520420005802KH530384054045.005912PHOS RAKSMEY6010Phnom Penh621402100978131102630464F8"
 *     responses:
 *       200:
 *         description: KHQR decoded successfully
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
router.post('/decode-khqr', async (req, res) => {
    const response = await CambodiaPaymentController.decodeKHQR({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});




/**
 * @swagger
 * /api/auth/kesspay/crypto/decode-khqr:
 *   post:
 *     tags:
 *       - Cambodia Payment
 *     summary: Decode KHQR code using crypto method
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
 *                 description: Encrypted payload containing KHQR decode details
 *               sig:
 *                 type: string
 *                 description: Signature for the envelope
 *             required:
 *               - envelope
 *               - sig
 *     responses:
 *       200:
 *         description: KHQR decoded successfully using crypto method
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
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/crypto/decode-khqr', async (req, res) => {
    const response = await CambodiaPaymentController.cryptoDecodeKHQR({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});



/**
 * @swagger
 *  /api/auth/kesspay/buy-expense:
 *   post:
 *     summary: Buy expense using Cambodia payment
 *     tags:
 *       - Cambodia Payment
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
 *               - walletCurrency
 *               - transactionCurrency
 *               - transactionAmount
 *               - merchantName
 *               - merchantCity
 *               - qrCode
 *             properties:
 *               walletCurrency:
 *                 type: string
 *                 example: "ILS"
 *               transactionCurrency:
 *                 type: string
 *                 example: "USD"
 *               transactionAmount:
 *                 type: number
 *                 example: 5.00
 *               merchantName:
 *                 type: string
 *                 example: "PHOS RAKSMEY"
 *               merchantCity:
 *                 type: string
 *                 example: "Phnom Penh"
 *               qrCode:
 *                 type: string
 *                 example: "00020101021229370009khqr@aclb011009781311020206ACLEDA392000118551247962701014520420005802KH530384054045.005912PHOS RAKSMEY6010Phnom Penh621402100978131102630464F8"
 *               expenseCatId:
 *                 type: number
 *                 default: 1
 *                 example: 1
 *               is_fixed_price:
 *                 type: boolean
 *                 default: false
 *                 example: false
 *               memo:
 *                 type: string
 *                 example: "Coffee purchase"
 *     responses:
 *       200:
 *         description: Expense purchased successfully
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
router.post('/buy-expense', async (req, res) => {
    const response = await CambodiaPaymentController.buyExpense({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});



/**
 * @swagger
 * /api/auth/kesspay/crypto/buy-expense:
 *   post:
 *     tags:
 *       - Cambodia Payment
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
    const response = await CambodiaPaymentController.cryptoBuyExpense({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});



/**
 * @swagger
 *  /api/auth/kesspay/expense-transaction-details:
 *   post:
 *     summary: Get details of an expense transaction
 *     tags:
 *       - Cambodia Payment
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
 *               id:
 *                 type: string
 *                 description: Transaction ID to retrieve details
 *             required:
 *               - id
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
    const response = await CambodiaPaymentController.getExpenseTransactionDetails({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});


/**
 * @swagger
 *  /api/auth/kesspay/expenses-transactions:
 *   post:
 *     summary: Get expenses transactions for a specific month, year and category
 *     tags:
 *       - Cambodia Payment
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
 *               currency:
 *                 type: string
 *                 default: "USD"
 *                 description: Currency filter for the transactions
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
    const response = await CambodiaPaymentController.getExpensesTransactions({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});


/**
 * @swagger
 *  /api/auth/kesspay/expenses-report:
 *   post:
 *     summary: Get expenses report for a specific month and year
 *     tags:
 *       - Cambodia Payment
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
 *               currency:
 *                 type: string
 *                 nullable: true
 *                 default: null
 *                 example: "USD"
 *                 description: Currency filter for the report (e.g., USD, ILS), null for all currencies
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
    const response = await CambodiaPaymentController.getExpensesReport({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});



/**
 * @swagger
 *  /api/auth/kesspay/transaction-mark-as-favorite:
 *   post:
 *     summary: Mark a transaction as favorite
 *     tags:
 *       - Cambodia Payment
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
    const response = await CambodiaPaymentController.markTransactionAsFavorite({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});



/**
 * @swagger
 *  /api/auth/kesspay/kyc-create-user:
 *   post:
 *     summary: Create a new user
 *     tags:
 *       - Cambodia Payment
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: User created successfully
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
router.post('/kyc-create-user', async (req, res, next) => {
    const response = await CambodiaPaymentController.createUser({ headers: req.headers, user: req.user, payload: {...req.body, ...req.params,...req.query } });
    res.return(response);
});


/**
 * @swagger
 *  /api/auth/kesspay/kyc-update:
 *   post:
 *     summary: Update KYC information
 *     tags:
 *       - Cambodia Payment
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: KYC updated successfully
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
router.post('/kyc-update', async (req, res, next) => {
    const response = await CambodiaPaymentController.updateKyc({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});


/**
 * @swagger
 *  /api/auth/kesspay/check-kyc-status:
 *   post:
 *     summary: Check KYC status
 *     tags:
 *       - Cambodia Payment
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: KYC status retrieved successfully
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
router.post('/check-kyc-status', async (req, res, next) => {
    const response = await CambodiaPaymentController.checkKycStatus({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});



/**
 * @swagger
 *  /api/auth/kesspay/kyc-user-details:
 *   get:
 *     summary: Get KYC user details
 *     tags:
 *       - Cambodia Payment
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: KYC user details retrieved successfully
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
router.get('/kyc-user-details', async (req, res, next) => {
    const response = await CambodiaPaymentController.kycUserDetails({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});



export default router;
