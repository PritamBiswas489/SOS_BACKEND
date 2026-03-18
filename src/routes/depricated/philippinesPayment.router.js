import '../config/environment.js';
import express from 'express';
import PhilippinesPaymentController from '../controllers/philippinesPayment.controller.js';
const router = express.Router();


/**
 * @swagger
 *  /api/auth/pisopay/token:
 *   get:
 *     summary: Get PisoPay API token
 *     tags:
 *       - Philippines Payment
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
    const response = await PhilippinesPaymentController.getToken();
    res.return(response);
});
/**
 * @swagger
 *  /api/auth/pisopay/remittance-validate-transaction:
 *   post:
 *     summary: Validate PisoPay transaction via QR code
 *     tags:
 *       - Philippines Payment
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
router.post('/remittance-validate-transaction', async (req, res, next) => {
    const response = await PhilippinesPaymentController.validatePisoPayTransaction({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});



/**
 * @swagger
 * /api/auth/pisopay/crypto/remittance-validate-transaction:
 *   post:
 *     tags:
 *       - Philippines Payment
 *     summary: Validate PisoPay transaction via QR code (Crypto)
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
 *                 description: Encrypted payload containing QR code details
 *               sig:
 *                 type: string
 *                 description: Signature for the envelope
 *             required:
 *               - envelope
 *               - sig
 *     responses:
 *       200:
 *         description: Crypto transaction validated successfully
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
router.post('/crypto/remittance-validate-transaction', async (req, res, next) => {
    const response = await PhilippinesPaymentController.cryptoValidatePisoPayTransaction({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});
/**
 * @swagger
 *  /api/auth/pisopay/remittance-initiate-transaction:
 *   post:
 *     summary: Initiate PisoPay transaction
 *     tags:
 *       - Philippines Payment
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
 *               amount:
 *                 type: number
 *                 description: Amount to be transacted
 *             required:
 *               - qrCode
 *               - amount
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
router.post('/remittance-initiate-transaction', async (req, res, next) => {
    const response = await PhilippinesPaymentController.initiatePisoPayTransaction({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});

/**
 * @swagger
 *  /api/auth/pisopay/buy-expense:
 *   post:
 *     summary: Buy expense using PisoPay
 *     tags:
 *       - Philippines Payment
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
 *                 example: 50
 *                 description: Amount to spend
 *               qrCode:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *                 description: QR code string (optional)
 *               expenseCatId:
 *                 type: integer
 *                 example: 1
 *                 description: Expense category ID
 *               memo:
 *                 type: string
 *                 example: "Making Payment in General"
 *                 description: Memo for the expense
 *               merchantName:
 *                 type: string
 *                 example: "ABC Store"
 *                 description: Name of the merchant
 *               merchantCity:
 *                 type: string
 *                 example: "Manila"
 *                 description: City of the merchant
 *               is_fixed_price:
 *                 type: boolean
 *                 default: false
 *                 description: Whether the price is fixed
 *             required:
 *               - walletCurrency
 *               - amount
 *               - expenseCatId
 *               - memo
 *               - merchantName
 *               - merchantCity
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
    const response = await PhilippinesPaymentController.buyExpense({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});

/**
 * @swagger
 * /api/auth/pisopay/crypto/buy-expense:
 *   post:
 *     tags:
 *       - Philippines Payment
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
    const response = await PhilippinesPaymentController.cryptoBuyExpense({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});


/**
 * @swagger
 *  /api/auth/pisopay/expense-transaction-details:
 *   post:
 *     summary: Get details of an expense transaction
 *     tags:
 *       - Philippines Payment
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
 *               transaction_info_code:
 *                 type: string
 *                 description: Transaction info code to retrieve details
 *             required:
 *               - transaction_info_code
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
    const response = await PhilippinesPaymentController.getExpenseTransactionDetails({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});




/**
 * @swagger
 *  /api/auth/pisopay/expenses-transactions:
 *   post:
 *     summary: Get expenses transactions for a specific month, year and category
 *     tags:
 *       - Philippines Payment
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
    const response = await PhilippinesPaymentController.getExpensesTransactions({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});



/**
 * @swagger
 *  /api/auth/pisopay/expenses-report:
 *   post:
 *     summary: Get expenses report for a specific month and year
 *     tags:
 *       - Philippines Payment
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
    const response = await PhilippinesPaymentController.getExpensesReport({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});




/**
 * @swagger
 *  /api/auth/pisopay/transaction-mark-as-favorite:
 *   post:
 *     summary: Mark a transaction as favorite
 *     tags:
 *       - Philippines Payment
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
    const response = await PhilippinesPaymentController.markTransactionAsFavorite({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});

export default router;