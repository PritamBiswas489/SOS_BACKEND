import "../config/environment.js";
import express from "express";
import NgoController from "../controllers/ngo.controller.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();


// Set up multer storage for NGO certificates
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = "uploads/ngo_certificates";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null,  dir);
    },
    filename: function (req, file, cb) {
        // Use original file name with timestamp to avoid conflicts
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        cb(null, `${basename}-${Date.now()}${ext}`);
    }
});

const upload = multer({ storage: storage });

/**
 * @swagger
 * /api/front-web/ngo/register-ngo:
 *   post:
 *     summary: Register a new NGO
 *     tags:
 *       - NGO Non authenticated routes
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the NGO
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password
 *               numberOfUser:
 *                 type: integer
 *                 description: Number of users
 *               certificate:
 *                 type: string
 *                 format: binary
 *                 description: Certificate file upload
 *     responses:
 *       200:
 *         description: NGO registered successfully
 *       400:
 *         description: Invalid input
 */
router.post("/register-ngo", upload.single("certificate"), async (req, res) => {
    // Attach file info to payload if file is uploaded
    const payload = { ...req.params, ...req.query, ...req.body };
    if (req.file) {
        payload.certificateFile = req.file.path;
    }
    const response = await NgoController.registerNgo({ payload, headers: req.headers });
    res.return(response);
});



/**
 * @swagger
 * /api/front-web/ngo/login-ngo:
 *   post:
 *     summary: NGO login
 *     tags:
 *       - NGO Non authenticated routes
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
 *                 description: NGO email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: NGO password
 *     responses:
 *       200:
 *         description: NGO login successful
 *       400:
 *         description: Invalid credentials
 */
router.post("/login-ngo", async (req, res) => {
    const response = await NgoController.ngoLogin({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});
export default router;