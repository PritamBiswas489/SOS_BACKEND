import '../../config/environment.js';
import express from 'express';
import fs from 'fs';
import AbuserReportController from '../../controllers/abuserReport.controller.js';
import { uploadProfileImage } from '../../middlewares/profileImageUpload.js';
import {
  getEvidenceFileSizeErrorMessage,
  getEvidenceFileType,
  isEvidenceFileSizeValid,
  uploadEvidenceFiles,
} from '../../middlewares/evidenceUpload.js';
import { reportAbuserApiRateLimiter } from '../../middlewares/otpRateLimiter.js';

const router = express.Router();

/**
 * @swagger
 * /api-mobile/auth/abuser-report/register-new-abuser:
 *   post:
 *     summary: Register a new abuser
 *     tags:
 *       - Abuser report routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: Full name of the abuser
 *                 example: "John Doe"
 *               alias_name:
 *                 type: string
 *                 description: Alias or known name of the abuser
 *                 example: "Johnny"
 *               gender:
 *                 type: string
 *                 description: Gender of the abuser
 *                 example: "male"
 *               dob:
 *                 type: string
 *                 format: date
 *                 description: Date of birth of the abuser
 *                 example: "1990-01-15"
 *               phone:
 *                 type: string
 *                 description: Phone number of the abuser
 *                 example: "+15551234567"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the abuser
 *                 example: "john@example.com"
 *               address:
 *                 type: string
 *                 description: Address or location details of the abuser
 *                 example: "123 Main Street, New York, NY"
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Abuser photo (optional, JPEG/PNG/GIF/WebP, max 5MB)
 *     responses:
 *       200:
 *         description: Abuser registered successfully
 *       400:
 *         description: Bad request or validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/register-new-abuser', reportAbuserApiRateLimiter, uploadProfileImage.single('photo'), async (req, res) => {
  const payload = { ...req.params, ...req.query, ...req.body };
  if (req.file) {
    payload.photo = `/uploads/profile_images/${req.file.filename}`;
  }

  const response = await AbuserReportController.registerNewAbuser({
    payload,
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
});

/**
 * @swagger
 * /api-mobile/auth/abuser-report/register-new-report:
 *   post:
 *     summary: Register a new abuser report
 *     tags:
 *       - Abuser report routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - abuser_id
 *             properties:
 *               abuser_id:
 *                 type: integer
 *                 description: ID of the abuser being reported
 *                 example: 1
 *               abuse_type:
 *                 type: string
 *                 maxLength: 50
 *                 description: Type/category of abuse
 *                 example: "Harassment"
 *               incident_date:
 *                 type: string
 *                 format: date-time
 *                 description: Date and time of the incident
 *                 example: "2026-06-18T10:30:00.000Z"
 *               incident_location:
 *                 type: string
 *                 description: Location where the incident happened
 *                 example: "123 Main Street, New York, NY"
 *               description:
 *                 type: string
 *                 description: Detailed incident description
 *                 example: "Description of what happened"
 *               witness_information:
 *                 type: string
 *                 description: Witness names or contact information
 *                 example: "Jane Doe, +15551234567"
 *               threat_level:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *                 description: Current threat level
 *                 example: "Medium"
 *               history_of_violence:
 *                 type: boolean
 *                 description: Whether the abuser has a history of violence
 *                 example: true
 *               weapon_access:
 *                 type: boolean
 *                 description: Whether the abuser has access to weapons
 *                 example: false
 *               restraining_order:
 *                 type: boolean
 *                 description: Whether a restraining order exists
 *                 example: false
 *               notes:
 *                 type: string
 *                 description: Additional notes about the report
 *                 example: "Additional context"
 *               evidence_files:
 *                 type: array
 *                 maxItems: 3
 *                 description: Up to 3 evidence files (images/audio/documents max 20MB each, videos max 100MB each)
 *                 items:
 *                   type: string
 *                   format: binary
 *           encoding:
 *             evidence_files:
 *               style: form
 *               explode: true
 *     responses:
 *       200:
 *         description: Abuser report registered successfully
 *       400:
 *         description: Bad request, validation error, or invalid evidence file
 *       401:
 *         description: Unauthorized
 */
router.post('/register-new-report', reportAbuserApiRateLimiter, (req, res) => {
  uploadEvidenceFiles.array('evidence_files', 3)(req, res, async function (err) {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: getEvidenceFileSizeErrorMessage(req.evidenceUploadMimetype) });
      }

      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'You can upload a maximum of 3 evidence files.' });
      }

      return res.status(400).json({ error: err.message });
    }

    const invalidFile = (req.files || []).find((file) => !isEvidenceFileSizeValid(file));
    if (invalidFile) {
      (req.files || []).forEach((file) => {
        if (file.path) {
          fs.unlink(file.path, () => {});
        }
      });

      return res.status(400).json({ error: getEvidenceFileSizeErrorMessage(invalidFile.mimetype) });
    }

    const evidenceFiles = (req.files || []).map((file) => ({
      file_type: getEvidenceFileType(file.mimetype),
      file_url: file.path.replace(process.cwd(), '').replace(/\\/g, '/'),
    }));

    const response = await AbuserReportController.registerNewReport({
      payload: { ...req.params, ...req.query, ...req.body, evidence_files: evidenceFiles },
      headers: req.headers,
      user: req.user,
    });
    res.return(response);
  });
});

/**
 * @swagger
 * /api-mobile/auth/abuser-report/get-my-reports:
 *   get:
 *     summary: Get paginated list of my abuser reports
 *     tags:
 *       - Abuser report routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records per page
 *         example: 10
 *     responses:
 *       200:
 *         description: List of my abuser reports
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/get-my-reports', async (req, res) => {
  const response = await AbuserReportController.getMyReports({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
}
);

/**
 * @swagger
 * /api-mobile/auth/abuser-report/get-existing-abuser:
 *   get:
 *     summary: Get existing abuser details by ID
 *     tags:
 *       - Abuser report routes
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Existing abuser details fetched successfully
 *       400:
 *         description: Bad request or validation error
 *       401:
 *         description: Unauthorized
 */
router.get('/get-existing-abuser', async (req, res) => {
  const response = await AbuserReportController.getExistingAbuser({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
}
);

/**
 * @swagger
 * /api-mobile/auth/abuser-report/delete-report:
 *   post:
 *     summary: Delete an abuser report
 *     tags:
 *       - Abuser report routes
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
 *               - reportId
 *             properties:
 *               reportId:
 *                 type: integer
 *                 description: ID of the report to delete
 *                 example: 12
 *     responses:
 *       200:
 *         description: Abuser report deleted successfully
 *       400:
 *         description: Bad request or validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/delete-report', async (req, res) => {
  const response = await AbuserReportController.deleteReport({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
}
);

/**
 * @swagger
 * /api-mobile/auth/abuser-report/delete-abuser:
 *   post:
 *     summary: Delete an abuser and all related reports and evidence
 *     tags:
 *       - Abuser report routes
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
 *               - abuserId
 *             properties:
 *               abuserId:
 *                 type: integer
 *                 description: ID of the abuser to delete
 *                 example: 12
 *     responses:
 *       200:
 *         description: Abuser deleted successfully along with all related reports and evidence
 *       400:
 *         description: Bad request or validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/delete-abuser', async (req, res) => {
  const response = await AbuserReportController.deleteAbuser({
    payload: { ...req.params, ...req.query, ...req.body },
    headers: req.headers,
    user: req.user,
  });
  res.return(response);
}
);

export default router;
 
