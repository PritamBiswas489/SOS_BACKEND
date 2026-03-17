import '../config/environment.js';
import express from 'express';
import { default as TransferController } from '../controllers/transfer.controller.js';

const router = express.Router();



/**
 * @swagger
 * /api/auth/transfer/check-receiver-status:
 *   post:
 *     tags:
 *       - Auth-Transfer routes
 *     summary: Check receiver status by mobile number
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
 *               mobile:
 *                 type: string
 *                 default: "+919830990065"
 *                 description: Mobile number of the receiver
 *               type:
 *                 type: string
 *                 default: "send"
 *                 description: Input type
 *     responses:
 *       200:
 *         description: Receiver status retrieved successfully
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
 *         description: Invalid mobile number
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/check-receiver-status', async (req, res, next) => {
    const response = await TransferController.checkReceiverStatus({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
}) 

/**
 * @swagger
 * /api/auth/transfer/execute-transfer:
 *   post:
 *     tags:
 *       - Auth-Transfer routes
 *     summary: Execute a transfer to a receiver
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
 *                 description: Optional message for the transfer
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
router.post("/execute-transfer", async (req, res, next) => {
    const response = await TransferController.executeTransfer({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
})

/**
 * @swagger
 * /api/auth/transfer/crypto/execute-transfer:
 *   post:
 *     tags:
 *       - Auth-Transfer routes
 *     summary: Execute a crypto transfer to a receiver
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
 *                 description: Encrypted payload containing transfer details
 *               sig:
 *                 type: string
 *                 description: Signature for the envelope
 *             required:
 *               - envelope
 *               - sig
 *     responses:
 *       200:
 *         description: Crypto transfer executed successfully
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

router.post("/crypto/execute-transfer", async (req, res, next) => {
    const response = await TransferController.executeCryptoTransfer({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
})

/**
 * @swagger
 * /api/auth/transfer/accept-reject-transfer:
 *   post:
 *     tags:
 *       - Auth-Transfer routes
 *     summary: Accept or reject a transfer by the receiver 
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
 *               transferId:
 *                 type: string
 *                 description: Unique identifier of the transfer
 *               isAccepted:
 *                 type: boolean
 *                 description: true to accept, false to reject the transfer
 *             required:
 *               - transferId
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
router.post("/accept-reject-transfer", async (req, res, next) => {
    const response = await TransferController.acceptRejectTransfer({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
})


/**
 * @swagger
 * /api/auth/transfer/crypto/accept-reject-transfer:
 *   post:
 *     tags:
 *       - Auth-Transfer routes
 *     summary: Accept or reject a crypto transfer by the receiver
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
 *                 description: Encrypted payload containing transfer details
 *               sig:
 *                 type: string
 *                 description: Signature for the envelope
 *             required:
 *               - envelope
 *               - sig
 *     responses:
 *       200:
 *         description: Crypto transfer action processed successfully
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
router.post("/crypto/accept-reject-transfer", async (req, res, next) => {
    const response = await TransferController.acceptRejectCryptoTransfer({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
})

/**
 * @swagger
 * /api/auth/transfer/reject-transfer-by-sender:
 *   post:
 *     tags:
 *       - Auth-Transfer routes
 *     summary: Reject a transfer by the sender
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
 *               transferId:
 *                 type: string
 *                 description: Unique identifier of the transfer to reject
 *             required:
 *               - transferId
 *     responses:
 *       200:
 *         description: Transfer rejected successfully by sender
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
router.post("/reject-transfer-by-sender", async (req, res, next) => {
    const response = await TransferController.rejectTransferBySender({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});

/**
 * @swagger
 * /api/auth/transfer/crypto/reject-transfer-by-sender:
 *   post:
 *     tags:
 *       - Auth-Transfer routes
 *     summary: Reject a crypto transfer by the sender
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
 *                 description: Encrypted payload containing transfer details
 *               sig:
 *                 type: string
 *                 description: Signature for the envelope
 *             required:
 *               - envelope
 *               - sig
 *     responses:
 *       200:
 *         description: Crypto transfer rejected successfully by sender
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
router.post("/crypto/reject-transfer-by-sender", async (req, res, next) => {
    const response = await TransferController.rejectCryptoTransferBySender({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});

/**
 * @swagger
 * /api/auth/transfer/get-transfer-history:
 *   post:
 *     tags:
 *       - Auth-Transfer routes
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
 *                   status: ["rejected", "accepted", "pending"]
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
 *                     description: Filter by transfer status (e.g., ["rejected", "accepted", "pending"])
 *                     default: ["rejected", "accepted", "pending"]
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
router.post("/get-transfer-history", async (req, res, next) => {
    const response = await TransferController.getTransferHistory({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
})

/**
 * @swagger
 * /api/auth/transfer/get-transfer-details:
 *   post:
 *     tags:
 *       - Auth-Transfer routes
 *     summary: Get Transfer details by ID
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
 *               transferId:
 *                 type: string
 *                 description: Unique identifier of the Transfer
 *             required:
 *               - transferId
 *     responses:
 *       200:
 *         description: Transfer details retrieved successfully
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
    const response = await TransferController.getTransferById({ headers: req.headers, user: req.user, payload: req.body });
    res.return(response);
});
export default router;
