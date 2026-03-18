import '../config/environment.js';
import express from 'express';
import AdminSettingsController from '../controllers/admin.settings.controller.js';
import AdminController from '../controllers/admin.controller.js';
 
const router = express.Router();
/**
 * @swagger
 * /api/admin/admin-login:
 *   post:
 *     summary: Admin login
 *     tags:
 *       - Admin routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@travelmoney.co.il
 *               password:
 *                 type: string
 *                 format: password
 *                 example: admin@travelmoney.co.il
 *     responses:
 *       200:
 *         description: Success - Admin logged in
 *       400:
 *         description: Bad Request - Invalid credentials
 *       500:
 *         description: Internal Server Error
 */
router.post('/admin-login', async (req, res, next) => {
    res.return(await AdminController.adminLogin({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
    }));
});
/**
 * @swagger
 * /api/admin/user-list:
 *   get:
 *     summary: Get user list with search
 *     tags:
 *       - Admin routes
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           example: 10
 *         description: Number of users to return per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           example: 1
 *         description: Page number to retrieve
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: john
 *         description: Search term for filtering users
 *     responses:
 *       200:
 *         description: Success - Paginated user list
 *       400:
 *         description: Bad Request - Invalid parameters
 *       500:
 *         description: Internal Server Error
 */
router.get('/user-list', async (req, res, next) => {
    res.return(await AdminController.getUserList({
        payload: { ...req.params, ...req.query },
        headers: req.headers,
        user: req.user,
    }));
});


/**
 * @swagger
 * /api/admin/user-detail-by-id:
 *   get:
 *     summary: Get user details by ID
 *     tags:
 *       - Admin routes
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *         description: The ID of the user to retrieve details for
 *     responses:
 *       200:
 *         description: Success - User details retrieved
 *       400:
 *         description: Bad Request - Invalid input
 *       500:
 *         description: Internal Server Error
 */
router.get('/user-detail-by-id', async (req, res, next) => {
    res.return(await AdminController.getUserById({
        payload: { ...req.params, ...req.query },
        headers: req.headers,
        user: req.user,
    }));
});
/**
 * @swagger
 * /api/admin/change-user-status:
 *   post:
 *     summary: Change user status (active/inactive)
 *     tags:
 *       - Admin routes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 example: "1"
 *                 description: The ID of the user to update
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "active"
 *                 description: The new status for the user
 *     responses:
 *       200:
 *         description: Success - User status changed
 *       400:
 *         description: Bad Request - Invalid input
 *       500:
 *         description: Internal Server Error
 */
router.post('/change-user-status', async (req, res, next) => {
    res.return(await AdminController.changeUserStatus({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
    }));

});
/**
 * @swagger
 * /api/admin/transaction-list:
 *   get:
 *     summary: Get transaction list with pagination
 *     tags:
 *       - Admin routes
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           example: 10
 *         description: Number of transactions to return per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           example: 1
 *         description: Page number to retrieve
 *       - in: query
 *         name: status
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *           default: ["completed", "failed"]
 *         description: Filter by transaction status (array of status values, e.g. ["completed", "failed"])
 *       - in: query
 *         name: currency
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *           default: ["ILS", "USD", "EUR"]
 *         description: Filter by currency (array of currency codes, e.g. ["ILS", "USD", "EUR"])
 *       - in: query
 *         name: type
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *           default: ["credit", "debit"]
 *         description: Filter by transaction type (array of type values, e.g. ["credit", "debit"])
 *       - in: query
 *         name: transaction_type
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *           default: ["wallet", "transfer", "transfer_request"]
 *         description: Filter by transaction type (array of type values, e.g. ["wallet", "transfer", "transfer_request"])
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-01-01"
 *         description: Start date for filtering transactions (YYYY-MM-DD)
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2028-12-31"
 *         description: End date for filtering transactions (YYYY-MM-DD)
 *       - in: query
 *         name: mobile
 *         schema:
 *           type: string
 *           example: "+919830990065"
 *         description: Filter by user's mobile number
 *     responses:
 *       200:
 *         description: Success - Paginated transaction list
 *       400:
 *         description: Bad Request - Invalid parameters
 *       500:
 *         description: Internal Server Error
 */
