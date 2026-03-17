import "../config/environment.js";
import express from "express";
import EncryptDecryptController from "../controllers/encrypt.decrypt.controller.js";
const router = express.Router();
/**
 * @swagger
 * /api/auth/crypto/encrypt:
 *   post:
 *     tags:
 *       - Encrypt-Decrypt routes
 *     summary: Encrypt data
 *     description: Encrypts the provided payload.
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Data to encrypt
 *             example:
 *               key: "value"
 *     responses:
 *       200:
 *         description: Encrypted result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post("/encrypt", async (req, res, next) => {
    const result = await EncryptDecryptController.encryptRequest({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user
    });
    res.return(result);
});

/**
 * @swagger
 * /api/auth/crypto/decrypt:
 *   post:
 *     tags:
 *       - Encrypt-Decrypt routes
 *     summary: Decrypt data
 *     description: Decrypts the provided payload.
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Data to decrypt
 *             properties:
 *               envelope:
 *                 type: object
 *                 description: Encrypted envelope object
 *                 example: {}
 *               sig:
 *                 type: string
 *                 description: Signature string
 *                 example: "string"
 *     responses:
 *       200:
 *         description: Decrypted result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post("/decrypt", async (req, res, next) => {
    const result = await EncryptDecryptController.decryptRequest({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user
    });
    res.return(result);
});




/**
 * @swagger
 * /api/auth/crypto/aes-256-gcm/encrypt:
 *   post:
 *     tags:
 *       - Encrypt-Decrypt routes
 *     summary: AES-256-GCM Encrypt data
 *     description: Encrypts the provided payload using AES-256-GCM.
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Any JSON data to encrypt
 *             additionalProperties: true
 *             example:
 *               key: "value"
 *               anotherKey: 123
 *     responses:
 *       200:
 *         description: AES-256-GCM Encrypted result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post("/aes-256-gcm/encrypt", async (req, res, next) => {
    const result = await EncryptDecryptController.aes256GcmEncrypt({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user
    });
    res.return(result);
});

/**
 * @swagger
 * /api/auth/crypto/aes-256-gcm/decrypt:
 *   post:
 *     tags:
 *       - Encrypt-Decrypt routes
 *     summary: AES-256-GCM Decrypt data
 *     description: Decrypts the provided payload using AES-256-GCM.
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: AES-256-GCM encrypted data
 *             properties:
 *               iv:
 *                 type: string
 *                 description: Initialization vector
 *                 example: "string"
 *               ct:
 *                 type: string
 *                 description: Ciphertext
 *                 example: "string"
 *     responses:
 *       200:
 *         description: AES-256-GCM Decrypted result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post("/aes-256-gcm/decrypt", async (req, res, next) => {
    const result = await EncryptDecryptController.aes256GcmDecrypts({
        payload: { ...req.params, ...req.query, ...req.body },
        headers: req.headers,
        user: req.user
    });
    res.return(result);
});


export default router;