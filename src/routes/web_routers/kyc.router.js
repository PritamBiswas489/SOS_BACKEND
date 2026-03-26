import "../../config/environment.js";
import express from "express";

import multer from "multer";
import path from "path";
import fs from "fs";
import KycController from "../../controllers/kyc.controller.js";

const router = express.Router();


const kycUploadDir = path.join(process.cwd(), "uploads", "kyc");
if (!fs.existsSync(kycUploadDir)) {
  fs.mkdirSync(kycUploadDir, { recursive: true, mode: 0o755 });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, kycUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB per file
});


/**
 * @swagger
 * /api/auth-web/user/kyc/submit-documents:
 *   post:
 *     summary: Submit KYC details and documents
 *     tags:
 *       - KYC routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Full Name
 *                 default: "John Michael Doe"
 *               residentialAddress:
 *                 type: string
 *                 description: Residential Address
 *                 default: "123 Oak Street, New York, NY 10001"
 *               documentType:
 *                 type: string
 *                 description: Selected document type (Utility Bill, National ID, Driver's License, Int'l Passport)
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Supporting document file
 *     responses:
 *       200:
 *         description: KYC documents submitted successfully
 */

router.post(
  "/submit-documents",
  (req, res, next) => {
    upload.single("document")(req, res, function (err) {
      if (err && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          status: 400,
          error: { message: "Document must be less than 2 MB." },
        });
      } else if (err) {
        return res.status(400).json({
          status: 400,
          error: { message: err.message },
        });
      }
      next();
    });
  },
  async (req, res) => {
    const response = await KycController.submitKycDocuments({
      file: req.file,
      payload: { ...req.params, ...req.query, ...req.body },
      headers: req.headers,
      user: req.user,
    });
    res.return(response);
  },
);
/**
   * @swagger
   * /api/auth-web/user/kyc/get-documents:
   *   get:
   *     summary: Get all KYC documents
   *     tags:
   *       - KYC routes
   *     security:
   *       - bearerAuth: []
   *       - refreshToken: []
   *     responses:
   *       200:
   *         description: List of KYC documents
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   user_id:
   *                     type: integer
   *                   name:
   *                     type: string
   *                   address:
   *                     type: string
   *                   document_type:
   *                     type: string
   *                   document_originalname:
   *                     type: string
   *                   document_path:
   *                     type: string
   *                   status:
   *                     type: string
   *                   created_at:
   *                     type: string
   *                     format: date-time
   *                   updated_at:
   *                     type: string
   *                     format: date-time
   */
router.get("/get-documents", async (req, res) => {
  
  const response = await KycController.getKycDocuments({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});

export default router;