router.get('/transaction-list', async (req, res, next) => {
    res.return(await AdminController.getTransactionList({
        payload: { ...req.params, ...req.query },
        headers: req.headers,
        user: req.user,
    }));
});

/**
 * @swagger
 * /api/admin/transaction-detail-by-id:
 *   get:
 *     summary: Get transaction detail by ID
 *     tags:
 *       - Admin routes
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *         description: The ID of the transaction to retrieve
 *     responses:
 *       200:
 *         description: Success - Transaction detail retrieved
 */
router.get('/transaction-detail-by-id', async (req, res, next) => {
    res.return(await AdminController.getTransactionById({
        payload: { ...req.params, ...req.query },
        headers: req.headers,
        user: req.user,
    }));
});

 

/**
 * @swagger
 * /api/admin/transaction-list-by-user:
 *   get:
 *     summary: Get transaction list by user
 *     tags:
 *       - Admin routes
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *         description: The ID of the user to retrieve transactions for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           example: 10
 *         description: Number of transactions to return per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           example: 1
 *         description: Page number to retrieve
 *     responses:
 *       200:
 *         description: Success - Transaction list for the user retrieved
 */
router.get('/transaction-list-by-user', async (req, res, next) => {
    res.return(await AdminController.getTransactionListByUser({
        payload: { ...req.params, ...req.query },
        headers: req.headers,
        user: req.user,
    }));
});

/**
 * @swagger
 * /api/admin/update-settings:
 *   post:
 *     summary: Bulk update admin settings
 *     tags:
 *       - Admin routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 key:
 *                   type: string
 *                   example: site_name
 *                 value:
 *                   type: string
 *                   example: My Website
 *     responses:
 *       200:
 *         description: Success - Admin settings updated
 */

router.post('/update-settings', async (req, res, next) => {
    res.return(await AdminSettingsController.updateSettings({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
    }));
});

/**
 * @swagger
 * /api/admin/all-settings:
 *   get:
 *     summary: Get all admin settings
 *     tags:
 *       - Admin routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Success - Retrieved all admin settings
 */
router.get('/all-settings', async (req, res, next) => {
    res.return(await AdminSettingsController.getAllSettings({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
    }));

});
/**
 * @swagger
 * /api/admin/get-setting-by-key:
 *   get:
 *     summary: Get admin setting by key
 *     tags:
 *       - Admin routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *           example: some_key
 *     responses:
 *       200:
 *         description: Success - Admin setting retrieved
 *       400:
 *         description: Bad Request - Missing or invalid key
 *       500:
 *         description: Internal Server Error
 */
router.get("/get-setting-by-key", async (req, res, next) => {
     res.return(await AdminSettingsController.getSettingByKey({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
    }));
});
/**
 * @swagger
 * /api/admin/get-installment-payment-interest-rates:
 *   get:
 *     summary: Get installment payment interest rates
 *     tags:
 *       - Admin routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Success - Retrieved installment payment interest rates
 *       500:
 *         description: Internal Server Error
 */
router.get("/get-installment-payment-interest-rates", async (req, res, next) => {
    res.return(await AdminController.getInstallmentPaymentInterestRates({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
    }));
});
/**
 * @swagger
 * /api/admin/add-installment-payment-interest-rates:
 *   post:
 *     summary: Add installment payment interest rates
 *     tags:
 *       - Admin routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 payment_number:
 *                   type: integer
 *                   default: 2
 *                   example: 2
 *                 interest_rate:
 *                   type: number
 *                   format: float
 *                   default: 2.5
 *                   example: 2.5
 *     responses:
 *       200:
 *         description: Success - Installment payment interest rates added
 *       400:
 *         description: Bad Request - Invalid input
 *       500:
 *         description: Internal Server Error
 */
router.post("/add-installment-payment-interest-rates", async (req, res, next) => {
    res.return(await AdminController.addInstallmentPaymentInterestRates({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
    }));
});

