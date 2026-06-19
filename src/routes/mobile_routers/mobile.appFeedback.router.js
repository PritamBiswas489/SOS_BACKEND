import '../../config/environment.js';
import express from 'express';
import fs from 'fs';
import AppFeedbackController from '../../controllers/appFeedback.controller.js';
import {
  getFeedbackFileSizeErrorMessage,
  getFeedbackFileType,
  isFeedbackFileSizeValid,
  uploadFeedbackFiles,
} from '../../middlewares/feedbackAttachment.js';

const router = express.Router();

/**
 * @swagger
 * /api-mobile/auth/app-feedback/submit-feedback:
 *   post:
 *     summary: Submit app feedback
 *     tags:
 *       - App feedback routes
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
 *               - rating
 *               - message
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               message:
 *                 type: string
 *                 example: "The app is working well."
 *               feedback_files:
 *                 type: array
 *                 maxItems: 3
 *                 description: Up to 3 evidence files (images/audio/documents max 20MB each, videos max 100MB each)
 *                 items:
 *                   type: string
 *                   format: binary
 *           encoding:
 *             feedback_files:
 *               style: form
 *               explode: true
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/submit-feedback', (req, res) => {
  uploadFeedbackFiles.array('feedback_files', 3)(req, res, async function (err) {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: getFeedbackFileSizeErrorMessage(req.evidenceUploadMimetype) });
      }

      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'You can upload a maximum of 3 evidence files.' });
      }

      return res.status(400).json({ error: err.message });
    }

    const invalidFile = (req.files || []).find((file) => !isFeedbackFileSizeValid(file));
    if (invalidFile) {
      (req.files || []).forEach((file) => {
        if (file.path) {
          fs.unlink(file.path, () => { });
        }
      });

      return res.status(400).json({ error: getFeedbackFileSizeErrorMessage(invalidFile.mimetype) });
    }

    const feedbackAttachmentFiles = (req.files || []).map((file) => ({
      file_type: getFeedbackFileType(file.mimetype),
      file_url: file.path.replace(process.cwd(), '').replace(/\\/g, '/'),
    }));

    const response = await AppFeedbackController.submitFeedback({
      payload: { ...req.params, ...req.query, ...req.body, feedback_files: feedbackAttachmentFiles },
      headers: req.headers,
      user: req.user,
    });
    res.return(response);
  });
});

export default router;
