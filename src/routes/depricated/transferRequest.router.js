import '../config/environment.js';
import express from 'express';
import { default as TransferRequestController } from '../controllers/transferRequest.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/transfer-request/send-request:
 *   post:
 *     tags:
 *       - Auth-Transfer Requests routes
 *     summary: Send a transfer request
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
 *               receiverId:
 *                 type: string
 *                 description: Unique identifier of the receiver
 *               currency:
 *                 type: string
 *                 description: Currency code (e.g., USD, EUR)
 *               amount:
 *                 type: number
 *                 description: Amount to transfer
 *               message:
 *                 type: string
 *                 description: Optional message for the transfer request
 *             required:
 *               - receiverId
 *               - currency
 *               - amount
 *     responses:
 *       200:
 *         description: Transfer executed successfully
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

router.post('/send-request', async (req, res, next) => {
    const response = await TransferRequestController.sendRequest({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
}) 


/**
 * @swagger
 * /api/auth/transfer-request/crypto/send-request:
 *   post:
 *     tags:
 *       - Auth-Transfer Requests routes
 *     summary: Send a crypto transfer request
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
 *                 description: Envelope containing crypto transfer details
 *               sig:
 *                 type: string
 *                 description: Signature string
 *             required:
 *               - envelope
 *               - sig
 *     responses:
 *       200:
 *         description: Crypto transfer request sent successfully
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
router.post("/crypto/send-request", async (req, res, next) => {
    const response = await TransferRequestController.sendCryptoRequest({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});


/**
 * @swagger
 * /api/auth/transfer-request/accept-reject-transfer-request:
 *   post:
 *     tags:
 *       - Auth-Transfer Requests routes
 *     summary: Approved or reject a transfer
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
 *               transferRequestId:
 *                 type: string
 *                 description: Unique identifier of the transfer request
 *               isAccepted:
 *                 type: boolean
 *                 description: true to accept, false to reject the transfer request
 *             required:
 *               - transferRequestId
 *               - isAccepted
 *     responses:
 *       200:
 *         description: Transfer action processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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
router.post("/accept-reject-transfer-request", async (req, res, next) => {
    const response = await TransferRequestController.acceptRejectTransferRequest({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
})



/**
 * @swagger
 * /api/auth/transfer-request/crypto/accept-reject-transfer-request:
 *   post:
 *     tags:
 *       - Auth-Transfer Requests routes
 *     summary: Accept or reject a crypto transfer request
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
 *                 description: Envelope containing crypto transfer details
 *               sig:
 *                 type: string
 *                 description: Signature string
 *             required:
 *               - envelope
 *               - sig
 *           example:
 *             envelope: {}
 *             sig: "string"
 *     responses:
 *       200:
 *         description: Crypto transfer request accept/reject processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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
router.post("/crypto/accept-reject-transfer-request", async (req, res, next) => {
    const response = await TransferRequestController.acceptRejectCryptoTransferRequest({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
})




/**
 * @swagger
 * /api/auth/transfer-request/reject-transfer-request-by-sender:
 *   post:
 *     tags:
 *       - Auth-Transfer Requests routes
 *     summary: Reject a transfer request by the sender
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
 *               transferRequestId:
 *                 type: string
 *                 description: Unique identifier of the transfer request to reject
 *             required:
 *               - transferRequestId
 *     responses:
 *       200:
 *         description: Transfer request rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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
router.post("/reject-transfer-request-by-sender", async (req, res, next) => {
    const response = await TransferRequestController.rejectTransferRequestBySender({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
})



/**
 * @swagger
 * /api/auth/transfer-request/crypto/reject-transfer-request-by-sender:
 *   post:
 *     tags:
 *       - Auth-Transfer Requests routes
 *     summary: Reject a crypto transfer request by the sender
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
 *                 description: Envelope containing crypto transfer details
 *               sig:
 *                 type: string
 *                 description: Signature string
 *             required:
 *               - envelope
 *               - sig
 *           example:
 *             envelope: {}
 *             sig: "string"
 *     responses:
 *       200:
 *         description: Crypto transfer request rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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
router.post("/crypto/reject-transfer-request-by-sender", async (req, res, next) => {
    const response = await TransferRequestController.rejectCryptoTransferRequestBySender({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
})

/**
 * @swagger
 * /api/auth/transfer-request/get-transfer-request-history:
 *   post:
 *     tags:
 *       - Auth-Transfer Requests routes
 *     summary: Get transfer history with pagination and filters
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
 *               page:
 *                 type: integer
 *                 description: Page number for pagination
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 description: Number of items per page
 *                 default: 10
 *               filter:
 *                 type: object
 *                 default:
 *                   type: ["incoming", "outgoing"]
 *                   status: ["rejected", "approved", "pending"]
 *                 properties:
 *                   type:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Filter by transfer type (e.g., ["incoming", "outgoing"])
 *                     default: ["incoming", "outgoing"]
 *                   status:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Filter by transfer status (e.g., ["rejected", "approved", "pending"])
 *                     default: ["rejected", "approved", "pending"]
 *     responses:
 *       200:
 *         description: Transfer history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                   default: []
 *                 page:
 *                   type: integer
 *                   default: 1
 *                 limit:
 *                   type: integer
 *                   default: 10
 *                 total:
 *                   type: integer
 *                   default: 0
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   default: ""
 */
router.post("/get-transfer-request-history", async (req, res, next) => {
    const response = await TransferRequestController.getTransferRequestHistory({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
})
/**
 * @swagger
 * /api/auth/transfer-request/get-transfer-details:
 *   post:
 *     tags:
 *       - Auth-Transfer Requests routes
 *     summary: Get transfer request details by ID
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
 *               transferRequestId:
 *                 type: string
 *                 description: Unique identifier of the transfer request
 *             required:
 *               - transferRequestId
 *     responses:
 *       200:
 *         description: Transfer request details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transferRequest:
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
router.post("/get-transfer-details", async (req, res, next) => {
    const response = await TransferRequestController.getTransferRequestById({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});

export default router;