/**
 * @swagger
 * /api/admin/get-api-endpoint-logs:
 *   get:
 *     summary: Get API endpoint logs
 *     tags:
 *       - Admin routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Success - Retrieved API endpoint logs
 *       400:
 *         description: Bad Request - Invalid parameters
 *       500:
 *         description: Internal Server Error
 */
router.get("/get-api-endpoint-logs", async (req, res, next) => {
    res.return(await AdminController.getApiEndpointLogs({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
    }));
});


/**
 * @swagger
 * /api/admin/add-faq:
 *   post:
 *     summary: Add a new FAQ
 *     tags:
 *       - Admin routes
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
 *               question:
 *                 type: string
 *                 example: What is the refund policy?
 *               answer:
 *                 type: string
 *                 example: Refunds are processed within 7 business days.
 *               order:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Success - FAQ added
 *       400:
 *         description: Bad Request - Invalid input
 *       500:
 *         description: Internal Server Error
 */
router.post('/add-faq', async (req, res, next) => {
    res.return(await AdminController.addFaq({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
    }));
});




/**
 * @swagger
 * /api/admin/cron-track-list:
 *   get:
 *     summary: Get cron track list
 *     tags:
 *       - Admin routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Success - Retrieved cron track list
 *       500:
 *         description: Internal Server Error
 */
router.get("/cron-track-list", async (req, res, next) => {
    res.return(await AdminController.getCronTrackList({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
    }));
});



/**
 * @swagger
 * /api/admin/feedback-list:
 *   get:
 *     summary: Get feedback list
 *     tags:
 *       - Admin routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           example: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Success - Retrieved feedback list
 *       400:
 *         description: Bad Request - Invalid parameters
 *       500:
 *         description: Internal Server Error
 */
router.get('/feedback-list', async (req, res, next) => {
    res.return(await AdminController.getFeedbackList({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
    }));
});


/**
 * @swagger
 * /api/admin/suggestion-list:
 *   get:
 *     summary: Get suggestion list
 *     tags:
 *       - Admin routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           example: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Success - Retrieved suggestion list
 *       400:
 *         description: Bad Request - Invalid parameters
 *       500:
 *         description: Internal Server Error
 */
router.get('/suggestion-list', async (req, res, next) => {
    res.return(await AdminController.getSuggestionList({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
    }));
});


/**
 * @swagger
 * /api/admin/bug-report-list:
 *   get:
 *     summary: Get bug report list
 *     tags:
 *       - Admin routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           example: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Success - Retrieved bug report list
 *       400:
 *         description: Bad Request - Invalid parameters
 *       500:
 *         description: Internal Server Error
 */
router.get('/bug-report-list', async (req, res, next) => {
    res.return(await AdminController.getBugReportList({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
    }));
});



/**
 * @swagger
 * /api/admin/philippines-payment-list:
 *   get:
 *     summary: Get Philippines payment list
 *     tags:
 *       - Admin routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           example: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Success - Retrieved Philippines payment list
 *       400:
 *         description: Bad Request - Invalid parameters
 *       500:
 *         description: Internal Server Error
 */
router.get('/philippines-payment-list', async (req, res, next) => {
    res.return(await AdminController.getPhilippinesPaymentList({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
    }));
});

/**
 * @swagger
 * /api/admin/vietnam-payment-list:
 *   get:
 *     summary: Get Vietnam payment list
 *     tags:
 *       - Admin routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           example: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Success - Retrieved Vietnam payment list
 *       400:
 *         description: Bad Request - Invalid parameters
 *       500:
 *         description: Internal Server Error
 */
router.get('/vietnam-payment-list', async (req, res, next) => {
    res.return(await AdminController.getVietnamPaymentList({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
    }));
});

/**
 * @swagger
 * /api/admin/cambodia-payment-list:
 *   get:
 *     summary: Get Cambodia payment list
 *     tags:
 *       - Admin routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           example: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Success - Retrieved Cambodia payment list
 *       400:
 *         description: Bad Request - Invalid parameters
 *       500:
 *         description: Internal Server Error
 */
router.get('/cambodia-payment-list', async (req, res, next) => {
    res.return(await AdminController.getCambodiaPaymentList({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user,
    }));
});

export default router;