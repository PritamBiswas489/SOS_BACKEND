import "../../config/environment.js";
import express from "express";
import {
  uploadChatMedia,
  getMediaType,
} from "../../middlewares/chatMediaupload.js";
import ChatController from "../../controllers/chat.controller.js";
const router = express.Router();

/**
 * @swagger
 * /api-mobile/auth/chat/upload-media:
 *   post:
 *     summary: Upload media file for chat
 *     tags:
 *       - Chat with trusted contact routes
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
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Media file to upload (image, video, audio, document).
 *     responses:
 *       200:
 *         description: Media uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Media uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     media_url:
 *                       type: string
 *                       example: "https://example.com/uploads/chat/image123.jpg"
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 */
router.post("/upload-media", (req, res) => {
  uploadChatMedia.single("file")(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
     
    const response = await ChatController.uploadChatMedia({
      file: req.file,
      payload: { ...req.params, ...req.query, ...req.body },
      headers: req.headers,
    
      user: req.user,
    });
    res.return(response);
  });
});

 
export default router;
